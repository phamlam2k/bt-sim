import { create } from 'zustand';
import { loadRainforest } from './content/rainforest';
import type { Content, Difficulty, Lang } from './content/schema';
import { createInitialState, step } from './engine/step';
import type { Action, GameState } from './engine/types';
import { clearSave, readSave, writeSave, type DayStarts } from './save';
import { readToursSeen, writeToursSeen, type TourId } from './tour/tours';

export type AppId = 'chat' | 'tickets' | 'git' | 'review' | 'pipeline' | 'glossary';
export const APP_IDS: AppId[] = ['chat', 'tickets', 'git', 'review', 'pipeline', 'glossary'];

export interface WindowState {
  open: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  maximized: boolean;
}

export const MIN_WINDOW = { w: 420, h: 300 };

/** Where the player is: walking around the floor, or sitting at the laptop. */
export type Place = 'office' | 'desk';
export type Cell = [number, number];

export type PauseReason = 'manual' | 'idle' | 'hidden';

interface Store {
  content: Content;
  game: GameState | null;
  saved: { state: GameState; savedAt: number; dayStarts: DayStarts } | null;
  /** The state at the start of each day played so far. */
  dayStarts: DayStarts;
  paused: PauseReason | null;
  windows: Record<AppId, WindowState>;
  focused: AppId | null;
  activeChannel: string;
  activePuzzle: string | null;
  activeTicket: string | null;
  place: Place;
  /** The player's tile on the office floor, as [column, row]. */
  pos: Cell;
  /** "Walk me to this spot", asked from outside the map (for example the Today panel). */
  walkRequest: { spot: string; thenOpen: AppId | null } | null;
  /** A mini-game is on screen; the work clock waits. */
  minigame: boolean;
  tour: { id: TourId; index: number } | null;
  toursSeen: TourId[];

  dispatch: (action: Action) => void;
  startGame: (opts: { playerName: string; difficulty: Difficulty; lang: Lang }) => void;
  continueSaved: () => void;
  abandonGame: () => void;
  /** Throws away the current day's result and plays that day again from its first minute. */
  replayDay: () => void;

  openApp: (id: AppId) => void;
  closeApp: (id: AppId) => void;
  focusApp: (id: AppId) => void;
  moveWindow: (id: AppId, x: number, y: number) => void;
  resizeWindow: (id: AppId, w: number, h: number) => void;
  toggleMaximize: (id: AppId) => void;
  setChannel: (id: string) => void;
  setPuzzle: (id: string | null) => void;
  setTicket: (key: string | null) => void;
  setPos: (pos: Cell) => void;
  sitDown: (thenOpen?: AppId | null) => void;
  standUp: () => void;
  arriveAtOffice: () => void;
  requestWalk: (spot: string, thenOpen?: AppId | null) => void;
  clearWalkRequest: () => void;
  setMinigame: (on: boolean) => void;
  pause: (reason: PauseReason) => void;
  resume: () => void;

  startTour: (id: TourId) => void;
  setTourIndex: (index: number) => void;
  endTour: () => void;
}

const DEFAULT_WINDOWS: Record<AppId, WindowState> = {
  chat: { open: true, x: 32, y: 28, w: 700, h: 620, z: 1, maximized: false },
  tickets: { open: false, x: 56, y: 32, w: 1120, h: 720, z: 0, maximized: false },
  git: { open: false, x: 64, y: 24, w: 1080, h: 740, z: 0, maximized: false },
  pipeline: { open: false, x: 80, y: 44, w: 1100, h: 660, z: 0, maximized: false },
  review: { open: false, x: 48, y: 20, w: 1180, h: 760, z: 0, maximized: false },
  glossary: { open: false, x: 220, y: 60, w: 620, h: 640, z: 0, maximized: false },
};

const content = loadRainforest();

const OFFICE_START = content.office.start as Cell;
const DESK_STAND = content.office.spots.find((s) => s.kind === 'desk')!.stand as Cell;

function topZ(windows: Record<AppId, WindowState>): number {
  return Math.max(...Object.values(windows).map((w) => w.z));
}

