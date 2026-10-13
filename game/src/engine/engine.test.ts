import { describe, expect, it } from 'vitest';
import { loadRainforest } from '../content/rainforest';
import { validateContent } from '../content/schema';
import { isGoodCommitMessage } from './git';
import { scoreReview } from './review';
import { allWorkDone, canLeave, gitSuggestion, hasNextDay, nextStep, openMissions, ticketsNeedingAction } from './selectors';
import { createInitialState, replay, step } from './step';
import type { Action, GameState, ReviewSession, Setup } from './types';

const c = loadRainforest();
const setup: Setup = { playerName: 'Linh', difficulty: 'guided', lang: 'python', seed: 42, packId: c.pack.id, packVersion: c.pack.version };

function run(state: GameState, actions: Action[]): GameState {
  return actions.reduce((s, a) => step(s, a, c), state);
}
const tick = (minutes: number): Action => ({ type: 'TICK', minutes });
const git = (input: string): Action => ({ type: 'GIT_CMD', input });

/** Ticks until `done` is true, failing loudly instead of looping forever. */
function tickUntil(state: GameState, done: (s: GameState) => boolean, limit = 600): GameState {
  let s = state;
  for (let i = 0; i < limit && !done(s); i++) s = step(s, tick(1), c);
  if (!done(s)) throw new Error('tickUntil: condition never became true');
  return s;
}

function session(comments: ReviewSession['comments']): ReviewSession {
  return { deliveredAt: 0, comments, hintTier: 0, verdict: null, result: null, acknowledged: false, attempts: 0, firstResult: null, needsRework: false };
}
const puzzle = (id: string) => c.puzzles.find((p) => p.id === id)!;

type Answer = { comments: ReviewSession['comments']; verdict: 'approve' | 'changes' };
const PERFECT: Record<string, Answer> = {
  'cr-201': { comments: [{ kind: 'bug', line: 9, category: 'secret-in-code' }, { kind: 'cr', line: null, category: 'missing-description' }], verdict: 'changes' },
  'cr-202': { comments: [], verdict: 'approve' },
  'cr-203': { comments: [{ kind: 'bug', line: 7, category: 'no-timeout' }, { kind: 'cr', line: null, category: 'missing-tests' }], verdict: 'changes' },
  'cr-204': { comments: [{ kind: 'bug', line: 8, category: 'off-by-one' }, { kind: 'bug', line: 13, category: 'pii-in-logs' }], verdict: 'changes' },
  'cr-205': { comments: [{ kind: 'bug', line: 12, category: 'unbounded-retry' }, { kind: 'bug', line: 15, category: 'swallowed-error' }], verdict: 'changes' },
};

function review(state: GameState, id: string, answer: Answer = PERFECT[id]): GameState {
  let s = tickUntil(state, (x) => !!x.reviews[id]);
  s = run(s, [{ type: 'FOCUS', app: 'review', task: `review:${id}` }, tick(10)]);
  s = run(s, answer.comments.map((comment): Action => ({ type: 'REVIEW_COMMENT', puzzleId: id, comment })));
  return run(s, [{ type: 'REVIEW_VERDICT', puzzleId: id, verdict: answer.verdict }, { type: 'REVIEW_ACK', puzzleId: id }]);
}

function reply(state: GameState, eventId: string, replyId: string): GameState {
  const s = tickUntil(state, (x) => x.chat.awaiting.some((a) => a.eventId === eventId));
  return run(s, [{ type: 'CHAT_REPLY', eventId, replyId }]);
}

function playDay1(state = createInitialState(setup, c)): GameState {
  let s = reply(state, 'welcome', 'excited');
  s = run(s, [tick(4), { type: 'TICKET_START', key: 'QS-101' }, git('git switch -c feature/QS-101-fix-typo'), { type: 'FOCUS', app: 'git', task: 'work' }]);
  s = tickUntil(s, (x) => x.git.modified);
  s = run(s, [git('git add .'), git('git commit -m "Fix typo in message-not-found error"'), git('git push'), { type: 'GIT_OPEN_CR' }]);
  s = tickUntil(s, (x) => x.stepsDone.includes('git:live'));
  return run(s, [{ type: 'DISMISS_CARD' }, { type: 'TICKET_RESOLVE', key: 'QS-101' }, { type: 'GO_HOME' }]);
}

