import type { Content } from '../content/schema';
import { markRead, postMessage, replyToEvent, settleOvernight, tickChat } from './chat';
import { addStat, completeStep } from './effects';
import { advanceWork, createGitState, openCr, runGitCommand } from './git';
import { createPipelineState, tickPipeline } from './pipeline';
import { createTickets, resolveTicket, startTicket } from './tickets';
import { acknowledgeReview, addComment, deliverPuzzles, removeComment, requestHint, submitVerdict } from './review';
import { allWorkDone, canLeave, formatClock, hasNextDay, missionDone, missionsToday } from './selectors';
import type { Action, GameState, Setup } from './types';

export const WORK_TASK = 'work';

export function createInitialState(setup: Setup, c: Content): GameState {
  const trust: Record<string, number> = {};
  for (const id of Object.keys(c.npcs)) if (!c.npcs[id].bot) trust[id] = 0;
  return {
    setup,
    phase: 'playing',
    day: 1,
    minute: c.pack.dayStart,
    rng: setup.seed | 0,
    stats: { flow: 0, energy: 100, stress: 10 },
    hidden: { value: 0, credit: 0, techDebt: 0, reviewQuality: 0 },
    trust,
    flags: {},
    stepsDone: [],
    glossary: [],
    cards: [],
    focus: { app: null, task: null },
    chat: { messages: [], queue: [], awaiting: [], fired: [], scheduled: [], unread: {}, nextId: 1 },
    reviews: {},
    git: createGitState(c.git),
    tickets: createTickets(c),
    pipeline: createPipelineState(),
    latentBugs: [],
    late: [],
    metrics: { deepWorkMinutes: 0, interruptions: 0, coffees: 0, breaks: 0, peakFlow: 0, clockedOutAt: null },
    log: [],
  };
}

function endDay(s: GameState): void {
  s.phase = 'dayEnd';
  s.metrics.clockedOutAt = s.minute;
  s.focus = { app: null, task: null };
}

function tickOneMinute(s: GameState, c: Content): void {
  s.minute += 1;

  // Past the normal end of the day you are on borrowed time: it costs twice the energy and builds stress.
  const overtime = s.minute > c.pack.dayEnd;
  addStat(s, 'stats.energy', (overtime ? -16 : -8) / 60);
  if (overtime) addStat(s, 'stats.stress', 0.15);
  const tired = s.stats.energy < 30;

  if (s.focus.task) {
    addStat(s, 'stats.flow', tired ? 0.2 : 0.4);
    if (s.stats.flow >= 50) s.metrics.deepWorkMinutes += 1;
  } else {
    addStat(s, 'stats.flow', -0.3);
  }
  s.metrics.peakFlow = Math.max(s.metrics.peakFlow, s.stats.flow);

  if (s.focus.task === WORK_TASK) advanceWork(s, c, 0.5 + (1.5 * s.stats.flow) / 100);

  tickPipeline(s, c);
  tickChat(s, c);
  deliverPuzzles(s, c);
  checkDeadlines(s, c);

  if (s.minute >= c.pack.sentHomeAt) endDay(s);
}

/** A missed deadline costs some calm and earns a word from the mentor. It never ends the game. */
function checkDeadlines(s: GameState, c: Content): void {
  for (const m of missionsToday(s, c)) {
    if (m.due === undefined || s.minute < m.due || s.late.includes(m.id) || missionDone(s, m)) continue;
    s.late.push(m.id);
    addStat(s, 'stats.stress', 6);
    postMessage(s, c.pack.mentorChannel, c.pack.mentor, `Heads up: "${m.title}" was due at ${formatClock(m.due)}. It happens. Next time, tell me before the deadline, not after: early, I can help.`);
  }
}

function changeFocus(s: GameState, app: string | null, task: string | null): void {
  const previous = s.focus;
  if (previous.task && previous.task !== task) {
    // Leaving a task you were concentrating on costs Flow. Chat is cheaper than starting other deep work.
    const keep = task === null ? 0.7 : 0.5;
    s.stats.flow = s.stats.flow * keep;
    if (app === 'chat') s.metrics.interruptions += 1;
  }
  s.focus = { app, task };
}

