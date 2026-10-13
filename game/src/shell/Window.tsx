import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { MIN_WINDOW, useStore, type AppId } from '../store';

const MARGIN = 8;
const TITLE_BAR = 40;

type Edge = 'e' | 's' | 'se';

/**
 * A draggable, resizable app window.
 * Position and size are clamped so the title bar can never leave the screen.
 */
export function Window({ id, title, area, children }: { id: AppId; title: string; area: { w: number; h: number }; children: ReactNode }) {
  const win = useStore((s) => s.windows[id]);
  const focused = useStore((s) => s.focused === id);
  const focusApp = useStore((s) => s.focusApp);
  const closeApp = useStore((s) => s.closeApp);
  const moveWindow = useStore((s) => s.moveWindow);
  const resizeWindow = useStore((s) => s.resizeWindow);
  const toggleMaximize = useStore((s) => s.toggleMaximize);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const resize = useRef<{ edge: Edge; startX: number; startY: number; w: number; h: number } | null>(null);

  if (!win.open) return null;

  const maxW = Math.max(MIN_WINDOW.w, area.w - MARGIN * 2);
  const maxH = Math.max(MIN_WINDOW.h, area.h - MARGIN * 2);
  const w = win.maximized ? maxW : Math.min(win.w, maxW);
  const h = win.maximized ? maxH : Math.min(win.h, maxH);
  const x = win.maximized ? MARGIN : Math.max(MARGIN, Math.min(win.x, area.w - w - MARGIN));
  const y = win.maximized ? MARGIN : Math.max(MARGIN, Math.min(win.y, area.h - TITLE_BAR - MARGIN));

  const startResize = (edge: Edge) => (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    resize.current = { edge, startX: e.clientX, startY: e.clientY, w, h };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = resize.current;
    if (!r) return;
    const nextW = r.edge === 's' ? r.w : Math.min(r.w + e.clientX - r.startX, area.w - x - MARGIN);
    const nextH = r.edge === 'e' ? r.h : Math.min(r.h + e.clientY - r.startY, area.h - y - MARGIN);
    resizeWindow(id, nextW, nextH);
  };
  const endResize = (e: ReactPointerEvent<HTMLDivElement>) => {
    resize.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const handleProps = (edge: Edge) => ({ onPointerDown: startResize(edge), onPointerMove: onResizeMove, onPointerUp: endResize });

  return (
    <div
      data-tour={`window-${id}`}
      className={`absolute flex flex-col overflow-hidden rounded-lg border bg-slate-900 shadow-2xl ${focused ? 'border-slate-500' : 'border-slate-700 opacity-95'}`}
      style={{ left: x, top: y, width: w, height: h, zIndex: win.z }}
      onPointerDownCapture={() => focusApp(id)}
      role="dialog"
      aria-label={title}
    >
      <div
        className={`flex h-10 shrink-0 touch-none select-none items-center justify-between px-3 ${win.maximized ? '' : 'cursor-grab active:cursor-grabbing'} ${focused ? 'bg-slate-800' : 'bg-slate-800/60'}`}
        onDoubleClick={(e) => !(e.target as HTMLElement).closest('button') && toggleMaximize(id)}
        onPointerDown={(e) => {
          if (win.maximized || (e.target as HTMLElement).closest('button')) return;
          drag.current = { dx: e.clientX - x, dy: e.clientY - y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          moveWindow(id, e.clientX - drag.current.dx, e.clientY - drag.current.dy);
        }}
        onPointerUp={(e) => {
          if (!drag.current) return;
          drag.current = null;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      >
        <span className={`text-sm font-semibold ${focused ? 'text-white' : 'text-slate-400'}`}>{title}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleMaximize(id)}
            aria-label={win.maximized ? `Restore ${title}` : `Maximise ${title}`}
            title={win.maximized ? 'Restore' : 'Maximise'}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-600 hover:text-white"
          >
            {win.maximized ? '❐' : '□'}
          </button>
          <button
            type="button"
            onClick={() => closeApp(id)}
            aria-label={`Close ${title}`}
            title="Close"
            className="flex h-6 w-6 items-center justify-center rounded text-lg leading-none text-slate-400 hover:bg-rose-600 hover:text-white"
          >
            ×
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">{children}</div>

      {!win.maximized && (
        <>
          <div className="absolute right-0 top-10 bottom-3 w-1.5 cursor-ew-resize touch-none" {...handleProps('e')} />
          <div className="absolute bottom-0 left-0 right-3 h-1.5 cursor-ns-resize touch-none" {...handleProps('s')} />
          <div className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize touch-none" title="Drag to resize" {...handleProps('se')}>
            <svg viewBox="0 0 16 16" className="h-4 w-4 text-slate-500" aria-hidden>
              <path d="M14 6 L6 14 M14 10 L10 14" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
