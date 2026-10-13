// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import type { Action, ReviewComment } from './engine/types';
import { findPath } from './office/Office';
import { MIN_WINDOW, useStore } from './store';
import { buildTours, type TourId } from './tour/tours';

/**
 * Mounts the real app in jsdom and drives it through the three days.
 * It cannot judge layout, but it catches render crashes, broken effects and missing wiring.
 */
describe('UI smoke test', () => {
  let root: Root;
  let container: HTMLDivElement;
  const store = () => useStore.getState();
  const html = () => document.body.innerHTML;
  const dispatch = (...actions: Action[]) => act(() => actions.forEach((a) => store().dispatch(a)));
  const click = (el: Element | null | undefined) => {
    if (!el) throw new Error('click: element not found');
    act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  };
  const buttonWithText = (text: string) => [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  const buttonContaining = (text: string) => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes(text));
  const typeInto = (input: HTMLInputElement, value: string) =>
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  const tickUntil = (done: () => boolean, limit = 400) => {
    for (let i = 0; i < limit && !done(); i++) dispatch({ type: 'TICK', minutes: 1 });
    if (!done()) throw new Error('tickUntil: condition never became true');
  };
  /** Lets the player finish walking: one tile per timer beat. */
  const settleWalk = () => {
    // Moving counts as activity, so the idle lock never fires in the middle of a walk.
    act(() => window.dispatchEvent(new Event('pointerdown')));
    for (let i = 0; i < 45; i++) act(() => vi.advanceTimersByTime(110));
  };
  const walkTo = (spotId: string) => {
    click(document.querySelector(`[data-tour="office-spot-${spotId}"]`));
    settleWalk();
  };
  const expectTourTargets = (id: TourId) => {
    for (const s of buildTours(store().content)[id]) {
      if (s.target) expect(document.querySelector(`[data-tour="${s.target}"]`), s.target).not.toBeNull();
    }
  };
  const comment = (puzzleId: string, ...comments: ReviewComment[]) => dispatch(...comments.map((c): Action => ({ type: 'REVIEW_COMMENT', puzzleId, comment: c })));

  beforeAll(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    // jsdom has no layout engine, so these browser APIs are missing.
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    Element.prototype.scrollIntoView = () => {};
    // Asking for reduced motion makes the onboarding terminal print instantly instead of typing.
    window.matchMedia = ((query: string) => ({ matches: query.includes('reduce'), media: query })) as unknown as typeof window.matchMedia;
    localStorage.clear();
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<App />));
  });

  afterAll(() => {
    act(() => root.unmount());
    vi.useRealTimers();
  });

  it('onboards through the terminal: name, company, background, role, offer', () => {
    expect(html()).toContain('what should we call you?');
    expect(html()).not.toContain('Welcome back');

    const input = document.querySelector<HTMLInputElement>('input[aria-label="Your name"]')!;
    typeInto(input, 'Linh');
    act(() => input.form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(html()).toContain('Nice to meet you, Linh.');

    // Companies without a content pack are listed but cannot be chosen.
    click(buttonContaining('Goggle'));
    expect(html()).toContain('Goggle is not hiring yet');
    expect(html()).not.toContain('One question before we print your badge.');
    click(buttonContaining('Rainforest Cloud'));
    expect(html()).toContain('One question before we print your badge.');

    click(buttonContaining('I study or studied computer science'));
    expect(html()).toContain('Checking open positions for Linh...');

    click(buttonContaining('Senior SDE'));
    expect(html()).toContain('That title is earned, not chosen.');
    click(buttonContaining('Software Engineer Intern'));
    expect(html()).toContain('OFFER LETTER');
    expect(html()).toContain('Maya Okafor');

    click(buttonWithText('Accept offer and start day one'));
    expect(store().game!.setup).toMatchObject({ playerName: 'Linh', difficulty: 'standard', lang: 'python' });
    act(() => store().dispatch({ type: 'SET_DIFFICULTY', difficulty: 'guided' }));
  });

  it('starts the day on the office floor, with a tour of it', () => {
    expect(store().place).toBe('office');
    expect(store().pos).toEqual(store().content.office.start);
    expect(store().tour).toEqual({ id: 'office', index: 0 });
    expect(html()).toContain('Floor 12 · Queue Service');
    expectTourTargets('office');
    act(() => store().endTour());
    // The laptop is not on screen until the player sits down.
    expect(document.querySelector('[data-tour="window-chat"]')).toBeNull();
    expect(buttonWithText('Go to your desk')).toBeDefined();
  });

  it('finds a way around walls and furniture', () => {
    const { office } = store().content;
    const maya = office.spots.find((s) => s.id === 'maya')!;
    const path = findPath(office, [11, 10], maya.stand as [number, number]);
    expect(path[path.length - 1]).toEqual(maya.stand);
    for (const [x, y] of path) expect(office.tiles[office.map[y][x]].walkable).toBe(true);
    expect(findPath(office, [11, 10], [0, 0])).toEqual([]);
  });

  it('office life: answer Maya in person, get a coffee, play a game, and find the elevator closed to you', () => {
    dispatch({ type: 'TICK', minutes: 5 });
    expect(store().game!.chat.awaiting.map((a) => a.eventId)).toEqual(['welcome']);

    walkTo('maya');
    expect(store().pos).toEqual([5, 3]);
    expect(html()).toContain('How are you feeling about day one?');
    click(buttonWithText('Excited. What should I start with?'));
    expect(store().game!.stepsDone).toContain('chat:hello');
    expect(html()).toContain('Love it. I have just the thing.');

    walkTo('coffee');
    click(buttonContaining('Get a coffee'));
    expect(store().game!.metrics.coffees).toBe(1);
    expect(html()).toContain('First cup of the day.');

    walkTo('pingpong');
    const before = store().game!.minute;
    click(buttonContaining('Play Dev'));
    expect(store().minigame).toBe(true);
    expect(html()).toContain('First to 3');
    act(() => vi.advanceTimersByTime(400));
    expect(store().game!.minute).toBe(before);
    click(buttonWithText('Concede and go back'));
    expect(store().minigame).toBe(false);
    expect(store().game!.metrics.breaks).toBe(1);
    expect(store().game!.minute).toBe(before + 10);

    walkTo('elevator');
    expect(html()).toContain('You still have work for today:');
    expect(html()).toContain('Ship your first change (QS-101)');
    expect(html()).toContain('due 1:00 PM');
    expect(buttonWithText('Go home for today')).toBeUndefined();
  });

  it('sits down at the desk and gets the laptop tour, one step at a time', () => {
    act(() => store().requestWalk('desk', 'chat'));
    settleWalk();
    expect(store().place).toBe('desk');
    expect(document.querySelector('[data-tour="window-chat"]')).not.toBeNull();

    const steps = buildTours(store().content).desktop;
    expect(store().tour).toEqual({ id: 'desktop', index: 0 });
    expect(html()).toContain(`Step 1 of ${steps.length}`);
    expect(html()).toContain(steps[0].title);

    click(buttonWithText('Next'));
    expect(store().tour?.index).toBe(1);
    expect(html()).toContain(steps[1].title);
    expect(html()).not.toContain(steps[0].body);
    click(buttonWithText('Back'));
    expect(store().tour?.index).toBe(0);

    for (let i = 0; i < steps.length - 1; i++) click(buttonWithText('Next'));
    click(buttonWithText('Got it'));
    expect(store().tour).toBeNull();
    expect(store().toursSeen).toContain('desktop');
  });

  it('every tour step points at something that exists on screen', () => {
    act(() => store().openApp('git'));
    act(() => store().endTour());
    expectTourTargets('desktop');
    expectTourTargets('git');
  });

  it('shows the Why explanation outside the window, where nothing can clip it', () => {
    click(buttonWithText('Why branch?'));
    const popover = document.querySelector('[role="dialog"][aria-label="Why not commit straight to main?"]');
    expect(popover).not.toBeNull();
    expect(popover!.parentElement).toBe(document.body);
    expect(popover!.closest('[data-tour="window-git"]')).toBeNull();
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(document.querySelector('[role="dialog"][aria-label="Why not commit straight to main?"]')).toBeNull();
  });

  it('lets windows be resized and maximised', () => {
    act(() => store().resizeWindow('git', 10, 10));
    expect(store().windows.git).toMatchObject({ w: MIN_WINDOW.w, h: MIN_WINDOW.h });
    act(() => store().resizeWindow('git', 900, 650));
    expect(store().windows.git).toMatchObject({ w: 900, h: 650 });
    click(document.querySelector('button[aria-label="Maximise Workspace"]'));
    expect(store().windows.git.maximized).toBe(true);
    click(document.querySelector('button[aria-label="Restore Workspace"]'));
    expect(store().windows.git.maximized).toBe(false);
  });

  it('day one: take the ticket, ship the change, resolve it, go home', () => {
    dispatch({ type: 'TICK', minutes: 4 });
    expect(html()).toContain('read QS-101 and press Start work');
    expect(html()).toContain('due 1:00 PM');

    // The ticket comes first: read it, start it, and only then touch code.
    click(buttonWithText('Open Tickets'));
    expect(store().tour).toEqual({ id: 'tickets', index: 0 });
    expectTourTargets('tickets');
    act(() => store().endTour());
    expect(html()).toContain('A customer support case');
    click(buttonWithText('Start work'));
    expect(store().game!.tickets['QS-101'].status).toBe('progress');
    expect(buttonWithText('Resolve ticket')?.disabled).toBe(true);

    // The sprint board shows the whole team, and any card opens its ticket.
    click(buttonContaining('Sprint 14 board'));
    expect(html()).toContain('Review &amp; deploy');
    click(buttonContaining('QS-102'));
    expect(html()).toContain('Priya Nair owns this ticket');
    click(document.querySelector('button[aria-label="Close ticket"]'));
    click(buttonContaining('Backlog'));
    expect(html()).toContain('Flaky integration test');
    click(buttonContaining('Assigned to me'));

    act(() => store().focusApp('git'));
    expect(store().game!.focus).toEqual({ app: 'git', task: 'work' });
    expect(html()).toContain('git switch -c feature/QS-101-fix-typo');
    dispatch({ type: 'GIT_CMD', input: 'git switch -c feature/QS-101-fix-typo' }, { type: 'TICK', minutes: 30 });
    expect(html()).toContain('The fix is written');
    dispatch({ type: 'GIT_CMD', input: 'git add .' }, { type: 'GIT_CMD', input: 'git commit -m "fix"' }, { type: 'GIT_CMD', input: 'git push' });
    click(buttonWithText('Open CR'));
    expect(store().game!.git.crOpen).toBe(true);
    expect(html()).toContain('Maya is reviewing your CR');

    tickUntil(() => store().game!.cards.includes('first_change_live'));
    expect(html()).toContain('Your first change is live');
    click(buttonWithText('Continue'));
    expect(Object.keys(store().game!.reviews)).toEqual([]);

    act(() => store().openApp('pipeline'));
    expect(store().tour).toEqual({ id: 'pipeline', index: 0 });
    expectTourTargets('pipeline');
    act(() => store().endTour());
    expect(html()).toContain('QS-101 is live for every customer.');
    expect(document.querySelectorAll('[data-state="passed"]')).toHaveLength(store().content.pipeline.stages.length + 1);
    expect(html()).toContain('rolled back at One-box');

    act(() => store().openApp('tickets'));
    click(buttonWithText('Resolve ticket'));
    expect(store().game!.tickets['QS-101'].status).toBe('resolved');
    expect(html()).toContain('Deployed to production. No alarms.');

    // No clock-out: the work is done, so stand up and take the elevator.
    expect(html()).toContain('take the elevator home');
    click(buttonWithText('Stand up'));
    expect(store().place).toBe('office');
    expect(store().game!.focus.task).toBeNull();
    click(buttonWithText('Walk to the elevator'));
    settleWalk();
    click(buttonWithText('Go home for today'));
    expect(html()).toContain('You shipped to production on day one');
    expect(html()).toContain('Start day 2');
    expect(html()).not.toContain('Your reviews today');
    expect(html()).not.toContain('Want another go');
  });

  it('day two: a careless review comes back until it is right', () => {
    click(buttonWithText('Start day 2'));
    expect(store().game).toMatchObject({ day: 2, phase: 'playing' });
    expect(store().place).toBe('office');
    act(() => store().sitDown('chat'));

    tickUntil(() => store().game!.chat.awaiting.some((a) => a.eventId === 'd2_morning'));
    dispatch({ type: 'CHAT_REPLY', eventId: 'd2_morning', replyId: 'ready' });
    tickUntil(() => !!store().game!.reviews['cr-201']);

    act(() => store().openApp('review'));
    expect(store().activePuzzle).toBe('cr-201');
    expect(store().tour).toEqual({ id: 'review', index: 0 });
    expectTourTargets('review');
    act(() => store().endTour());
    expect(store().game!.focus.task).toBe('review:cr-201');

    // Approving a change with a password in it: Maya reads it afterwards and sends it back.
    click(buttonWithText('Approve'));
    expect(html()).toContain('Maya sent this one back');
    expect(html()).toContain('One serious problem is still in there');
    expect(html()).not.toContain('How to spot it');
    expect(document.querySelector('.bg-rose-600')).toBeNull();
    expect(store().game!.stepsDone).not.toContain('review:cr-201');
    expect(html()).toContain('sent back');

    click(buttonWithText('Take another look'));
    expect(store().game!.reviews['cr-201']).toMatchObject({ verdict: null, hintTier: 1, attempts: 1 });
    expect(html()).toContain('Hint 1');

    comment('cr-201', { kind: 'bug', line: 9, category: 'secret-in-code' }, { kind: 'cr', line: null, category: 'missing-description' });
    click(buttonWithText('Request changes'));
    expect(html()).toContain('How that went');
    expect(html()).toContain('Done on attempt 2');
    expect(store().game!.reviews['cr-201'].firstResult!.score).toBe(0);
    click(buttonWithText('Got it'));
    expect(store().game!.stepsDone).toContain('review:cr-201');

    tickUntil(() => !!store().game!.reviews['cr-202']);
    dispatch({ type: 'REVIEW_VERDICT', puzzleId: 'cr-202', verdict: 'approve' }, { type: 'REVIEW_ACK', puzzleId: 'cr-202' });

    act(() => store().pause('manual'));
    expect(html()).toContain('Unlock and continue');
    act(() => store().resume());

    dispatch({ type: 'GO_HOME' });
    expect(html()).toContain('Your reviews today');
    expect(html()).toContain('got past your first look');
    expect(html()).toContain('Start day 3');
  });

  it('day three ends the prototype', () => {
    click(buttonWithText('Start day 3'));
    act(() => store().sitDown('chat'));
    tickUntil(() => store().game!.chat.awaiting.some((a) => a.eventId === 'd3_morning'));
    dispatch({ type: 'CHAT_REPLY', eventId: 'd3_morning', replyId: 'go' });

    const answers: Record<string, ReviewComment[]> = {
      'cr-203': [{ kind: 'bug', line: 7, category: 'no-timeout' }, { kind: 'cr', line: null, category: 'missing-tests' }],
      'cr-204': [{ kind: 'bug', line: 8, category: 'off-by-one' }, { kind: 'bug', line: 13, category: 'pii-in-logs' }],
      'cr-205': [{ kind: 'bug', line: 12, category: 'unbounded-retry' }, { kind: 'bug', line: 15, category: 'swallowed-error' }],
    };
    for (const [id, comments] of Object.entries(answers)) {
      tickUntil(() => !!store().game!.reviews[id]);
      // The first one is waved through without reading, so it comes back.
      if (id === 'cr-203') dispatch({ type: 'REVIEW_VERDICT', puzzleId: id, verdict: 'approve' }, { type: 'REVIEW_ACK', puzzleId: id });
      comment(id, ...comments);
      dispatch({ type: 'REVIEW_VERDICT', puzzleId: id, verdict: 'changes' }, { type: 'REVIEW_ACK', puzzleId: id });
    }
    dispatch({ type: 'GO_HOME' });
    expect(html()).toContain('That is the end of this prototype');
    expect(html()).not.toContain('Start day 4');
  });

  it('keeps the save in step with the game', () => {
    const saved = JSON.parse(localStorage.getItem('bts.save.v1')!);
    expect(saved.state.day).toBe(3);
    expect(saved.state.phase).toBe('dayEnd');
  });

  it('lets a rough day be replayed without losing the days before it', () => {
    // One review needed a second look, so the summary offers another go at the day.
    expect(html()).toContain('Want another go at day 3?');
    const day2Score = store().game!.reviews['cr-201'].firstResult!.score;

    click(buttonWithText('Replay day 3'));
    expect(store().game!.phase).toBe('dayEnd');
    click(buttonWithText("Keep today's result"));
    expect(store().game!.reviews['cr-203']).toBeDefined();

    click(buttonWithText('Replay day 3'));
    click(buttonWithText('Yes, replay day 3'));
    const game = store().game!;
    expect(game).toMatchObject({ day: 3, phase: 'playing', minute: store().content.pack.dayStart });
    expect(store().place).toBe('office');
    expect(game.reviews['cr-203']).toBeUndefined();
    expect(game.reviews['cr-201'].firstResult!.score).toBe(day2Score);
    expect(game.latentBugs.every((b) => b.puzzleId !== 'cr-203')).toBe(true);
    expect(game.tickets['QS-101'].status).toBe('resolved');

    const saved = JSON.parse(localStorage.getItem('bts.save.v1')!);
    expect(saved.state).toMatchObject({ day: 3, phase: 'playing' });
    expect(Object.keys(saved.dayStarts)).toEqual(['1', '2', '3']);
  });

  it('a day that runs out of time has to be replayed before the next one opens', () => {
    dispatch({ type: 'TICK', minutes: 700 });
    expect(store().game!.phase).toBe('dayEnd');
    expect(html()).toContain('Sent home with work unfinished');
    expect(html()).toContain('sent home at 8:00 PM');
    expect(buttonWithText('Replay day 3')).toBeDefined();
  });
});
