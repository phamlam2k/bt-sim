import type { Content, Effect } from '../content/schema';
import { mergeOpenCr } from './git';
import { startPipeline } from './pipeline';
import { assignTicket, ticketCrMerged } from './tickets';
import type { GameState } from './types';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function addStat(s: GameState, path: string, delta: number): void {
  const [root, key] = path.split('.');
  if (root === 'stats' && key in s.stats) {
    const k = key as keyof GameState['stats'];
    s.stats[k] = clamp(s.stats[k] + delta, 0, 100);
  } else if (root === 'hidden' && key in s.hidden) {
    const k = key as keyof GameState['hidden'];
    s.hidden[k] = s.hidden[k] + delta;
  } else if (root === 'trust') {
    s.trust[key] = clamp((s.trust[key] ?? 0) + delta, -100, 100);
  }
}

export function completeStep(s: GameState, step: string): void {
  if (!s.stepsDone.includes(step)) s.stepsDone.push(step);
}

/** Mutates the draft state. Callers own the draft (see step.ts). */
export function applyEffects(s: GameState, effects: Effect[], c: Content): void {
  for (const fx of effects) {
    switch (fx.type) {
      case 'stat':
        addStat(s, fx.path, fx.delta);
        break;
      case 'flag':
        s.flags[fx.id] = fx.value;
        break;
      case 'step':
        completeStep(s, fx.step);
        break;
      case 'glossary':
        if (!s.glossary.includes(fx.id)) s.glossary.push(fx.id);
        break;
      case 'event':
        s.chat.scheduled.push({ eventId: fx.id, at: s.minute + fx.afterMinutes });
        break;
      case 'card':
        s.cards.push(fx.id);
        break;
      case 'git':
        if (mergeOpenCr(s)) {
          ticketCrMerged(s, c);
          startPipeline(s);
        }
        break;
      case 'assign':
        assignTicket(s, fx.ticket, fx.to, fx.by);
        break;
      case 'time':
        s.minute = Math.min(s.minute + fx.minutes, c.pack.sentHomeAt);
        break;
    }
  }
}
