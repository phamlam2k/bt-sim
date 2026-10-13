import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BACKGROUNDS, COMPANIES, LADDER } from '../content/catalog';
import { formatClock } from '../engine/selectors';
import { useStore } from '../store';

type Stage = 'returning' | 'name' | 'company' | 'background' | 'role' | 'offer';

interface Line {
  text: string;
  /** "me" is something the player typed or chose. */
  who: 'terminal' | 'me';
}

const CHAR_MS = 16;
const SENTENCE_MS = 110;
const LINE_MS = 240;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Boot-log lines and shell commands are shown dimmer than the terminal's own voice. */
function isLogLine(text: string): boolean {
  return text.startsWith('$') || text.includes('....');
}

function TerminalLine({ line, cursor }: { line: Line; cursor?: boolean }) {
  const tone = line.who === 'me' ? 'text-white' : isLogLine(line.text) ? 'text-slate-500' : 'text-emerald-300';
  return (
    <div className={`min-h-[1.75rem] whitespace-pre-wrap break-words ${tone}`}>
      {line.text}
      {cursor && <span className="cursor-blink ml-0.5 text-emerald-400">▍</span>}
    </div>
  );
}

/**
 * Types the given lines one character at a time. Mounted fresh for every stage.
 * Enter, Space or a click finishes the current stage's text at once.
 */
function Typing({ lines, instant, onDone }: { lines: string[]; instant: boolean; onDone: () => void }) {
  const full = lines.join('\n');
  const [count, setCount] = useState(instant ? full.length : 0);
  const done = count >= full.length;
  const end = useRef<HTMLDivElement>(null);
  const lineCount = full.slice(0, count).split('\n').length;

  // Keep the newest line in view as the text grows.
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [lineCount]);

  useEffect(() => {
    if (done) return onDone();
    const previous = full[count - 1];
    const delay = previous === '\n' ? LINE_MS : previous && '.?!'.includes(previous) && full[count] === ' ' ? SENTENCE_MS : CHAR_MS;
    const timer = setTimeout(() => setCount((n) => n + 1), delay);
    return () => clearTimeout(timer);
  }, [count, done, full, onDone]);

  useEffect(() => {
    if (done) return;
    const skip = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      setCount(full.length);
    };
    window.addEventListener('keydown', skip);
    window.addEventListener('click', skip);
    return () => {
      window.removeEventListener('keydown', skip);
      window.removeEventListener('click', skip);
    };
  }, [done, full.length]);

  const shown = full.slice(0, count).split('\n');
  return (
    <div aria-live="polite">
      {shown.map((text, i) => (
        <TerminalLine key={i} line={{ text, who: 'terminal' }} cursor={!done && i === shown.length - 1} />
      ))}
      <div ref={end} />
    </div>
  );
}

interface Choice {
  id: string;
  label: string;
  detail?: string;
  tag?: string;
  locked?: boolean;
}

