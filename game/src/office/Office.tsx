import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Office as OfficeMap, OfficeSpot } from '../content/schema';
import { canLeave, formatClock, nextStep, openMissions, unreadTotal } from '../engine/selectors';
import { useStore, type Cell } from '../store';
import { Avatar, Button, playerAvatar, Why } from '../ui';
import { PingPong } from './PingPong';

const STEP_MS = 110;
const same = (a: readonly number[], b: readonly number[]) => a[0] === b[0] && a[1] === b[1];

function isWalkable(map: OfficeMap, [x, y]: readonly number[]): boolean {
  return y >= 0 && y < map.map.length && x >= 0 && x < map.map[0].length && map.tiles[map.map[y][x]].walkable;
}

/** Shortest walk between two floor tiles, as the list of tiles after `from`. Empty when there is no way. */
export function findPath(map: OfficeMap, from: Cell, to: Cell): Cell[] {
  if (same(from, to) || !isWalkable(map, to)) return [];
  const key = (c: readonly number[]) => `${c[0]},${c[1]}`;
  const cameFrom = new Map<string, Cell | null>([[key(from), null]]);
  const queue: Cell[] = [from];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (same(cur, to)) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next: Cell = [cur[0] + dx, cur[1] + dy];
      if (!isWalkable(map, next) || cameFrom.has(key(next))) continue;
      cameFrom.set(key(next), cur);
      queue.push(next);
    }
  }
  if (!cameFrom.has(key(to))) return [];
  const path: Cell[] = [];
  for (let at: Cell | null = to; at && !same(at, from); at = cameFrom.get(key(at)) ?? null) path.unshift(at);
  return path;
}

