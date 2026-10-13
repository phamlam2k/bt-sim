import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui';

const W = 520;
const H = 300;
const PADDLE_H = 64;
const PADDLE_W = 10;
const BALL = 12;
const WIN_AT = 3;

interface Rally {
  x: number;
  y: number;
  vx: number;
  vy: number;
  you: number;
  them: number;
}

function serve(towardYou: boolean): Pick<Rally, 'x' | 'y' | 'vx' | 'vy'> {
  return { x: W / 2, y: H / 2, vx: towardYou ? -3.2 : 3.2, vy: (Math.random() - 0.5) * 4 };
}

/** A short break at the table: first to three points. Only the result goes back to the game. */
export function PingPong({ opponent, onDone }: { opponent: string; onDone: (won: boolean) => void }) {
  const [score, setScore] = useState({ you: 0, them: 0 });
  const [, repaint] = useState(0);
  const field = useRef<HTMLDivElement>(null);
  const rally = useRef<Rally>({ ...serve(false), you: H / 2, them: H / 2 });
  const points = useRef({ you: 0, them: 0 });
  const keys = useRef({ up: false, down: false });
  const finished = score.you >= WIN_AT || score.them >= WIN_AT;

  useEffect(() => {
    if (finished) return;
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') keys.current.up = down;
      if (e.key === 'ArrowDown' || e.key === 's') keys.current.down = down;
    };
    const keyDown = onKey(true);
    const keyUp = onKey(false);
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    const timer = setInterval(() => {
      const r = rally.current;
      if (keys.current.up) r.you -= 6;
      if (keys.current.down) r.you += 6;
      r.you = Math.max(PADDLE_H / 2, Math.min(H - PADDLE_H / 2, r.you));
      // The opponent is good, not perfect: it follows the ball a little too slowly.
      r.them += Math.max(-3.1, Math.min(3.1, r.y - r.them));

      r.x += r.vx;
      r.y += r.vy;
      if (r.y < BALL / 2 || r.y > H - BALL / 2) r.vy = -r.vy;

      const hits = (paddleY: number) => Math.abs(r.y - paddleY) <= PADDLE_H / 2 + BALL / 2;
      if (r.vx < 0 && r.x <= 24 + PADDLE_W && r.x >= 20 && hits(r.you)) {
        r.vx = Math.min(9, -r.vx * 1.07);
        r.vy += (r.y - r.you) * 0.08;
      }
      if (r.vx > 0 && r.x >= W - 24 - PADDLE_W && r.x <= W - 20 && hits(r.them)) {
        r.vx = Math.max(-9, -r.vx * 1.07);
        r.vy += (r.y - r.them) * 0.08;
      }

      if (r.x < 0 || r.x > W) {
        const youScored = r.x > W;
        points.current = { you: points.current.you + (youScored ? 1 : 0), them: points.current.them + (youScored ? 0 : 1) };
        Object.assign(r, serve(youScored));
        setScore(points.current);
      }
      repaint((n) => n + 1);
    }, 16);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
    };
  }, [finished]);

  const r = rally.current;
  const won = score.you >= WIN_AT;

  return (
    <div className="absolute inset-0 z-[800] flex items-center justify-center bg-slate-950/85 p-4" role="dialog" aria-modal aria-label="Ping-pong">
      <div className="rounded-xl border border-emerald-500/50 bg-slate-900 p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-6 text-sm">
          <span className="font-semibold text-white">
            You {score.you} : {score.them} {opponent}
          </span>
          <span className="text-slate-400">First to {WIN_AT}. Move the mouse, or use the arrow keys.</span>
        </div>
        <div
          ref={field}
          className="relative overflow-hidden rounded-md border-2 border-emerald-700 bg-emerald-900"
          style={{ width: W, height: H, maxWidth: '80vw' }}
          onPointerMove={(e) => {
            const box = field.current?.getBoundingClientRect();
            if (box) rally.current.you = Math.max(PADDLE_H / 2, Math.min(H - PADDLE_H / 2, e.clientY - box.top));
          }}
        >
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/30" />
          <div className="absolute rounded bg-white" style={{ left: 20, top: r.you - PADDLE_H / 2, width: PADDLE_W, height: PADDLE_H }} />
          <div className="absolute rounded bg-amber-300" style={{ left: W - 20 - PADDLE_W, top: r.them - PADDLE_H / 2, width: PADDLE_W, height: PADDLE_H }} />
          {!finished && <div className="absolute rounded-full bg-white" style={{ left: r.x - BALL / 2, top: r.y - BALL / 2, width: BALL, height: BALL }} />}
          {finished && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-950/70 text-center">
              <div className="text-2xl font-bold text-white">{won ? 'You win!' : `${opponent} wins.`}</div>
              <div className="text-sm text-slate-300">{won ? '"Best of five?" "Back to work."' : '"Rematch tomorrow." Either way, your head is clearer.'}</div>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-400">The work clock is stopped. The break costs 10 minutes of your day when you finish.</span>
          {finished ? (
            <Button variant="primary" onClick={() => onDone(won)}>
              Back to the office
            </Button>
          ) : (
            <Button onClick={() => onDone(false)}>Concede and go back</Button>
          )}
        </div>
      </div>
    </div>
  );
}
