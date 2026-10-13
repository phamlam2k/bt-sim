import type { Condition } from '../content/schema';
import type { GameState } from './types';

export function readStat(s: GameState, path: string): number {
  const [root, key] = path.split('.');
  if (root === 'stats') return s.stats[key as keyof GameState['stats']] ?? 0;
  if (root === 'hidden') return s.hidden[key as keyof GameState['hidden']] ?? 0;
  if (root === 'trust') return s.trust[key] ?? 0;
  return 0;
}

export function evalCondition(s: GameState, cond: Condition): boolean {
  switch (cond.type) {
    case 'time':
      return s.minute >= cond.atLeast;
    case 'flag':
      return (s.flags[cond.id] ?? false) === cond.is;
    case 'stat': {
      const v = readStat(s, cond.path);
      if (cond.op === '<') return v < cond.value;
      if (cond.op === '>') return v > cond.value;
      if (cond.op === '<=') return v <= cond.value;
      return v >= cond.value;
    }
    case 'stepDone':
      return s.stepsDone.includes(cond.step);
    case 'reviewed':
      return s.stepsDone.includes(`review:${cond.puzzle}`);
    case 'manual':
      return false;
    case 'all':
      return cond.of.every((c) => evalCondition(s, c));
    case 'any':
      return cond.of.some((c) => evalCondition(s, c));
  }
}