/** A numbered menu. Works with a click, or with the number keys like a real terminal prompt. */
function Choices({ choices, onPick, onLocked }: { choices: Choice[]; onPick: (id: string) => void; onLocked?: (id: string) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const choice = choices[Number(e.key) - 1];
      if (!choice) return;
      if (choice.locked) onLocked?.(choice.id);
      else onPick(choice.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choices, onPick, onLocked]);

  return (
    <div className="mt-2 space-y-1.5" role="list">
      {choices.map((c, i) => (
        <button
          key={c.id}
          type="button"
          role="listitem"
          aria-disabled={c.locked}
          onClick={() => (c.locked ? onLocked?.(c.id) : onPick(c.id))}
          className={`flex w-full items-baseline gap-3 rounded border px-3 py-2 text-left transition-colors ${
            c.locked
              ? 'cursor-not-allowed border-slate-800 text-slate-600'
              : 'border-emerald-500/40 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/10 focus-visible:bg-emerald-500/10 focus-visible:outline-none'
          }`}
        >
          <span className={c.locked ? 'text-slate-700' : 'text-amber-300'}>[{i + 1}]</span>
          <span className="min-w-0 flex-1">
            <span className={`font-semibold ${c.locked ? '' : 'text-white'}`}>{c.label}</span>
            {c.detail && <span className="block text-[0.85em] opacity-80">{c.detail}</span>}
          </span>
          {c.tag && (
            <span className={`shrink-0 rounded px-1.5 text-[0.75em] uppercase tracking-wider ${c.locked ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500/20 text-emerald-300'}`}>
              {c.tag}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Onboarding() {
  const content = useStore((s) => s.content);
  const saved = useStore((s) => s.saved);
  const startGame = useStore((s) => s.startGame);
  const continueSaved = useStore((s) => s.continueSaved);

  const [instant] = useState(prefersReducedMotion);
  const [stage, setStage] = useState<Stage>(saved ? 'returning' : 'name');
  const [typed, setTyped] = useState(false);
  const [transcript, setTranscript] = useState<Line[]>([]);
  const [name, setName] = useState('');
  const [draftName, setDraftName] = useState('');
  const [companyId, setCompanyId] = useState(COMPANIES[0].id);
  const [backgroundId, setBackgroundId] = useState(BACKGROUNDS[0].id);
  const [note, setNote] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  const company = COMPANIES.find((c) => c.id === companyId)!;
  const background = BACKGROUNDS.find((b) => b.id === backgroundId)!;
  const mentor = content.npcs[content.pack.mentor];

  const lines: string[] = (() => {
    switch (stage) {
      case 'returning': {
        const s = saved!.state;
        return [
          '$ ./career --resume',
          '',
          `Welcome back, ${s.setup.playerName}.`,
          s.phase === 'dayEnd' ? `Day ${s.day} is finished and your summary is waiting.` : `You left off on day ${s.day}, at ${formatClock(s.minute)}.`,
          'Nothing happened while you were away.',
        ];
      }
      case 'name':
        return [
          '$ ./career --start',
          'loading ambition ............ ok',
          'loading impostor syndrome ... ok',
          'coffee ...................... not found (continuing anyway)',
          '',
          'Hello.',
          'So you want to know what working in Big Tech is really like.',
          'Not the interview. The job.',
          '',
          'First things first: what should we call you?',
        ];
      case 'company':
        return [`Nice to meet you, ${name}.`, '', 'Where would you like to work?'];
      case 'background':
        return [`${company.name}. ${company.quip}`, '', 'One question before we print your badge.', 'Which of these sounds most like you?'];
      case 'role':
        return [...background.response, '(You can change the help level at any time once you are in.)', '', `Checking open positions for ${name}...`];
      case 'offer':
        return ['Everyone starts as an intern here. Yes, even you.', '', 'Printing your offer letter...'];
    }
  })();

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  });

  useEffect(() => {
    if (typed && stage === 'name') nameInput.current?.focus();
  }, [typed, stage]);

  /** Freezes the current stage into the transcript, records the player's answer, and moves on. */
  const advance = (answer: string, next: Stage) => {
    setTranscript((t) => [...t, ...lines.map((text): Line => ({ text, who: 'terminal' })), { text: `> ${answer}`, who: 'me' }, { text: '', who: 'terminal' }]);
    setNote(null);
    setTyped(false);
    setStage(next);
  };

  let prompt: ReactNode = null;
  if (typed) {
    if (stage === 'returning') {
      prompt = (
        <Choices
          choices={[
            { id: 'continue', label: 'Continue where I left off' },
            { id: 'restart', label: 'Start over', detail: 'Your saved game is replaced once you accept a new offer.' },
          ]}
          onPick={(id) => (id === 'continue' ? continueSaved() : advance('Start over', 'name'))}
        />
      );
    } else if (stage === 'name') {
      prompt = (
        <form
          className="mt-1 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const chosen = draftName.trim() || 'New Hire';
            setName(chosen);
            advance(chosen, 'company');
          }}
        >
          <span className="text-amber-300">&gt;</span>
          <input
            ref={nameInput}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            maxLength={24}
            spellCheck={false}
            autoComplete="off"
            aria-label="Your name"
            placeholder="type your name and press Enter"
            className="min-w-0 flex-1 bg-transparent text-white caret-emerald-400 outline-none placeholder:text-slate-600"
          />
          <button type="submit" className="rounded border border-emerald-500/50 px-3 py-0.5 text-emerald-300 hover:bg-emerald-500/10">
            Enter ↵
          </button>
        </form>
      );
    } else if (stage === 'company') {
      prompt = (
        <Choices
          choices={COMPANIES.map((c) => ({ id: c.id, label: c.name, detail: c.tagline, tag: c.available ? c.mood : 'coming soon', locked: !c.available }))}
          onPick={(id) => {
            setCompanyId(id);
            advance(COMPANIES.find((c) => c.id === id)!.name, 'background');
          }}
          onLocked={(id) => setNote(`${COMPANIES.find((c) => c.id === id)!.name} is not hiring yet. Their recruiters will be in touch. Probably.`)}
        />
      );
    } else if (stage === 'background') {
      prompt = (
        <Choices
          choices={BACKGROUNDS.map((b) => ({ id: b.id, label: b.label }))}
          onPick={(id) => {
            setBackgroundId(id);
            advance(BACKGROUNDS.find((b) => b.id === id)!.label, 'role');
          }}
        />
      );
    } else if (stage === 'role') {
      prompt = (
        <Choices
          choices={LADDER.map((r) => ({ id: r.id, label: r.title, tag: r.note, locked: !r.open }))}
          onPick={(id) => advance(LADDER.find((r) => r.id === id)!.title, 'offer')}
          onLocked={() => setNote('Nice try. That title is earned, not chosen.')}
        />
      );
    } else {
      prompt = (
        <div className="mt-3 rounded border border-emerald-500/50 bg-emerald-500/5 p-4">
          <div className="mb-2 text-center tracking-[0.3em] text-amber-300">OFFER LETTER</div>
          <dl className="grid grid-cols-[7.5rem_1fr] gap-y-0.5 text-emerald-100">
            <dt className="text-slate-500">Name</dt>
            <dd className="text-white">{name}</dd>
            <dt className="text-slate-500">Company</dt>
            <dd>{content.pack.name}</dd>
            <dt className="text-slate-500">Team</dt>
            <dd>{content.pack.team}</dd>
            <dt className="text-slate-500">Role</dt>
            <dd>{LADDER[0].title}</dd>
            <dt className="text-slate-500">Mentor</dt>
            <dd>{mentor?.name}</dd>
            <dt className="text-slate-500">Starts</dt>
            <dd>Today, {formatClock(content.pack.dayStart)}</dd>
            <dt className="text-slate-500">Reads code in</dt>
            <dd>Python (Java and JavaScript coming soon)</dd>
            <dt className="text-slate-500">Help level</dt>
            <dd className="capitalize">{background.difficulty}</dd>
          </dl>
          <p className="mt-3 text-[0.85em] leading-relaxed text-slate-400">
            Your first week is three short days, about 5 to 10 minutes each. Stop after any of them: your progress saves by itself.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              autoFocus
              onClick={() => startGame({ playerName: name, difficulty: background.difficulty, lang: 'python' })}
              className="rounded border border-emerald-400 bg-emerald-500 px-5 py-2 font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Accept offer and start day one
            </button>
            <button
              type="button"
              onClick={() => {
                setTranscript([]);
                setDraftName(name);
                setTyped(false);
                setStage('name');
              }}
              className="text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
            >
              Change my answers
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="flex h-[min(92vh,52rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#05080c] shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900 px-4">
          <i className="h-3 w-3 rounded-full bg-rose-500/80" />
          <i className="h-3 w-3 rounded-full bg-amber-400/80" />
          <i className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-3 font-mono text-xs text-slate-400">career — onboarding</span>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-6 py-5 font-mono text-base leading-7">
          {transcript.map((line, i) => (
            <TerminalLine key={i} line={line} />
          ))}
          <Typing key={`${stage}-${transcript.length}`} lines={lines} instant={instant} onDone={() => setTyped(true)} />
          {prompt}
          {note && <div className="mt-2 text-amber-300">{note}</div>}
          <div ref={bottom} className="h-4" />
        </div>

        <div className="flex h-9 shrink-0 items-center justify-between border-t border-slate-800 bg-slate-900/60 px-4 font-mono text-xs text-slate-500">
          <span>{typed ? (stage === 'name' ? 'Type your name, then press Enter.' : stage === 'offer' ? '' : 'Click an option, or press its number.') : 'Press Enter or click anywhere to skip the typing.'}</span>
          <span>A fictional company. Not affiliated with any real one.</span>
        </div>
      </div>
    </div>
  );
}
