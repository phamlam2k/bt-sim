import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Npc } from './content/schema';
import { useStore } from './store';

export function Avatar({ npc, size = 36 }: { npc: Pick<Npc, 'initials' | 'color'> | undefined; size?: number }) {
  return (
    <div
      className="flex shrink-0 select-none items-center justify-center rounded-md font-semibold text-white"
      style={{ width: size, height: size, background: npc?.color ?? '#64748b', fontSize: size * 0.38 }}
      aria-hidden
    >
      {npc?.initials ?? '?'}
    </div>
  );
}

export function playerAvatar(name: string): Pick<Npc, 'initials' | 'color'> {
  const parts = name.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? 'Y') + (parts[1]?.[0] ?? '')).toUpperCase();
  return { initials, color: '#059669' };
}

const WHY_WIDTH = 380;
const WHY_MAX_HEIGHT = 300;

/** A small "Why?" button that explains the reason behind a step, in plain English. */
export function Why({ id, label = 'Why?' }: { id: string; label?: string }) {
  const why = useStore((s) => s.content.pack.whys[id]);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const open = pos !== null;

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!button.current?.contains(t) && !popover.current?.contains(t)) setPos(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPos(null);
    const dismiss = () => setPos(null);
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', dismiss);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', dismiss);
    };
  }, [open]);

  if (!why) return null;

  const toggle = () => {
    if (open || !button.current) return setPos(null);
    const r = button.current.getBoundingClientRect();
    const width = Math.min(WHY_WIDTH, window.innerWidth - 24);
    const left = Math.max(12, Math.min(r.left, window.innerWidth - width - 12));
    // Open below the button, or above it when there is no room below.
    const below = r.bottom + 6;
    const top = below + WHY_MAX_HEIGHT > window.innerHeight ? Math.max(12, r.top - 6 - WHY_MAX_HEIGHT) : below;
    setPos({ left, top });
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[0.8rem] font-medium text-sky-300 hover:bg-sky-500/20"
      >
        {label}
      </button>
      {pos &&
        // Rendered at the top of the page so no window or scroll area can clip it.
        createPortal(
          <div
            ref={popover}
            role="dialog"
            aria-label={why.title}
            className="scroll-thin fixed z-[2500] overflow-y-auto rounded-lg border border-sky-500/40 bg-slate-950 p-4 text-left text-sm leading-relaxed text-slate-200 shadow-2xl"
            style={{ left: pos.left, top: pos.top, width: Math.min(WHY_WIDTH, window.innerWidth - 24), maxHeight: WHY_MAX_HEIGHT }}
          >
            <div className="mb-1.5 font-semibold text-sky-300">{why.title}</div>
            {why.body}
          </div>,
          document.body,
        )}
    </>
  );
}

export function Meter({ label, value, color, hint }: { label: ReactNode; value: number; color: string; hint?: string }) {
  return (
    <div title={hint}>
      <div className="mb-1 flex items-center justify-between text-[0.8rem] text-slate-400">
        <span className="flex items-center gap-1.5">{label}</span>
        <span className="tabular-nums text-slate-300">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/70" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'default',
  disabled,
  title,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const styles = {
    default: 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700',
    primary: 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-500',
    danger: 'border-rose-500 bg-rose-600 text-white hover:bg-rose-500',
    ghost: 'border-transparent bg-transparent text-slate-300 hover:bg-slate-700/60',
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