function startDay2(): GameState {
  return reply(run(playDay1(), [{ type: 'START_NEXT_DAY' }]), 'd2_morning', 'ready');
}

function playDay2(): GameState {
  return run(review(review(startDay2(), 'cr-201'), 'cr-202'), [{ type: 'GO_HOME' }]);
}

function playDay3(): GameState {
  let s = reply(run(playDay2(), [{ type: 'START_NEXT_DAY' }]), 'd3_morning', 'go');
  for (const id of ['cr-203', 'cr-204', 'cr-205']) s = review(s, id);
  return s;
}

describe('content pack', () => {
  it('passes cross-reference validation', () => {
    expect(validateContent(c)).toEqual([]);
  });

  it('reports broken references', () => {
    const broken = structuredClone(c);
    broken.puzzles[0].variants.python.issueLines.secret = [999];
    broken.chats[0].channel = 'nowhere';
    broken.puzzles[1].day = 3;
    const problems = validateContent(broken);
    expect(problems.some((p) => p.includes('out of range'))).toBe(true);
    expect(problems.some((p) => p.includes('unknown channel'))).toBe(true);
    expect(problems.some((p) => p.includes('its mission step is on day'))).toBe(true);
  });
});

describe('chat', () => {
  it('delivers the welcome thread and waits for a reply', () => {
    const s = run(createInitialState(setup, c), [tick(5)]);
    expect(s.chat.messages.filter((m) => m.channel === 'dm-maya')).toHaveLength(3);
    expect(s.chat.messages[0].text).toContain('Linh');
    expect(s.chat.awaiting.map((a) => a.eventId)).toEqual(['welcome']);
    expect(nextStep(s, c)?.stepId).toBe('chat:hello');
  });

  it('applies reply effects and schedules the follow-up event', () => {
    let s = run(createInitialState(setup, c), [tick(5), { type: 'CHAT_REPLY', eventId: 'welcome', replyId: 'nervous' }]);
    expect(s.trust.maya).toBe(3);
    expect(s.stepsDone).toContain('chat:hello');
    expect(s.chat.awaiting).toHaveLength(0);
    s = run(s, [tick(4)]);
    expect(s.chat.fired).toContain('first_ticket');
    expect(s.glossary).toContain('branch');
  });

  it('penalises ignoring the manager', () => {
    const asked = tickUntil(review(startDay2(), 'cr-201'), (x) => x.chat.awaiting.some((a) => a.eventId === 'manager_sec'));
    const ignored = tickUntil(asked, (x) => x.chat.awaiting.every((a) => a.eventId !== 'manager_sec'));
    expect(ignored.trust.rohan).toBe(-5);
  });
});

describe('git', () => {
  it('rejects a push to main and lets the player recover', () => {
    let s = run(createInitialState(setup, c), [{ type: 'FOCUS', app: 'git', task: 'work' }]);
    s = tickUntil(s, (x) => x.git.modified);
    s = run(s, [git('git add .'), git('git commit -m "Fix typo in error message"'), git('git push')]);
    expect(s.git.terminal.some((l) => l.kind === 'err' && l.text.includes('protected'))).toBe(true);
    expect(s.stepsDone).not.toContain('git:push');
    expect(gitSuggestion(s, c).command).toContain('git switch -c');
    s = run(s, [git('git switch -c feature/QS-101-fix-typo'), git('git push'), { type: 'GIT_OPEN_CR' }]);
    expect(s.git.crOpen).toBe(true);
    expect(s.flags.cr_opened).toBe(true);
  });

  it('will not push a branch with no commits', () => {
    const s = run(createInitialState(setup, c), [git('git switch -c feature/QS-101-fix-typo'), git('git push')]);
    expect(s.stepsDone).not.toContain('git:push');
  });

  it('judges commit messages', () => {
    expect(isGoodCommitMessage('fix')).toBe(false);
    expect(isGoodCommitMessage('Fix typo in message-not-found error')).toBe(true);
  });

  it('works faster with more Flow', () => {
    const base = run(createInitialState(setup, c), [{ type: 'FOCUS', app: 'git', task: 'work' }]);
    const cold = run(base, [tick(5)]).git.workProgress;
    const hot = run({ ...base, stats: { ...base.stats, flow: 80 } }, [tick(5)]).git.workProgress;
    expect(hot).toBeGreaterThan(cold);
  });
});

