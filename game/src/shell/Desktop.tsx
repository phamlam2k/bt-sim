import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChatApp } from '../apps/ChatApp';
import { GitApp } from '../apps/GitApp';
import { GlossaryApp } from '../apps/GlossaryApp';
import { PipelineApp } from '../apps/PipelineApp';
import { ReviewApp } from '../apps/ReviewApp';
import { TicketsApp } from '../apps/TicketsApp';
import type { Difficulty } from '../content/schema';
import { canLeave, formatClock, missionDone, missionProgress, missionsToday, nextStep, pendingReviews, ticketsNeedingAction, unreadTotal } from '../engine/selectors';
import { PLAYER_ID } from '../engine/tickets';
import { useAutoPause, useFocusSync, useGameClock } from '../hooks';
import { APP_IDS, useStore, type AppId } from '../store';
import { Button, Meter, Why } from '../ui';
import { Tour } from '../tour/Tour';
import type { TourId } from '../tour/tours';
import { Office } from '../office/Office';
import { Window } from './Window';

const APP_ICON: Record<AppId, string> = { chat: '💬', tickets: '🎫', git: '⌨️', review: '🔎', pipeline: '🚀', glossary: '📖' };
const APP_VIEW: Record<AppId, () => ReactNode> = {
  chat: () => <ChatApp />,
  tickets: () => <TicketsApp />,
  git: () => <GitApp />,
  review: () => <ReviewApp />,
  pipeline: () => <PipelineApp />,
  glossary: () => <GlossaryApp />,
};

export function Desktop() {
  useGameClock();
  useAutoPause();
  useFocusSync();

  const content = useStore((s) => s.content);
  const place = useStore((s) => s.place);
  const areaRef = useRef<HTMLDivElement>(null);
  const [area, setArea] = useState({ w: 900, h: 600 });
  useAutoTour();

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setArea({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, [place]);

  return (
    // The laptop: a bezel on the desk, with the company OS inside.
    <div className="flex h-full items-center justify-center p-[1.2vh]">
      <div className="relative flex h-full w-full max-w-[1900px] flex-col overflow-hidden rounded-xl border-[8px] border-neutral-900 bg-slate-950 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
        <div className="flex min-h-0 flex-1">
          {place === 'office' ? (
            <Office />
          ) : (
          <div
            ref={areaRef}
            className="relative min-w-0 flex-1 overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at 30% 20%, #134e4a 0%, #0f2a33 45%, #0b1220 100%)' }}
          >
            <div className="pointer-events-none absolute bottom-4 left-5 select-none text-slate-100/15">
              <div className="text-3xl font-black tracking-tight">{content.pack.name}</div>
              <div className="text-sm">Property of {content.pack.name}. For business use only.</div>
            </div>
            {APP_IDS.map((id) => (
              <Window key={id} id={id} title={content.pack.apps[id]?.displayName ?? id} area={area}>
                {APP_VIEW[id]()}
              </Window>
            ))}
          </div>
          )}
          <TodayPanel />
        </div>
        {place === 'office' ? <OfficeBar /> : <Taskbar />}
        <CardOverlay />
        <LockScreen />
        <Tour />
      </div>
    </div>
  );
}

/** Which tour explains what the player is looking at right now. */
function tourForContext(focused: AppId | null, hasReview: boolean, hasTicket: boolean): TourId {
  if (focused === 'git') return 'git';
  if (focused === 'review' && hasReview) return 'review';
  if (focused === 'tickets' && hasTicket) return 'tickets';
  if (focused === 'pipeline') return 'pipeline';
  return 'desktop';
}

/** The Tickets tour points at a ticket, so it waits until the player has one. */
const playerHasTicket = (s: { game: { tickets: Record<string, { assignee: string | null }> } | null }) =>
  !!s.game && Object.values(s.game.tickets).some((t) => t.assignee === PLAYER_ID);

/** The strip under the office floor: how to move, and what is waiting back at the desk. */
function OfficeBar() {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const pause = useStore((s) => s.pause);
  const requestWalk = useStore((s) => s.requestWalk);
  const waiting = unreadTotal(game) + game.chat.awaiting.length + pendingReviews(game, content).length + ticketsNeedingAction(game, content).length;

  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-t border-slate-800 bg-slate-900 px-3 text-xs text-slate-400">
      <span className="font-bold text-emerald-400">🌧 {content.pack.name}</span>
      <span className="hidden md:inline">Click the floor to walk, or use the arrow keys. Click a person or an object to use it.</span>
      <div className="flex-1" />
      {waiting > 0 && (
        <button type="button" onClick={() => requestWalk('desk')} className="rounded-md border border-rose-500/60 bg-rose-500/15 px-2.5 py-1.5 font-medium text-rose-100 hover:bg-rose-500/25">
          {waiting} thing{waiting === 1 ? '' : 's'} waiting at your desk
        </button>
      )}
      <Button variant="ghost" onClick={() => pause('manual')} title="Lock the laptop. Nothing happens while you are away.">
        ⏸ Pause
      </Button>
    </div>
  );
}

