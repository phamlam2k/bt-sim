import type { Content } from './content/schema';
import type { GameState } from './engine/types';

const KEY = 'bts.save.v1';
const SAVE_FORMAT = 1;

interface SaveFile {
  format: number;
  savedAt: number;
  state: GameState;
  /** The state at the start of each day played so far, so a day can be replayed. */
  dayStarts?: Record<number, GameState>;
}

export type DayStarts = Record<number, GameState>;

/**
 * Local persistence for the prototype. The whole state is small enough to write on every change.
 * Storage can be unavailable (private windows, blocked site data), so every access is guarded.
 */
export function writeSave(state: GameState, dayStarts: DayStarts): void {
  try {
    const file: SaveFile = { format: SAVE_FORMAT, savedAt: Date.now(), state, dayStarts };
    localStorage.setItem(KEY, JSON.stringify(file));
  } catch {
    // Playing without a save is better than crashing.
  }
}

export function readSave(c: Content): { state: GameState; savedAt: number; dayStarts: DayStarts } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const file = JSON.parse(raw) as SaveFile;
    if (file.format !== SAVE_FORMAT) return null;
    const { setup } = file.state;
    // A save from a different content version may reference things that no longer exist.
    if (setup.packId !== c.pack.id || setup.packVersion !== c.pack.version) return null;
    return { state: file.state, savedAt: file.savedAt, dayStarts: file.dayStarts ?? {} };
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