describe('review scoring', () => {
  it('gives full marks for finding everything with the right verdict', () => {
    const r = scoreReview(puzzle('cr-203'), 'python', session(PERFECT['cr-203'].comments), 'changes');
    expect(r.score).toBe(100);
    expect(r.verdictCorrect).toBe(true);
  });

  it('gives partial credit for the right line with the wrong category', () => {
    const r = scoreReview(puzzle('cr-201'), 'python', session([{ kind: 'bug', line: 9, category: 'logic' }]), 'changes');
    expect(r.outcomes.find((o) => o.issueId === 'secret')).toEqual({ issueId: 'secret', found: true, categoryRight: false });
    expect(r.score).toBe(30);
  });

  it('penalises a false alarm on a clean CR', () => {
    const r = scoreReview(puzzle('cr-202'), 'python', session([{ kind: 'bug', line: 6, category: 'null-handling' }]), 'changes');
    expect(r.falsePositives).toBe(1);
    expect(r.verdictCorrect).toBe(false);
    expect(r.score).toBe(60);
  });

  it('does not count nits or questions as false alarms', () => {
    const r = scoreReview(puzzle('cr-202'), 'python', session([{ kind: 'nit', line: 5 }, { kind: 'question', line: 8 }]), 'approve');
    expect(r.falsePositives).toBe(0);
    expect(r.score).toBe(100);
  });

  it('rubber-stamping a dangerous CR scores zero, and the mentor sends it back', () => {
    const s = review(startDay2(), 'cr-201', { comments: [], verdict: 'approve' });
    expect(s.reviews['cr-201'].firstResult?.score).toBe(0);
    expect(s.latentBugs).toEqual([{ puzzleId: 'cr-201', issueId: 'secret' }]);
    expect(s.stepsDone).not.toContain('review:cr-201');
  });
});

describe('hints', () => {
  it('are free in Guided, cost trust in Standard, and are off in Realistic', () => {
    const base = tickUntil(startDay2(), (x) => !!x.reviews['cr-201']);
    const ask = (difficulty: Setup['difficulty']) => run(base, [{ type: 'SET_DIFFICULTY', difficulty }, { type: 'REVIEW_HINT', puzzleId: 'cr-201' }]);
    expect(ask('guided').reviews['cr-201'].hintTier).toBe(1);
    expect(ask('guided').trust.maya).toBe(base.trust.maya);
    expect(ask('standard').trust.maya).toBe(base.trust.maya - 2);
    expect(ask('realistic').reviews['cr-201'].hintTier).toBe(0);
  });
});

describe('day one', () => {
  it('has no code review: it ends when the first change is live', () => {
    const s = playDay1();
    expect(s.phase).toBe('dayEnd');
    expect(s.git.merged).toBe(true);
    expect(s.stepsDone).toContain('leave:1');
    expect(Object.keys(s.reviews)).toEqual([]);
    expect(s.minute).toBeLessThan(c.pack.dayEnd);
  });

  it('keeps the player on a next step while the change travels to production', () => {
    let s = reply(createInitialState(setup, c), 'welcome', 'excited');
    s = run(s, [git('git switch -c feature/QS-101-fix-typo'), { type: 'FOCUS', app: 'git', task: 'work' }]);
    s = tickUntil(s, (x) => x.git.modified);
    s = run(s, [git('git add .'), git('git commit -m "Fix typo in message-not-found error"'), git('git push'), { type: 'GIT_OPEN_CR' }]);
    expect(nextStep(s, c)?.stepId).toBe('git:live');
    expect(canLeave(s, c)).toBe(false);
    s = tickUntil(s, (x) => x.stepsDone.includes('git:live'));
    expect(s.cards).toContain('first_change_live');
    expect(nextStep(s, c)?.stepId).toBe('ticket:resolve:QS-101');
    s = run(s, [{ type: 'TICKET_RESOLVE', key: 'QS-101' }]);
    expect(nextStep(s, c)?.stepId).toBe('leave:1');
  });

  it('sends the player home late if nothing gets done, and will not open day two', () => {
    const s = run(createInitialState(setup, c), [tick(700)]);
    expect(s.phase).toBe('dayEnd');
    expect(s.minute).toBe(c.pack.sentHomeAt);
    expect(s.stats.stress).toBeGreaterThan(20);
    expect(run(s, [{ type: 'START_NEXT_DAY' }])).toBe(s);
  });

  it('will not let the player go home with work still open', () => {
    const s = run(reply(createInitialState(setup, c), 'welcome', 'excited'), [tick(4)]);
    expect(canLeave(s, c)).toBe(false);
    expect(run(s, [{ type: 'GO_HOME' }]).phase).toBe('playing');
    expect(openMissions(s, c).map((m) => m.id)).toEqual(['first-change']);
  });
});