/** The office floor: walk around, talk to people, sit down to work, go home. */
export function Office() {
  const content = useStore((s) => s.content);
  const game = useStore((s) => s.game)!;
  const pos = useStore((s) => s.pos);
  const setPos = useStore((s) => s.setPos);
  const sitDown = useStore((s) => s.sitDown);
  const walkRequest = useStore((s) => s.walkRequest);
  const clearWalkRequest = useStore((s) => s.clearWalkRequest);
  const blocked = useStore((s) => !!s.tour || !!s.paused || s.minigame);

  const office = content.office;
  const rows = office.map.length;
  const cols = office.map[0].length;

  const wrap = useRef<HTMLDivElement>(null);
  const [tile, setTile] = useState(40);
  const [openSpot, setOpenSpot] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const route = useRef<{ path: Cell[]; then: (() => void) | null }>({ path: [], then: null });
  const [walking, setWalking] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () => setTile(Math.max(22, Math.min(76, Math.floor(Math.min((el.clientWidth - 24) / cols, (el.clientHeight - 24) / rows)))));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [cols, rows]);

  const use = useCallback(
    (spot: OfficeSpot, thenOpen: Parameters<typeof sitDown>[0] = null) => {
      if (spot.kind === 'desk') sitDown(thenOpen);
      else setOpenSpot(spot.id);
    },
    [sitDown],
  );

  const walkTo = useCallback(
    (target: Cell, then: (() => void) | null) => {
      const from = useStore.getState().pos;
      if (same(from, target)) {
        then?.();
        return;
      }
      const path = findPath(office, from, target);
      if (path.length === 0) return;
      setOpenSpot(null);
      route.current = { path, then };
      setWalking(true);
    },
    [office],
  );

  // One tile per beat. Position lives in the store so it survives sitting down and standing up.
  useEffect(() => {
    if (!walking) return;
    const timer = setInterval(() => {
      const next = route.current.path.shift();
      if (next) setPos(next);
      if (route.current.path.length === 0) {
        const then = route.current.then;
        route.current.then = null;
        setWalking(false);
        then?.();
      }
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [walking, setPos]);

  const goToSpot = useCallback(
    (spot: OfficeSpot, thenOpen: Parameters<typeof sitDown>[0] = null) => walkTo(spot.stand as Cell, () => use(spot, thenOpen)),
    [walkTo, use],
  );

  // Requests from outside the map, such as "Go to your desk" in the Today panel.
  useEffect(() => {
    if (!walkRequest) return;
    const spot = office.spots.find((s) => s.id === walkRequest.spot || s.kind === walkRequest.spot);
    clearWalkRequest();
    if (spot) goToSpot(spot, walkRequest.thenOpen);
  }, [walkRequest, office.spots, goToSpot, clearWalkRequest]);

  const here = office.spots.find((s) => same(s.stand, pos));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (blocked || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      const move: Record<string, Cell> = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
      const delta = move[e.key];
      if (delta) {
        e.preventDefault();
        const from = useStore.getState().pos;
        const next: Cell = [from[0] + delta[0], from[1] + delta[1]];
        if (!isWalkable(office, next)) return;
        route.current = { path: [], then: null };
        setWalking(false);
        setOpenSpot(null);
        setPos(next);
      } else if ((e.key === 'e' || e.key === 'Enter') && here && !openSpot) {
        use(here);
      } else if (e.key === 'Escape') {
        setOpenSpot(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [blocked, office, here, openSpot, use, setPos]);

  const spotAt = (x: number, y: number) => office.spots.find((s) => same(s.at, [x, y]));
  const waiting = (npc: string | undefined) => !!npc && game.chat.awaiting.some((a) => content.chats.find((e) => e.id === a.eventId)?.from === npc);
  const unread = unreadTotal(game) + game.chat.awaiting.length;
  const active = office.spots.find((s) => s.id === openSpot);

  return (
    <div ref={wrap} className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-slate-950">
      <div data-tour="office-map" className="relative shrink-0 select-none" style={{ width: cols * tile, height: rows * tile }}>
        {office.map.map((row, y) =>
          [...row].map((ch, x) => {
            const t = office.tiles[ch];
            const spot = spotAt(x, y);
            const walkable = t.walkable;
            const npc = spot?.npc && spot.kind === 'npc' ? content.npcs[spot.npc] : undefined;
            return (
              <div
                key={`${x},${y}`}
                data-tour={spot ? `office-spot-${spot.id}` : undefined}
                role={spot || walkable ? 'button' : undefined}
                aria-label={spot ? spot.label : undefined}
                title={spot ? spot.label : t.name}
                onClick={() => (spot ? goToSpot(spot) : walkable ? walkTo([x, y], null) : undefined)}
                onMouseEnter={() => spot && setHover(spot.id)}
                onMouseLeave={() => spot && setHover(null)}
                className={`absolute flex items-center justify-center ${spot ? 'cursor-pointer' : walkable ? 'cursor-pointer hover:brightness-125' : ''} ${
                  spot ? (hover === spot.id || openSpot === spot.id ? 'z-10 ring-2 ring-amber-300' : 'ring-1 ring-amber-300/40') : ''
                }`}
                style={{
                  left: x * tile,
                  top: y * tile,
                  width: tile,
                  height: tile,
                  background: t.image ? `center / cover no-repeat url(${t.image})` : t.color,
                  boxShadow: walkable ? 'inset 0 0 0 1px rgba(15, 23, 42, 0.35)' : undefined,
                  fontSize: tile * 0.5,
                }}
              >
                {!t.image && !npc && t.glyph}
                {npc && <Avatar npc={npc} size={Math.round(tile * 0.78)} />}
                {spot?.kind === 'desk' && unread > 0 && <Badge tile={tile}>{unread}</Badge>}
                {spot?.kind === 'npc' && waiting(spot.npc) && <Badge tile={tile}>!</Badge>}
              </div>
            );
          }),
        )}

        {office.spots
          .filter((s) => hover === s.id && openSpot !== s.id)
          .map((s) => (
            <div
              key={s.id}
              className="pointer-events-none absolute z-20 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950/95 px-2 py-1 text-xs font-medium text-amber-100 shadow-lg"
              style={{ left: (s.at[0] + 0.5) * tile, top: s.at[1] * tile - 26 }}
            >
              {s.label}
            </div>
          ))}

        <div
          data-tour="office-you"
          className="pointer-events-none absolute z-30 flex items-center justify-center"
          style={{ left: pos[0] * tile, top: pos[1] * tile, width: tile, height: tile, transition: `left ${STEP_MS}ms linear, top ${STEP_MS}ms linear` }}
        >
          <div className="rounded-full ring-2 ring-white">
            <Avatar npc={playerAvatar(game.setup.playerName)} size={Math.round(tile * 0.74)} />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-slate-950/80 px-3 py-1.5 text-sm font-semibold text-slate-100">{office.name}</div>

      {here && !active && !walking && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Button variant="primary" onClick={() => use(here)}>
            {here.kind === 'desk' ? 'Sit down at your desk' : here.kind === 'exit' ? 'Call the elevator' : `${here.label}: take a look`}
          </Button>
        </div>
      )}

      {active && <SpotPanel spot={active} onClose={() => setOpenSpot(null)} />}
    </div>
  );
}

function Badge({ tile, children }: { tile: number; children: ReactNode }) {
  return (
    <span
      className="absolute -right-1 -top-1 z-10 flex items-center justify-center rounded-full bg-rose-500 px-1 font-sans font-bold leading-none text-white"
      style={{ minWidth: Math.max(16, tile * 0.42), height: Math.max(16, tile * 0.42), fontSize: Math.max(10, tile * 0.26) }}
    >
      {children}
    </span>
  );
}

/** What happens when the player uses a spot: a short conversation, a coffee, a game, or the way home. */
function SpotPanel({ spot, onClose }: { spot: OfficeSpot; onClose: () => void }) {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const dispatch = useStore((s) => s.dispatch);
  const setMinigame = useStore((s) => s.setMinigame);
  const requestWalk = useStore((s) => s.requestWalk);
  const [turn, setTurn] = useState(0);
  const [said, setSaid] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const npc = spot.npc ? content.npcs[spot.npc] : undefined;
  const line = spot.lines.length > 0 ? spot.lines[(game.day + turn) % spot.lines.length] : '';

  // Anything this person is waiting to hear from you can be answered face to face.
  const pending = spot.kind === 'npc' ? game.chat.awaiting.map((a) => content.chats.find((e) => e.id === a.eventId)).find((e) => e?.from === spot.npc) : undefined;
  const isMentor = spot.kind === 'npc' && spot.npc === content.pack.mentor;
  const next = nextStep(game, content);
  const mayLeave = canLeave(game, content);
  const open = openMissions(game, content);

  if (playing) {
    return (
      <PingPong
        opponent={npc?.name.split(' ')[0] ?? 'Opponent'}
        onDone={(won) => {
          setPlaying(false);
          setMinigame(false);
          dispatch({ type: 'PLAY_GAME', won, opponent: spot.npc ?? null });
          setSaid(won ? 'Good game. That is ten minutes well spent.' : 'Good game. You will get them next time.');
        }}
      />
    );
  }

  return (
    <div className="absolute bottom-4 left-1/2 z-40 w-[min(34rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-slate-600 bg-slate-900 p-4 shadow-2xl" role="dialog" aria-label={spot.label}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {npc && spot.kind === 'npc' && <Avatar npc={npc} />}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">{spot.kind === 'npc' && npc ? npc.name : spot.label}</div>
            {spot.kind === 'npc' && npc && <div className="text-xs text-slate-400">{npc.role}</div>}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded px-2 text-xl leading-none text-slate-400 hover:bg-slate-700 hover:text-white">
          ×
        </button>
      </div>

      {spot.kind === 'npc' && pending ? (
        <>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{pending.messages[pending.messages.length - 1].text.replaceAll('{name}', game.setup.playerName)}</p>
          <div className="mt-3 space-y-1.5">
            {pending.replies?.map((r) => (
              <button
                key={r.id}
                type="button"
                className="block w-full rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-left text-sm text-emerald-50 hover:bg-emerald-500/20"
                onClick={() => {
                  dispatch({ type: 'CHAT_REPLY', eventId: pending.id, replyId: r.id });
                  setSaid(r.followUp ?? 'Thanks.');
                }}
              >
                {r.text}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-slate-200">{said ?? line}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {spot.kind === 'npc' && !pending && spot.lines.length > 1 && (
          <Button
            onClick={() => {
              setSaid(null);
              setTurn(turn + 1);
            }}
          >
            Keep chatting
          </Button>
        )}
        {isMentor && !pending && next && <Button onClick={() => setSaid(`Here is what I would do next: ${next.text}`)}>What should I do next?</Button>}

        {spot.kind === 'coffee' && (
          <Button
            variant="primary"
            onClick={() => {
              dispatch({ type: 'COFFEE' });
              setSaid(game.metrics.coffees === 0 ? 'First cup of the day. That helps.' : game.metrics.coffees === 1 ? 'Second cup. It helps a little less.' : 'Another one. You mostly just feel warm.');
            }}
          >
            ☕ Get a coffee (5 min)
          </Button>
        )}

        {spot.kind === 'game' && (
          <Button
            variant="primary"
            onClick={() => {
              setMinigame(true);
              setPlaying(true);
            }}
          >
            🏓 Play {npc?.name.split(' ')[0] ?? 'a game'} (10 min)
          </Button>
        )}

        {spot.kind === 'exit' &&
          (mayLeave ? (
            <Button variant="primary" onClick={() => dispatch({ type: 'GO_HOME' })}>
              Go home for today
            </Button>
          ) : (
            <Button onClick={() => requestWalk('desk')}>Back to your desk</Button>
          ))}
        {spot.kind === 'exit' && <Why id="going-home" label="No clock-out?" />}
      </div>

      {spot.kind === 'exit' && (
        <div className="mt-3 text-sm leading-relaxed text-slate-300">
          {mayLeave ? (
            'Everything you owed today is done. Nobody is counting the hours.'
          ) : (
            <>
              <div className="font-medium text-amber-200">You still have work for today:</div>
              <ul className="mt-1 space-y-0.5">
                {open.map((m) => (
                  <li key={m.id}>
                    • {m.title}
                    {m.due !== undefined && <span className={game.late.includes(m.id) ? 'text-rose-300' : 'text-slate-400'}> · due {formatClock(m.due)}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