/** Starts each tour the first time its screen appears. Never in Realistic mode. */
function useAutoTour(): void {
  const tour = useStore((s) => s.tour);
  const seen = useStore((s) => s.toursSeen);
  const paused = useStore((s) => s.paused);
  const focused = useStore((s) => s.focused);
  const difficulty = useStore((s) => s.game?.setup.difficulty);
  const hasReview = useStore((s) => !!s.activePuzzle && !!s.game?.reviews[s.activePuzzle]);
  const hasTicket = useStore(playerHasTicket);
  const reading = useStore((s) => (s.game ? s.game.cards.length > 0 : false));
  const startTour = useStore((s) => s.startTour);
  const place = useStore((s) => s.place);

  useEffect(() => {
    if (tour || paused || reading || difficulty === 'realistic') return;
    if (place === 'office') {
      if (!seen.includes('office')) startTour('office');
      return;
    }
    if (!seen.includes('desktop')) return startTour('desktop');
    const wanted = tourForContext(focused, hasReview, hasTicket);
    if (wanted !== 'desktop' && !seen.includes(wanted)) startTour(wanted);
  }, [tour, seen, paused, reading, difficulty, focused, hasReview, hasTicket, startTour, place]);
}

function Taskbar() {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const windows = useStore((s) => s.windows);
  const focused = useStore((s) => s.focused);
  const openApp = useStore((s) => s.openApp);
  const pause = useStore((s) => s.pause);
  const standUp = useStore((s) => s.standUp);

  const badges: Partial<Record<AppId, number>> = {
    chat: unreadTotal(game) + game.chat.awaiting.length,
    tickets: ticketsNeedingAction(game, content).length,
    review: pendingReviews(game, content).length,
  };
  const mayLeave = canLeave(game, content);

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-t border-slate-800 bg-slate-900 px-3">
      <div className="mr-2 flex items-center gap-1.5 text-sm font-bold text-emerald-400">
        <span aria-hidden>🌧</span>
        <span className="hidden lg:inline">{content.pack.name}</span>
      </div>
      <div data-tour="taskbar-apps" className="flex items-center gap-2">
      {APP_IDS.map((id) => {
        const badge = badges[id] ?? 0;
        return (
          <button
            key={id}
            type="button"
            onClick={() => openApp(id)}
            className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs font-medium ${
              focused === id && windows[id].open ? 'border-emerald-500/60 bg-slate-700 text-white' : windows[id].open ? 'border-slate-600 bg-slate-800 text-slate-200' : 'border-transparent text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span aria-hidden>{APP_ICON[id]}</span>
            {content.pack.apps[id]?.displayName ?? id}
            {badge > 0 && (
              <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[0.72rem] font-bold leading-4 text-white">{badge}</span>
            )}
          </button>
        );
      })}
      </div>
      <div className="flex-1" />
      <Button variant="ghost" onClick={() => pause('manual')} title="Lock the laptop. Nothing happens while you are away.">
        ⏸ Pause
      </Button>
      <Button
        variant={mayLeave ? 'primary' : 'default'}
        onClick={standUp}
        title={mayLeave ? 'Your work is done. Stand up and take the elevator home.' : 'Leave your desk to stretch your legs, get a coffee or talk to someone. Your work waits here.'}
      >
        🚶 Stand up
      </Button>
    </div>
  );
}