describe('rework', () => {
  const blind = { comments: [], verdict: 'approve' } as Answer;
  const submit = (s: GameState, id: string, a: Answer) =>
    run(s, [...a.comments.map((comment): Action => ({ type: 'REVIEW_COMMENT', puzzleId: id, comment })), { type: 'REVIEW_VERDICT', puzzleId: id, verdict: a.verdict }]);

  it('comes back until the serious problems are found, with a stronger hint each time', () => {
    let s = tickUntil(startDay2(), (x) => !!x.reviews['cr-201']);
    s = submit(s, 'cr-201', blind);
    expect(s.reviews['cr-201']).toMatchObject({ needsRework: true, attempts: 1 });
    expect(nextStep(s, c)?.stepId).toBe('review:cr-201');

    s = run(s, [{ type: 'REVIEW_ACK', puzzleId: 'cr-201' }]);
    expect(s.reviews['cr-201']).toMatchObject({ verdict: null, result: null, needsRework: false, hintTier: 1, acknowledged: false });

    s = run(submit(s, 'cr-201', blind), [{ type: 'REVIEW_ACK', puzzleId: 'cr-201' }]);
    s = run(submit(s, 'cr-201', blind), [{ type: 'REVIEW_ACK', puzzleId: 'cr-201' }]);
    expect(s.reviews['cr-201'].hintTier).toBe(3);
    expect(s.trust.maya).toBe(tickUntil(startDay2(), (x) => !!x.reviews['cr-201']).trust.maya);

    s = run(submit(s, 'cr-201', PERFECT['cr-201']), [{ type: 'REVIEW_ACK', puzzleId: 'cr-201' }]);
    expect(s.stepsDone).toContain('review:cr-201');
    expect(s.reviews['cr-201']).toMatchObject({ attempts: 4, acknowledged: true, needsRework: false });
    // The record keeps the first attempt, and the miss is counted once.
    expect(s.reviews['cr-201'].firstResult?.score).toBe(0);
    expect(s.latentBugs).toHaveLength(1);
  });

  it('also sends back a clean CR that was blocked', () => {
    let s = review(startDay2(), 'cr-201');
    s = tickUntil(s, (x) => !!x.reviews['cr-202']);
    s = submit(s, 'cr-202', { comments: [], verdict: 'changes' });
    expect(s.reviews['cr-202'].needsRework).toBe(true);
    expect(s.tickets['QS-99'].status).toBe('review');
    s = run(s, [{ type: 'REVIEW_ACK', puzzleId: 'cr-202' }, { type: 'REVIEW_VERDICT', puzzleId: 'cr-202', verdict: 'approve' }]);
    expect(s.stepsDone).toContain('review:cr-202');
    expect(s.tickets['QS-99'].status).toBe('resolved');
  });
});

