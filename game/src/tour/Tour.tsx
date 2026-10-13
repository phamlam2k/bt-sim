import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { Button } from '../ui';
import { buildTours } from './tours';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PAD = 8;
const GAP = 14;
const CARD_W = 380;

function measure(target: string | undefined): Rect | null {
  if (!target) return null;
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 };
}

/** Puts the card on whichever side of the highlighted area has the most room. */
function placeCard(rect: Rect | null, cardH: number): { left: number; top: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampX = (x: number) => Math.max(12, Math.min(x, vw - CARD_W - 12));
  const clampY = (y: number) => Math.max(12, Math.min(y, vh - cardH - 12));
  if (!rect) return { left: clampX((vw - CARD_W) / 2), top: clampY((vh - cardH) / 2) };

  const room = {
    right: vw - (rect.x + rect.w),
    left: rect.x,
    below: vh - (rect.y + rect.h),
    above: rect.y,
  };
  if (room.right >= CARD_W + GAP + 12) return { left: rect.x + rect.w + GAP, top: clampY(rect.y) };
  if (room.left >= CARD_W + GAP + 12) return { left: rect.x - CARD_W - GAP, top: clampY(rect.y) };
  if (room.below >= cardH + GAP + 12) return { left: clampX(rect.x), top: rect.y + rect.h + GAP };
  if (room.above >= cardH + GAP + 12) return { left: clampX(rect.x), top: rect.y - cardH - GAP };
  // The target fills the screen: sit inside its bottom-right corner.
  return { left: clampX(rect.x + rect.w - CARD_W - GAP), top: clampY(rect.y + rect.h - cardH - GAP) };
}

/** A step-by-step guided tour: dims the screen, highlights one thing, explains it. */
export function Tour() {
  const tour = useStore((s) => s.tour);
  const content = useStore((s) => s.content);
  const setTourIndex = useStore((s) => s.setTourIndex);
  const endTour = useStore((s) => s.endTour);
  const tours = useMemo(() => buildTours(content), [content]);
  const [rect, setRect] = useState<Rect | null>(null);
  const [card, setCard] = useState<HTMLDivElement | null>(null);
  const [cardH, setCardH] = useState(220);

  const steps = tour ? tours[tour.id] : [];
  const step = tour ? steps[tour.index] : undefined;
  const target = step?.target;

  // Windows can move or resize under the tour, so keep following the target.
  useEffect(() => {
    if (!tour) return;
    const update = () =>
      setRect((prev) => {
        const next = measure(target);
        const same = prev && next ? prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h : prev === next;
        return same ? prev : next;
      });
    update();
    const timer = setInterval(update, 250);
    window.addEventListener('resize', update);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', update);
    };
  }, [tour, target]);

  useLayoutEffect(() => {
    if (card) setCardH(card.offsetHeight);
  }, [card, tour?.id, tour?.index]);

  useEffect(() => {
    if (!tour) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') endTour();
      if (e.key === 'ArrowRight' || e.key === 'Enter') tour.index < steps.length - 1 ? setTourIndex(tour.index + 1) : endTour();
      if (e.key === 'ArrowLeft' && tour.index > 0) setTourIndex(tour.index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tour, steps.length, setTourIndex, endTour]);

  if (!tour || !step) return null;

  const last = tour.index === steps.length - 1;
  const pos = placeCard(rect, cardH);

  return createPortal(
    <div className="fixed inset-0 z-[3000]" role="dialog" aria-modal aria-label={`Tour: ${step.title}`}>
      {/* Blocks clicks on the app while the tour is open. */}
      <div className="absolute inset-0" />
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-amber-400 transition-all duration-200"
          style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.78)' }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-slate-950/80" />
      )}
      <div
        ref={setCard}
        className="absolute rounded-xl border border-amber-400/60 bg-slate-900 p-5 shadow-2xl transition-all duration-200"
        style={{ left: pos.left, top: pos.top, width: CARD_W }}
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-amber-300">
            Step {tour.index + 1} of {steps.length}
          </span>
          <button type="button" onClick={endTour} className="text-slate-400 hover:text-white">
            Skip tour
          </button>
        </div>
        <h2 className="mt-2 text-lg font-bold text-white">{step.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1" aria-hidden>
            {steps.map((_, i) => (
              <i key={i} className={`h-1.5 w-1.5 rounded-full ${i === tour.index ? 'bg-amber-400' : 'bg-slate-600'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {tour.index > 0 && <Button onClick={() => setTourIndex(tour.index - 1)}>Back</Button>}
            <Button variant="primary" onClick={() => (last ? endTour() : setTourIndex(tour.index + 1))}>
              {last ? 'Got it' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
