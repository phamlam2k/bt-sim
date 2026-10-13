import { useState } from 'react';
import { useStore } from '../store';

type Tab = 'terms' | 'review' | 'why';

export function GlossaryApp() {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const [tab, setTab] = useState<Tab>('terms');

  const known = content.glossary.filter((g) => game.glossary.includes(g.id));
  const locked = content.glossary.length - known.length;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'terms', label: `Words (${known.length})` },
    { id: 'review', label: 'Review checklist' },
    { id: 'why', label: 'Why we do it' },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex gap-1 border-b border-slate-700 bg-slate-900/70 px-3 pt-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-t-md px-3 py-1.5 text-xs font-medium ${tab === t.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4 text-sm">
        {tab === 'terms' && (
          <>
            {known.length === 0 && <p className="text-slate-400">Words you meet at work are collected here, with a plain explanation.</p>}
            <dl className="space-y-3">
              {known.map((g) => (
                <div key={g.id}>
                  <dt className="font-semibold text-emerald-300">{g.term}</dt>
                  <dd className="leading-relaxed text-slate-300">{g.def}</dd>
                </div>
              ))}
            </dl>
            {locked > 0 && <p className="mt-4 text-xs text-slate-500">{locked} more to discover today.</p>}
          </>
        )}

        {tab === 'review' && (
          <ol className="space-y-3">
            {content.pack.reviewChecklist.map((q, i) => (
              <li key={q.title}>
                <div className="font-semibold text-slate-100">
                  {i + 1}. {q.title}
                </div>
                <p className="leading-relaxed text-slate-300">{q.detail}</p>
              </li>
            ))}
          </ol>
        )}

        {tab === 'why' && (
          <div className="space-y-4">
            {Object.entries(content.pack.whys).map(([id, w]) => (
              <section key={id}>
                <h3 className="font-semibold text-sky-300">{w.title}</h3>
                <p className="leading-relaxed text-slate-300">{w.body}</p>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