describe('deadlines and breaks', () => {
  it('marks work late once, with a word from the mentor', () => {
    const before = run(createInitialState(setup, c), [tick(29)]);
    expect(before.late).toEqual([]);
    const s = run(before, [tick(5)]);
    expect(s.late).toEqual(['meet']);
    expect(s.stats.stress).toBeGreaterThan(before.stats.stress);
    expect(s.chat.messages.some((m) => m.channel === 'dm-maya' && m.text.includes('was due at 9:30 AM'))).toBe(true);
    expect(run(s, [tick(30)]).late).toEqual(['meet']);
  });

  it('does not mark finished work late', () => {
    expect(playDay1().late).toEqual([]);
  });

  it('a game restores the player, and a second one with work open is noticed', () => {
    const base = { ...createInitialState(setup, c), stats: { flow: 0, energy: 50, stress: 40 } };
    let s = run(base, [{ type: 'PLAY_GAME', won: true, opponent: 'dev' }]);
    expect(s).toMatchObject({ minute: base.minute + 10, stats: { energy: 56, stress: 26 } });
    expect(s.trust.dev).toBe(1);
    expect(s.trust.maya).toBe(0);
    s = run(s, [{ type: 'PLAY_GAME', won: false, opponent: 'dev' }]);
    expect(s.trust.maya).toBe(-1);
  });
});

describe('office map', () => {
  it('reports a floor that cannot be walked', () => {
    const broken = structuredClone(c);
    broken.office.map[6] = '######################';
    expect(validateContent(broken).some((p) => p.includes('cannot be reached from the start'))).toBe(true);
    const ragged = structuredClone(c);
    ragged.office.map[3] = '#...#';
    expect(validateContent(ragged).some((p) => p.includes('wide, expected'))).toBe(true);
    const unknown = structuredClone(c);
    unknown.office.map[1] = '#.........Z..........#';
    expect(validateContent(unknown).some((p) => p.includes('not in tiles'))).toBe(true);
  });
});

describe('tickets', () => {
  const assigned = () => run(reply(createInitialState(setup, c), 'welcome', 'excited'), [tick(4)]);

  it('starts unowned, then the mentor assigns it', () => {
    const before = reply(createInitialState(setup, c), 'welcome', 'excited');
    expect(before.tickets['QS-101']).toMatchObject({ status: 'open', assignee: null });
    expect(nextStep(before, c)).toMatchObject({ stepId: 'ticket:start:QS-101', waiting: true, app: 'chat' });
    expect(run(before, [{ type: 'TICKET_START', key: 'QS-101' }]).tickets['QS-101'].status).toBe('open');

    const s = assigned();
    expect(s.tickets['QS-101'].assignee).toBe('player');
    expect(s.tickets['QS-101'].activity.map((a) => a.who)).toEqual(['maya']);
    expect(ticketsNeedingAction(s, c)).toEqual(['QS-101']);
    expect(nextStep(s, c)).toMatchObject({ stepId: 'ticket:start:QS-101', waiting: false, app: 'tickets' });
  });

  it('follows the change from start to production, and only then can be resolved', () => {
    let s = run(assigned(), [{ type: 'TICKET_START', key: 'QS-101' }]);
    expect(s.tickets['QS-101'].status).toBe('progress');
    expect(ticketsNeedingAction(s, c)).toEqual([]);

    s = run(s, [git('git switch -c feature/QS-101-fix-typo'), { type: 'FOCUS', app: 'git', task: 'work' }]);
    s = tickUntil(s, (x) => x.git.modified);
    s = run(s, [git('git add .'), git('git commit -m "Fix typo in message-not-found error"'), git('git push'), { type: 'GIT_OPEN_CR' }]);
    expect(s.tickets['QS-101'].status).toBe('review');
    expect(run(s, [{ type: 'TICKET_RESOLVE', key: 'QS-101' }]).tickets['QS-101'].status).toBe('review');

    s = tickUntil(s, (x) => x.pipeline.finishedAt !== null);
    expect(ticketsNeedingAction(s, c)).toEqual(['QS-101']);
    s = run(s, [{ type: 'TICKET_RESOLVE', key: 'QS-101' }]);
    expect(s.tickets['QS-101'].status).toBe('resolved');
    expect(s.stepsDone).toContain('ticket:resolve:QS-101');
    expect(s.tickets['QS-101'].activity.map((a) => a.who)).toEqual(['maya', 'player', 'player', 'maya', 'system', 'player']);
  });

  it('counts creating the branch as starting, so skipping the app never blocks the player', () => {
    const s = run(createInitialState(setup, c), [git('git switch -c feature/QS-101-fix-typo')]);
    expect(s.tickets['QS-101']).toMatchObject({ status: 'progress', assignee: 'player' });
    expect(s.stepsDone).toContain('ticket:start:QS-101');
  });

  it("moves a teammate's ticket with the player's review", () => {
    let s = tickUntil(startDay2(), (x) => !!x.reviews['cr-201']);
    expect(s.tickets['QS-96'].status).toBe('review');
    s = review(s, 'cr-201');
    expect(s.tickets['QS-96'].status).toBe('progress');
    s = review(s, 'cr-202');
    expect(s.tickets['QS-99'].status).toBe('resolved');
  });
});