function TodayPanel() {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const openApp = useStore((s) => s.openApp);
  const dispatch = useStore((s) => s.dispatch);
  const place = useStore((s) => s.place);
  const requestWalk = useStore((s) => s.requestWalk);
  const standUp = useStore((s) => s.standUp);

  const startTour = useStore((s) => s.startTour);
  const focused = useStore((s) => s.focused);
  const hasReview = useStore((s) => !!s.activePuzzle && !!s.game?.reviews[s.activePuzzle]);
  const hasTicket = useStore(playerHasTicket);

  const next = nextStep(game, content);
  const flowing = game.focus.task !== null;

  return (
    <aside className="scroll-thin flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-800 bg-slate-900/95 p-4">
      <div data-tour="clock">
        <div className="text-3xl font-semibold tabular-nums text-white">{formatClock(game.minute)}</div>
        <div className="text-xs text-slate-400">
          Day {game.day} · {game.setup.playerName} · Intern
        </div>
      </div>

      <section data-tour="today-next" className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3">
        <div className="text-[0.72rem] font-semibold uppercase tracking-wider text-emerald-300">Next step</div>
        {next ? (
          <>
            <p className="mt-1 text-sm leading-snug text-white">{next.text}</p>
            {next.app && place === 'desk' && (
              <Button variant="primary" className="mt-2 w-full" onClick={() => openApp(next.app as AppId)}>
                Open {content.pack.apps[next.app]?.displayName ?? next.app}
              </Button>
            )}
            {next.app && place === 'office' && (
              <Button variant="primary" className="mt-2 w-full" onClick={() => requestWalk('desk', next.app as AppId)}>
                Go to your desk
              </Button>
            )}
            {!next.app && place === 'desk' && (
              <Button variant="primary" className="mt-2 w-full" onClick={standUp}>
                Stand up
              </Button>
            )}
            {!next.app && place === 'office' && (
              <Button variant="primary" className="mt-2 w-full" onClick={() => requestWalk('exit')}>
                Walk to the elevator
              </Button>
            )}
          </>
        ) : (
          <p className="mt-1 text-sm text-white">All done for today.</p>
        )}
      </section>

      <section data-tour="today-list">
        <h2 className="mb-2 flex items-center justify-between text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">
          Due today <Why id="deadline" label="?" />
        </h2>
        <ul className="space-y-2">
          {missionsToday(game, content).map((m) => {
            const p = missionProgress(game, m);
            const complete = p.done === p.total;
            const late = !missionDone(game, m) && m.due !== undefined && game.minute >= m.due;
            return (
              <li key={m.id} className="text-xs">
                <div className={`flex items-start justify-between gap-2 ${complete ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  <span>{m.title}</span>
                  <span className="shrink-0 tabular-nums text-slate-500 no-underline">
                    {complete ? '✓' : `${p.done}/${p.total}`}
                  </span>
                </div>
                {m.due !== undefined && !complete && (
                  <div className={late ? 'font-medium text-rose-300' : 'text-slate-500'}>{late ? `late · was due ${formatClock(m.due)}` : `due ${formatClock(m.due)}`}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section data-tour="meters" className="space-y-3">
        <Meter
          label={
            <>
              Flow {flowing && <span className="text-emerald-400">↑</span>} <Why id="flow" label="?" />
            </>
          }
          value={game.stats.flow}
          color="#10b981"
        />
        <Meter label="Energy" value={game.stats.energy} color="#f59e0b" hint="Drops through the day. Coffee and a break bring some back." />
        <Meter label="Stress" value={game.stats.stress} color="#f43f5e" hint="Rises when things go wrong. Carries over to tomorrow." />
        {game.minute > content.pack.dayEnd && (
          <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1.5 text-xs leading-snug text-rose-100">
            Past {formatClock(content.pack.dayEnd)}. You are staying late: energy drains twice as fast. At {formatClock(content.pack.sentHomeAt)} Maya sends you home.
          </p>
        )}
        <p className="text-xs leading-snug text-slate-500">Coffee is in the kitchen. Stand up and walk there.</p>
      </section>

      <section className="mt-auto">
        <Button className="mb-3 w-full" onClick={() => startTour(tourForContext(focused, hasReview, hasTicket))} title="Replay the step-by-step tour for the window you are in.">
          🧭 Show me around
        </Button>
        <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500" htmlFor="difficulty">
          Help level
        </label>
        <select
          id="difficulty"
          value={game.setup.difficulty}
          onChange={(e) => dispatch({ type: 'SET_DIFFICULTY', difficulty: e.target.value as Difficulty })}
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-200"
        >
          <option value="guided">Guided: hints, slower clock</option>
          <option value="standard">Standard: hints on request</option>
          <option value="realistic">Realistic: no hints</option>
        </select>
      </section>
    </aside>
  );
}

function CardOverlay() {
  const cardId = useStore((s) => s.game?.cards[0]);
  const card = useStore((s) => (cardId ? s.content.cards[cardId] : undefined));
  const dispatch = useStore((s) => s.dispatch);
  if (!card) return null;

  return (
    <div className="absolute inset-0 z-[900] flex items-center justify-center bg-slate-950/80 p-6" role="dialog" aria-modal aria-label={card.title}>
      <div className="max-w-lg rounded-xl border border-emerald-500/50 bg-slate-900 p-6 shadow-2xl">
        <div className="text-[0.8rem] font-semibold uppercase tracking-widest text-emerald-400">{card.kicker}</div>
        <h2 className="mt-1 text-2xl font-bold text-white">{card.title}</h2>
        {card.body.map((p) => (
          <p key={p} className="mt-3 text-sm leading-relaxed text-slate-200">
            {p}
          </p>
        ))}
        {card.realWorld && (
          <div className="mt-4 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-xs leading-relaxed text-sky-100">
            <div className="mb-1 font-semibold text-sky-300">In real life</div>
            {card.realWorld}
            {card.source && (
              <a href={card.source.url} target="_blank" rel="noreferrer" className="mt-1.5 block text-sky-300 underline">
                Source: {card.source.label}
              </a>
            )}
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <Button variant="primary" onClick={() => dispatch({ type: 'DISMISS_CARD' })}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Covers everything, so pausing cannot be used to read a diff with the clock stopped. */
function LockScreen() {
  const paused = useStore((s) => s.paused);
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const resume = useStore((s) => s.resume);
  if (!paused) return null;

  const next = nextStep(game, content);
  const reason =
    paused === 'idle' ? 'Your laptop locked itself because you stepped away.' : paused === 'hidden' ? 'Your laptop locked when you switched away.' : 'Laptop locked.';

  return (
    <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-4 bg-slate-950 p-6 text-center" role="dialog" aria-modal aria-label="Paused">
      <div className="text-6xl font-light tabular-nums text-white">{formatClock(game.minute)}</div>
      <div className="text-sm text-slate-400">{reason} Nothing happens while you are away.</div>
      {next && (
        <div className="max-w-sm rounded-lg border border-slate-700 bg-slate-900 p-4 text-left">
          <div className="text-[0.72rem] font-semibold uppercase tracking-wider text-emerald-400">Where you left off</div>
          <div className="mt-1 text-xs text-slate-400">{next.mission.title}</div>
          <div className="mt-0.5 text-sm text-white">{next.text}</div>
        </div>
      )}
      <Button variant="primary" onClick={resume} className="px-6">
        Unlock and continue
      </Button>
    </div>
  );
}
