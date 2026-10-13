import { useEffect, useRef } from 'react';
import { WORK_TASK } from './engine/step';
import { isReading, useStore } from './store';

const IDLE_LOCK_MS = 60_000;

/** Turns real time into game minutes. Runs only while the player is actually playing. */
export function useGameClock(): void {
  const carry = useRef(0);

  useEffect(() => {
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      // A long gap means the tab was throttled or the machine slept: that time does not count.
      const elapsed = Math.min(now - last, 1000);
      last = now;

      const { game, paused, tour, minigame, content, dispatch } = useStore.getState();
      if (!game || game.phase !== 'playing' || paused || tour || minigame || isReading(game)) return;

      // Guided mode gives new readers twice as long with a diff.
      const reviewing = game.focus.task?.startsWith('review:') ?? false;
      const speed = game.setup.difficulty === 'guided' && reviewing ? 0.5 : 1;

      carry.current += elapsed * speed;
      const minutes = Math.floor(carry.current / content.pack.realMsPerGameMinute);
      if (minutes > 0) {
        carry.current -= minutes * content.pack.realMsPerGameMinute;
        dispatch({ type: 'TICK', minutes });
      }
    }, 200);
    return () => clearInterval(timer);
  }, []);
}

/** Locks the laptop when the player looks away, so the game never runs without them. */
export function useAutoPause(): void {
  useEffect(() => {
    let lastInput = Date.now();
    const touch = () => {
      lastInput = Date.now();
    };
    const onVisibility = () => {
      if (document.hidden) useStore.getState().pause('hidden');
    };
    const idleCheck = setInterval(() => {
      if (Date.now() - lastInput > IDLE_LOCK_MS) useStore.getState().pause('idle');
    }, 5000);

    window.addEventListener('pointerdown', touch);
    window.addEventListener('pointermove', touch);
    window.addEventListener('keydown', touch);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(idleCheck);
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('pointermove', touch);
      window.removeEventListener('keydown', touch);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}

/** Tells the engine what the player is concentrating on, based on the focused window. */
export function useFocusSync(): void {
  // Away from the desk, no window has the player's attention, whatever is open on the laptop.
  const focused = useStore((s) => (s.place === 'desk' ? s.focused : null));
  const activePuzzle = useStore((s) => s.activePuzzle);
  const paused = useStore((s) => s.paused);
  const game = useStore((s) => s.game);
  const dispatch = useStore((s) => s.dispatch);

  const reviewOpen = activePuzzle && game?.reviews[activePuzzle] && !game.reviews[activePuzzle].verdict;
  const task = focused === 'git' ? WORK_TASK : focused === 'review' && reviewOpen ? `review:${activePuzzle}` : null;
  const current = game?.focus;
  const playing = game?.phase === 'playing';

  useEffect(() => {
    if (!playing || paused || !current) return;
    if (current.app !== focused || current.task !== task) dispatch({ type: 'FOCUS', app: focused, task });
  }, [playing, paused, focused, task, current, dispatch]);
}