export const useStore = create<Store>((set, get) => ({
  content,
  game: null,
  saved: readSave(content),
  dayStarts: {},
  paused: null,
  windows: structuredClone(DEFAULT_WINDOWS),
  focused: 'chat',
  activeChannel: 'dm-maya',
  activePuzzle: null,
  activeTicket: null,
  place: 'office',
  pos: OFFICE_START,
  walkRequest: null,
  minigame: false,
  tour: null,
  toursSeen: readToursSeen(),

  dispatch: (action) => {
    const { game } = get();
    if (!game) return;
    const next = step(game, action, content);
    if (next === game) return;
    const dayStarts = action.type === 'START_NEXT_DAY' ? { ...get().dayStarts, [next.day]: next } : get().dayStarts;
    set({ game: next, dayStarts });
    writeSave(next, dayStarts);
  },

  startGame: ({ playerName, difficulty, lang }) => {
    const game = createInitialState(
      {
        playerName: playerName.trim() || 'New Hire',
        difficulty,
        lang,
        seed: Date.now() & 0x7fffffff,
        packId: content.pack.id,
        packVersion: content.pack.version,
      },
      content,
    );
    const dayStarts = { 1: game };
    writeSave(game, dayStarts);
    set({
      game,
      dayStarts,
      saved: null,
      paused: null,
      tour: null,
      windows: structuredClone(DEFAULT_WINDOWS),
      focused: 'chat',
      activeChannel: 'dm-maya',
      activePuzzle: null,
      activeTicket: null,
      place: 'office',
      pos: OFFICE_START,
      walkRequest: null,
      minigame: false,
    });
  },

  continueSaved: () => {
    const { saved } = get();
    if (!saved) return;
    // Resume behind the lock screen so the clock does not start before the player is ready.
    // The save does not record where the player was standing; they come back sitting at their desk.
    set({ game: saved.state, dayStarts: saved.dayStarts, saved: null, paused: saved.state.phase === 'playing' ? 'manual' : null, place: 'desk', pos: DESK_STAND });
  },

  abandonGame: () => {
    clearSave();
    set({ game: null, saved: null, dayStarts: {}, paused: null, tour: null });
  },

  replayDay: () => {
    const { game, dayStarts } = get();
    const start = game && dayStarts[game.day];
    if (!start) return;
    // Later days were built on the attempt being discarded, so their starting points go too.
    const kept = Object.fromEntries(Object.entries(dayStarts).filter(([day]) => Number(day) <= start.day));
    writeSave(start, kept);
    set({
      game: start,
      dayStarts: kept,
      paused: null,
      tour: null,
      windows: structuredClone(DEFAULT_WINDOWS),
      focused: 'chat',
      activeChannel: 'dm-maya',
      activePuzzle: null,
      activeTicket: null,
      place: 'office',
      pos: OFFICE_START,
      walkRequest: null,
      minigame: false,
    });
  },

  openApp: (id) => {
    const windows = { ...get().windows };
    windows[id] = { ...windows[id], open: true, z: topZ(windows) + 1 };
    set({ windows, focused: id });
  },

  closeApp: (id) => {
    const windows = { ...get().windows };
    windows[id] = { ...windows[id], open: false };
    const remaining = APP_IDS.filter((a) => windows[a].open).sort((a, b) => windows[b].z - windows[a].z);
    set({ windows, focused: remaining[0] ?? null });
  },

  focusApp: (id) => {
    const { windows, focused } = get();
    if (focused === id) return;
    set({ windows: { ...windows, [id]: { ...windows[id], z: topZ(windows) + 1 } }, focused: id });
  },

  moveWindow: (id, x, y) => {
    const { windows } = get();
    set({ windows: { ...windows, [id]: { ...windows[id], x, y } } });
  },

  resizeWindow: (id, w, h) => {
    const { windows } = get();
    set({ windows: { ...windows, [id]: { ...windows[id], w: Math.max(MIN_WINDOW.w, w), h: Math.max(MIN_WINDOW.h, h), maximized: false } } });
  },

  toggleMaximize: (id) => {
    const { windows } = get();
    set({ windows: { ...windows, [id]: { ...windows[id], maximized: !windows[id].maximized, z: topZ(windows) + 1 } }, focused: id });
  },

  setChannel: (id) => set({ activeChannel: id }),
  setPuzzle: (id) => set({ activePuzzle: id }),
  setTicket: (key) => set({ activeTicket: key }),

  setPos: (pos) => set({ pos }),
  sitDown: (thenOpen) => {
    set({ place: 'desk', pos: DESK_STAND, walkRequest: null });
    if (thenOpen) get().openApp(thenOpen);
  },
  standUp: () => set({ place: 'office', pos: DESK_STAND, walkRequest: null }),
  arriveAtOffice: () => set({ place: 'office', pos: OFFICE_START, walkRequest: null, minigame: false }),
  requestWalk: (spot, thenOpen = null) => set({ walkRequest: { spot, thenOpen } }),
  clearWalkRequest: () => set({ walkRequest: null }),
  setMinigame: (on) => set({ minigame: on }),

  pause: (reason) => {
    const { game, paused, tour } = get();
    // A tour already stops the clock; locking the screen on top of it would only confuse.
    if (!game || game.phase !== 'playing' || paused || (tour && reason !== 'manual')) return;
    writeSave(game, get().dayStarts);
    set({ paused: reason });
  },

  resume: () => set({ paused: null }),

  startTour: (id) => set({ tour: { id, index: 0 } }),

  setTourIndex: (index) => {
    const { tour } = get();
    if (tour) set({ tour: { ...tour, index } });
  },

  endTour: () => {
    const { tour, toursSeen } = get();
    if (!tour) return;
    const seen = toursSeen.includes(tour.id) ? toursSeen : [...toursSeen, tour.id];
    writeToursSeen(seen);
    set({ tour: null, toursSeen: seen });
  },
}));

/** The clock also stops while the player is reading something the game put in front of them. */
export function isReading(game: GameState): boolean {
  return game.cards.length > 0 || Object.values(game.reviews).some((r) => r.result !== null && !r.acknowledged);
}