/** TICKs are merged so a long session does not bloat the log. */
function appendLog(log: Action[], action: Action): Action[] {
  const last = log[log.length - 1];
  if (action.type === 'TICK' && last?.type === 'TICK') {
    return [...log.slice(0, -1), { type: 'TICK', minutes: last.minutes + action.minutes }];
  }
  return [...log, action];
}

/**
 * The only way game state changes. Pure and deterministic:
 * the same state, action and content always give the same result.
 */
export function step(state: GameState, action: Action, c: Content): GameState {
  if (state.phase !== 'playing' && action.type !== 'START_NEXT_DAY') return state;
  // The next day only opens once today's work is really finished.
  if (action.type === 'START_NEXT_DAY' && (state.phase !== 'dayEnd' || !hasNextDay(state, c) || !allWorkDone(state, c))) return state;

  const { log, ...rest } = state;
  const s: GameState = { ...structuredClone(rest), log };

  switch (action.type) {
    case 'TICK':
      for (let i = 0; i < action.minutes && s.phase === 'playing'; i++) tickOneMinute(s, c);
      break;
    case 'FOCUS':
      changeFocus(s, action.app, action.task);
      break;
    case 'CHAT_READ':
      markRead(s, action.channel);
      break;
    case 'CHAT_REPLY':
      replyToEvent(s, c, action.eventId, action.replyId);
      break;
    case 'REVIEW_COMMENT':
      addComment(s, action.puzzleId, action.comment);
      break;
    case 'REVIEW_REMOVE_COMMENT':
      removeComment(s, action.puzzleId, action.index);
      break;
    case 'REVIEW_HINT':
      requestHint(s, c, action.puzzleId);
      break;
    case 'REVIEW_VERDICT':
      submitVerdict(s, c, action.puzzleId, action.verdict);
      break;
    case 'REVIEW_ACK':
      acknowledgeReview(s, action.puzzleId);
      break;
    case 'GIT_CMD':
      runGitCommand(s, c, action.input);
      break;
    case 'GIT_OPEN_CR':
      openCr(s, c);
      break;
    case 'TICKET_START':
      startTicket(s, action.key);
      break;
    case 'TICKET_RESOLVE':
      resolveTicket(s, c, action.key);
      break;
    case 'COFFEE': {
      const gain = s.metrics.coffees === 0 ? 15 : s.metrics.coffees === 1 ? 7 : 2;
      s.metrics.coffees += 1;
      addStat(s, 'stats.energy', gain);
      s.minute = Math.min(s.minute + 5, c.pack.sentHomeAt);
      break;
    }
    case 'PLAY_GAME': {
      // A break is real rest and real time. A second one with work still open gets noticed.
      s.metrics.breaks += 1;
      s.minute = Math.min(s.minute + 10, c.pack.sentHomeAt);
      addStat(s, 'stats.energy', 6);
      addStat(s, 'stats.stress', action.won ? -14 : -10);
      if (action.opponent) addStat(s, `trust.${action.opponent}`, 1);
      if (s.metrics.breaks >= 2 && !allWorkDone(s, c)) {
        addStat(s, `trust.${c.pack.mentor}`, -1);
        postMessage(s, c.pack.mentorChannel, c.pack.mentor, 'Saw you at the table again 🏓 No judgement, but your list for today is not empty yet.');
      }
      break;
    }
    case 'DISMISS_CARD':
      s.cards.shift();
      break;
    case 'SET_DIFFICULTY':
      s.setup = { ...s.setup, difficulty: action.difficulty };
      break;
    case 'GO_HOME':
      if (canLeave(s, c)) {
        completeStep(s, `leave:${s.day}`);
        endDay(s);
      }
      break;
    case 'START_NEXT_DAY':
      settleOvernight(s, c);
      s.day += 1;
      s.minute = c.pack.dayStart;
      s.phase = 'playing';
      s.stats.energy = 100;
      s.stats.flow = 0;
      s.stats.stress = Math.max(0, s.stats.stress - 10);
      s.metrics.coffees = 0;
      s.metrics.breaks = 0;
      s.metrics.clockedOutAt = null;
      break;
  }

  s.log = appendLog(log, action);
  return s;
}

export function replay(setup: Setup, log: Action[], c: Content): GameState {
  return log.reduce((s, a) => step(s, a, c), createInitialState(setup, c));
}