describe('pipeline', () => {
  it('starts only after the merge and passes one stage at a time', () => {
    let s = run(reply(createInitialState(setup, c), 'welcome', 'excited'), [tick(4), git('git switch -c feature/QS-101-fix-typo'), { type: 'FOCUS', app: 'git', task: 'work' }]);
    s = tickUntil(s, (x) => x.git.modified);
    s = run(s, [git('git add .'), git('git commit -m "Fix typo in message-not-found error"'), git('git push'), { type: 'GIT_OPEN_CR' }]);
    expect(s.pipeline.startedAt).toBeNull();

    s = tickUntil(s, (x) => x.git.merged);
    expect(s.pipeline).toMatchObject({ startedAt: s.minute, stage: 0, finishedAt: null });
    s = tickUntil(s, (x) => x.pipeline.stage === 1);
    expect(s.chat.messages.filter((m) => m.channel === 'deploys')).toHaveLength(1);
    expect(s.stepsDone).not.toContain('git:live');

    s = tickUntil(s, (x) => x.pipeline.finishedAt !== null);
    expect(s.chat.messages.filter((m) => m.channel === 'deploys')).toHaveLength(c.pipeline.stages.length);
    expect(s.pipeline.finishedAt! - s.pipeline.startedAt!).toBe(c.pipeline.stages.reduce((n, st) => n + st.minutes, 0));
    expect(s.stepsDone).toContain('git:live');
  });
});

describe('following days', () => {
  it('starts day two fresh, with a new set of steps', () => {
    const evening = playDay1();
    expect(hasNextDay(evening, c)).toBe(true);
    const s = run(evening, [{ type: 'START_NEXT_DAY' }]);
    expect(s).toMatchObject({ day: 2, phase: 'playing', minute: c.pack.dayStart });
    expect(s.stats.energy).toBe(100);
    expect(s.chat.queue).toEqual([]);
    expect(nextStep(s, c)?.stepId).toBe('chat:d2');
    expect(run(s, [tick(30)]).reviews).toEqual({});
  });

  it('cannot skip ahead while a day is still running', () => {
    const s = createInitialState(setup, c);
    expect(run(s, [{ type: 'START_NEXT_DAY' }])).toBe(s);
  });

  it('can be played to the end of day three with perfect reviews', () => {
    let s = playDay3();
    for (const id of Object.keys(PERFECT)) expect(s.reviews[id].result?.score, id).toBe(100);
    expect(s.latentBugs).toEqual([]);
    expect(allWorkDone(s, c)).toBe(true);
    s = run(s, [{ type: 'GO_HOME' }]);
    expect(s.phase).toBe('dayEnd');
    expect(hasNextDay(s, c)).toBe(false);
    expect(run(s, [{ type: 'START_NEXT_DAY' }])).toBe(s);
  });

  it('replays to the identical state from the action log', () => {
    const s = run(playDay3(), [{ type: 'COFFEE' }, tick(3)]);
    expect(replay(setup, s.log, c)).toEqual(s);
  });

  it('survives a save and load round trip', () => {
    const s = playDay2();
    const restored = JSON.parse(JSON.stringify(s)) as GameState;
    const next: Action[] = [{ type: 'START_NEXT_DAY' }, tick(7)];
    expect(run(restored, next)).toEqual(run(s, next));
  });
});
