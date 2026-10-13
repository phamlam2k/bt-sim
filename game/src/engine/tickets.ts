import type { Content, Ticket, TicketStatus } from '../content/schema';
import { completeStep } from './effects';
import type { GameState, TicketState } from './types';

export const PLAYER_ID = 'player';
export const SYSTEM_ID = 'system';

export function findTicket(c: Content, key: string): Ticket | undefined {
  return c.tickets.find((t) => t.key === key);
}

export function createTickets(c: Content): Record<string, TicketState> {
  return Object.fromEntries(c.tickets.map((t) => [t.key, { status: t.status, assignee: t.assignee, activity: [] }]));
}

export function logTicket(s: GameState, key: string, who: string, text: string): void {
  s.tickets[key]?.activity.push({ day: s.day, minute: s.minute, who, text });
}

function move(s: GameState, key: string, status: TicketStatus, who: string, text: string): void {
  const t = s.tickets[key];
  if (!t) return;
  t.status = status;
  logTicket(s, key, who, text);
}

export function assignTicket(s: GameState, key: string, to: string, by: string): void {
  const t = s.tickets[key];
  if (!t || t.assignee === to) return;
  t.assignee = to;
  logTicket(s, key, by, to === by ? 'Picked this up.' : `Assigned to ${to === PLAYER_ID ? s.setup.playerName : to}.`);
}

/** The player says "this is mine and I have begun". */
export function startTicket(s: GameState, key: string): void {
  const t = s.tickets[key];
  if (!t || t.assignee !== PLAYER_ID || t.status !== 'open') return;
  move(s, key, 'progress', PLAYER_ID, 'Started work.');
  completeStep(s, `ticket:start:${key}`);
}

/** Creating the branch counts as starting, so a player who skips the Tickets app is never stuck. */
export function startTicketFromBranch(s: GameState, c: Content): void {
  const key = c.git.ticketKey;
  const t = s.tickets[key];
  if (!t || t.status !== 'open') return;
  if (t.assignee !== PLAYER_ID) assignTicket(s, key, PLAYER_ID, PLAYER_ID);
  move(s, key, 'progress', SYSTEM_ID, 'Moved to In progress when a branch was created for this ticket.');
  completeStep(s, `ticket:start:${key}`);
}

export function ticketCrOpened(s: GameState, c: Content): void {
  const term = c.pack.terminology.changeRequest;
  move(s, c.git.ticketKey, 'review', PLAYER_ID, `Opened a ${term}. Waiting for a reviewer.`);
}

export function ticketCrMerged(s: GameState, c: Content): void {
  const term = c.pack.terminology.changeRequest;
  logTicket(s, c.git.ticketKey, c.pack.mentor, `Approved the ${term}. Merged to ${c.pack.terminology.mainBranch}; the pipeline has it now.`);
}

export function ticketDeployed(s: GameState, c: Content): void {
  logTicket(s, c.git.ticketKey, SYSTEM_ID, 'Deployed to production. No alarms.');
}

/** True once the work behind the player's ticket is really finished, so closing it would be honest. */
export function canResolve(s: GameState, c: Content, key: string): boolean {
  const t = s.tickets[key];
  if (!t || t.assignee !== PLAYER_ID || t.status === 'resolved') return false;
  return key === c.git.ticketKey ? s.pipeline.finishedAt !== null : t.status !== 'open';
}

export function resolveTicket(s: GameState, c: Content, key: string): void {
  if (!canResolve(s, c, key)) return;
  move(s, key, 'resolved', PLAYER_ID, 'Resolved: the fix is live for all customers.');
  completeStep(s, `ticket:resolve:${key}`);
}

/** A teammate's ticket follows the change request the player reviews for it. */
export function ticketReviewRequested(s: GameState, c: Content, puzzleId: string): void {
  const t = c.tickets.find((x) => x.puzzle === puzzleId);
  if (!t || !t.assignee) return;
  const term = c.pack.terminology.changeRequest;
  move(s, t.key, 'review', t.assignee, `Opened a ${term} and asked ${s.setup.playerName} to review it.`);
}

export function ticketReviewed(s: GameState, c: Content, puzzleId: string, verdict: 'approve' | 'changes'): void {
  const t = c.tickets.find((x) => x.puzzle === puzzleId);
  if (!t) return;
  const term = c.pack.terminology.changeRequest;
  if (verdict === 'approve') move(s, t.key, 'resolved', PLAYER_ID, `Approved the ${term}. It merged and shipped.`);
  else move(s, t.key, 'progress', PLAYER_ID, `Requested changes on the ${term}. Back with the author.`);
}
