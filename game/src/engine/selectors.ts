import type { Content, Mission } from '../content/schema';
import { canOpenCr } from './git';
import { canResolve, PLAYER_ID } from './tickets';
import type { GameState } from './types';

export function formatClock(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = Math.floor(minute % 60);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

const isClockOut = (stepId: string) => stepId.startsWith('leave:');

export function missionsToday(s: GameState, c: Content): Mission[] {
  return c.missions.filter((m) => m.day === s.day);
}

export function hasNextDay(s: GameState, c: Content): boolean {
  return c.missions.some((m) => m.day === s.day + 1);
}

export function allWorkDone(s: GameState, c: Content): boolean {
  return missionsToday(s, c)
    .flatMap((m) => m.steps.map((st) => st.id))
    .filter((id) => !isClockOut(id))
    .every((id) => s.stepsDone.includes(id));
}

/** Nobody clocks out here: you go home when today's work is done. */
export function canLeave(s: GameState, c: Content): boolean {
  return s.phase === 'playing' && allWorkDone(s, c);
}

export function missionDone(s: GameState, mission: Mission): boolean {
  return mission.steps.filter((st) => !isClockOut(st.id)).every((st) => s.stepsDone.includes(st.id));
}

/** Missions still open today, soonest deadline first. */
export function openMissions(s: GameState, c: Content): Mission[] {
  return missionsToday(s, c)
    .filter((m) => !missionDone(s, m) && m.steps.some((st) => !isClockOut(st.id)))
    .sort((a, b) => (a.due ?? Infinity) - (b.due ?? Infinity));
}

export interface NextStep {
  mission: Mission;
  stepId: string;
  text: string;
  app?: string;
  /** Nothing to do on this step yet; the game is about to deliver it. */
  waiting: boolean;
}

/** The single "what do I do now?" answer shown in the Today panel. Never returns null while playing. */
export function nextStep(s: GameState, c: Content): NextStep | null {
  for (const mission of missionsToday(s, c)) {
    for (const st of mission.steps) {
      if (s.stepsDone.includes(st.id)) continue;
      if (isClockOut(st.id) && !allWorkDone(s, c)) continue;
      if (st.id.startsWith('ticket:start:') && s.tickets[st.id.slice('ticket:start:'.length)]?.assignee !== PLAYER_ID) {
        return { mission, stepId: st.id, text: 'Your first ticket is on its way. Keep an eye on your messages.', app: 'chat', waiting: true };
      }
      if (st.id.startsWith('review:') && !s.reviews[st.id.slice('review:'.length)]) {
        return { mission, stepId: st.id, text: `A new ${c.pack.terminology.changeRequest} is on its way. Check your messages while you wait.`, app: 'chat', waiting: true };
      }
      return { mission, stepId: st.id, text: st.text, app: st.app, waiting: false };
    }
  }
  return null;
}

export function missionProgress(s: GameState, mission: Mission): { done: number; total: number } {
  return {
    done: mission.steps.filter((st) => s.stepsDone.includes(st.id)).length,
    total: mission.steps.length,
  };
}

/** NPCs whose next message lands within two game minutes, per channel. Drives the "typing…" indicator. */
export function typingByChannel(s: GameState, c: Content): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of s.chat.queue) {
    if (q.at - s.minute > 2) continue;
    const e = c.chats.find((x) => x.id === q.eventId);
    if (e) out[e.channel] = e.from;
  }
  return out;
}

export function unreadTotal(s: GameState): number {
  return Object.values(s.chat.unread).reduce((a, b) => a + b, 0);
}

export function pendingReviews(s: GameState, c: Content): string[] {
  return c.puzzles.filter((p) => s.reviews[p.id] && !s.reviews[p.id].verdict).map((p) => p.id);
}

/** Tickets of the player's that need a click: one to start, or one whose work has shipped and can be closed. */
export function ticketsNeedingAction(s: GameState, c: Content): string[] {
  return c.tickets
    .map((t) => t.key)
    .filter((key) => s.tickets[key]?.assignee === PLAYER_ID && (s.tickets[key].status === 'open' || canResolve(s, c, key)));
}

/** The command Guided mode offers as a one-click chip, or a plain instruction when no command applies. */
export function gitSuggestion(s: GameState, c: Content): { command?: string; note?: string } {
  const g = s.git;
  if (g.merged) return { note: 'Your change is merged. Nothing left to do here.' };
  if (g.crOpen) return { note: `Your ${c.pack.terminology.changeRequest} is with a reviewer. Go review someone else's while you wait.` };
  if (g.branch === 'main' && g.commits.every((x) => x.branch === 'main')) return { command: `git switch -c ${c.git.suggestedBranch}` };
  if (g.workProgress < c.git.workPoints) return { note: 'Click into the editor and stay there until the fix is written.' };
  if (g.modified && !g.staged) return { command: 'git add .' };
  if (g.staged) return { command: `git commit -m "${c.git.suggestedCommitMessage}"` };
  if (canOpenCr(g)) return { note: `Press "Open ${c.pack.terminology.changeRequest}".` };
  if (g.branch !== 'main' && g.branches[g.branch] !== g.remote[g.branch]) return { command: 'git push' };
  return { command: 'git status' };
}
