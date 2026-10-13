import type { Content } from '../content/schema';
import { evalCondition } from './conditions';
import { applyEffects } from './effects';
import type { GameState } from './types';

export const PLAYER = 'player';

export function postMessage(s: GameState, channel: string, from: string, raw: string, eventId?: string): void {
  const text = raw.replaceAll('{name}', s.setup.playerName);
  s.chat.messages.push({ id: s.chat.nextId++, channel, from, text, minute: s.minute, eventId });
  if (from !== PLAYER) s.chat.unread[channel] = (s.chat.unread[channel] ?? 0) + 1;
}

function fireDueEvents(s: GameState, c: Content): void {
  for (const e of c.chats) {
    if (s.chat.fired.includes(e.id)) continue;
    const scheduled = s.chat.scheduled.find((x) => x.eventId === e.id);
    const due = scheduled ? scheduled.at <= s.minute : e.day === s.day && evalCondition(s, e.when);
    if (!due) continue;
    s.chat.fired.push(e.id);
    s.chat.scheduled = s.chat.scheduled.filter((x) => x.eventId !== e.id);
    e.messages.forEach((m, index) => s.chat.queue.push({ eventId: e.id, index, at: s.minute + m.afterMinutes }));
  }
}

function deliverDueMessages(s: GameState, c: Content): void {
  const due = s.chat.queue.filter((q) => q.at <= s.minute).sort((a, b) => a.at - b.at || a.index - b.index);
  if (due.length === 0) return;
  s.chat.queue = s.chat.queue.filter((q) => q.at > s.minute);
  for (const q of due) {
    const e = c.chats.find((x) => x.id === q.eventId);
    if (!e) continue;
    postMessage(s, e.channel, e.from, e.messages[q.index].text, e.id);
    if (q.index !== e.messages.length - 1) continue;
    if (e.onDelivered) applyEffects(s, e.onDelivered, c);
    if (e.replies && e.replies.length > 0) {
      s.chat.awaiting.push({
        eventId: e.id,
        expiresAt: e.expiresAfterMinutes ? s.minute + e.expiresAfterMinutes : null,
      });
    }
  }
}

function expireIgnored(s: GameState, c: Content): void {
  const expired = s.chat.awaiting.filter((a) => a.expiresAt !== null && a.expiresAt <= s.minute);
  if (expired.length === 0) return;
  s.chat.awaiting = s.chat.awaiting.filter((a) => !expired.includes(a));
  for (const a of expired) {
    const e = c.chats.find((x) => x.id === a.eventId);
    if (e?.onIgnored) applyEffects(s, e.onIgnored, c);
  }
}

export function tickChat(s: GameState, c: Content): void {
  fireDueEvents(s, c);
  deliverDueMessages(s, c);
  expireIgnored(s, c);
}

export function replyToEvent(s: GameState, c: Content, eventId: string, replyId: string): void {
  const awaiting = s.chat.awaiting.find((a) => a.eventId === eventId);
  const e = c.chats.find((x) => x.id === eventId);
  const reply = e?.replies?.find((r) => r.id === replyId);
  if (!awaiting || !e || !reply) return;
  s.chat.awaiting = s.chat.awaiting.filter((a) => a !== awaiting);
  postMessage(s, e.channel, PLAYER, reply.text, e.id);
  applyEffects(s, reply.effects, c);
  if (reply.followUp) postMessage(s, e.channel, e.from, reply.followUp, e.id);
}

/** Overnight, anything still in flight is delivered and nobody holds an unanswered question against you. */
export function settleOvernight(s: GameState, c: Content): void {
  for (const q of [...s.chat.queue].sort((a, b) => a.at - b.at || a.index - b.index)) {
    const e = c.chats.find((x) => x.id === q.eventId);
    if (e) postMessage(s, e.channel, e.from, e.messages[q.index].text, e.id);
  }
  s.chat.queue = [];
  s.chat.awaiting = [];
  s.chat.scheduled = [];
}

export function markRead(s: GameState, channel: string): void {
  if (s.chat.unread[channel]) s.chat.unread[channel] = 0;
}
