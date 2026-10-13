import { useEffect, useRef, useState } from 'react';
import { canOpenCr } from '../engine/git';
import { gitSuggestion } from '../engine/selectors';
import { findTicket } from '../engine/tickets';
import type { GitState } from '../engine/types';
import { useStore } from '../store';
import { Button, Why } from '../ui';

export function GitApp() {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const dispatch = useStore((s) => s.dispatch);
  const [input, setInput] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const termEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const g = game.git;
  const { file, workPoints } = content.git;
  const ticket = findTicket(content, content.git.ticketKey)!;
  const term = content.pack.terminology.changeRequest;
  const { difficulty } = game.setup;
  const suggestion = gitSuggestion(game, content);
  const showSuggestion = difficulty === 'guided' || (difficulty === 'standard' && showHelp);
  const workDone = g.workProgress >= workPoints;
  const percent = Math.round((g.workProgress / workPoints) * 100);
  const fileLines = workDone ? file.after : file.before;

  useEffect(() => {
    termEnd.current?.scrollIntoView({ block: 'end' });
  }, [g.terminal.length]);

  const run = (command: string) => {
    if (!command.trim()) return;
    dispatch({ type: 'GIT_CMD', input: command });
    setInput('');
    setShowHelp(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_19rem] border-b border-slate-700">
        <section className="flex min-h-0 min-w-0 flex-col border-r border-slate-700">
          <div data-tour="git-ticket" className="border-b border-slate-700 bg-slate-900/70 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-sky-500/20 px-1.5 py-0.5 font-mono font-semibold text-sky-300">{ticket.key}</span>
              <span className="font-semibold text-white">{ticket.title}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{ticket.description}</p>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-3 py-1 font-mono text-[0.8rem] text-slate-400">
            <span>
              {file.path}
              {g.modified && !g.staged && <span className="ml-2 text-amber-400">● modified</span>}
              {g.staged && <span className="ml-2 text-emerald-400">● staged</span>}
            </span>
            <span className="font-sans">editor</span>
          </div>
          <div data-tour="git-editor" className="scroll-thin min-h-0 flex-1 overflow-auto bg-slate-950 py-2 font-mono text-[0.875rem] leading-6">
            {fileLines.map((line, i) => {
              const changed = i + 1 === file.changedLine;
              return (
                <div key={i} className={`flex min-w-max ${changed ? (workDone ? 'bg-emerald-950/60' : 'bg-amber-500/10') : ''}`}>
                  <span className="w-9 shrink-0 select-none pr-2 text-right text-slate-600">{i + 1}</span>
                  <span className="whitespace-pre">{line || ' '}</span>
                  {changed && !workDone && g.workProgress > 0 && <span className="cursor-blink text-emerald-400">▍</span>}
                </div>
              );
            })}
          </div>
          <div className="border-t border-slate-700 bg-slate-900 px-3 py-2 text-xs">
            {workDone ? (
              <span className="text-emerald-300">
                {g.modified || g.staged ? 'The fix is written. Now save it with Git, using the terminal below.' : 'The fix is committed.'}
              </span>
            ) : (
              <>
                <div className="mb-1 flex items-center justify-between text-slate-300">
                  <span>Writing the fix… keep this window in front. Higher Flow means faster work.</span>
                  <span className="tabular-nums text-slate-400">{percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
                  <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${percent}%` }} />
                </div>
              </>
            )}
          </div>
        </section>

        <aside className="scroll-thin min-h-0 overflow-y-auto bg-slate-900/60 p-3 text-xs">
          <div data-tour="git-history">
            <h3 className="mb-2 font-semibold text-slate-200">History</h3>
            <CommitGraph g={g} />
          </div>
          <div data-tour="git-why" className="mt-3 flex flex-wrap gap-1.5">
            <Why id="branch" label="Why branch?" />
            <Why id="commit-message" label="Why messages?" />
            <Why id="small-cr" label="Why small?" />
            <Why id="pipeline" label="Why stages?" />
          </div>
          <div data-tour="git-open-cr" className="mt-3 border-t border-slate-700 pt-3">
            <Button variant="primary" className="w-full" disabled={!canOpenCr(g)} onClick={() => dispatch({ type: 'GIT_OPEN_CR' })}>
              {g.merged ? `${term} merged ✓` : g.crOpen ? `${term} in review…` : `Open ${term}`}
            </Button>
            <p className="mt-1.5 leading-relaxed text-slate-500">
              {g.merged
                ? 'Your change is on main and moving through the pipeline.'
                : g.crOpen
                  ? 'A teammate is reading your change.'
                  : canOpenCr(g)
                    ? 'Your branch is on the remote. Ask for a review.'
                    : 'Available once your branch has been pushed.'}
            </p>
          </div>
        </aside>
      </div>

      <section data-tour="git-terminal" className="flex h-64 shrink-0 flex-col bg-black/70 font-mono text-[0.875rem]" onClick={() => inputRef.current?.focus()}>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-2 leading-5">
          <div className="text-slate-500">Terminal. Type a command and press Enter, or type "help".</div>
          {g.terminal.map((l, i) => (
            <div
              key={i}
              className={
                l.kind === 'in' ? 'text-slate-100' : l.kind === 'err' ? 'text-rose-300' : l.kind === 'tip' ? 'font-sans text-xs text-sky-300' : 'whitespace-pre text-slate-400'
              }
            >
              {l.kind === 'in' ? `$ ${l.text}` : l.text}
            </div>
          ))}
          <div ref={termEnd} />
        </div>

        {showSuggestion && (
          <div className="flex items-center gap-2 border-t border-slate-800 bg-slate-900/80 px-3 py-1.5 font-sans text-xs">
            <span className="shrink-0 text-amber-300">Next:</span>
            {suggestion.command ? (
              <button
                type="button"
                onClick={() => run(suggestion.command!)}
                className="truncate rounded border border-amber-400/50 bg-amber-500/10 px-2 py-0.5 font-mono text-amber-100 hover:bg-amber-500/25"
                title="Click to run this command"
              >
                {suggestion.command}
              </button>
            ) : (
              <span className="text-slate-300">{suggestion.note}</span>
            )}
          </div>
        )}

        <form
          className="flex items-center gap-2 border-t border-slate-800 px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(input);
          }}
        >
          <span className="shrink-0 text-emerald-400">
            ~/{content.git.repo} <span className="text-sky-400">({g.branch})</span> $
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal input"
            className="min-w-0 flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
            placeholder="git status"
          />
          {difficulty === 'standard' && !showHelp && (
            <button type="button" onClick={() => setShowHelp(true)} className="shrink-0 font-sans text-xs text-slate-400 hover:text-amber-300">
              Need a hint?
            </button>
          )}
        </form>
      </section>
    </div>
  );
}

/** Draws main as a row of commits, with the player's branch splitting off below it. */
function CommitGraph({ g }: { g: GitState }) {
  const mainLine: string[] = [];
  const branchLine: string[] = [];
  const featureBranch = Object.keys(g.branches).find((b) => b !== 'main');

  for (const commit of g.commits) (commit.branch === 'main' ? mainLine : branchLine).push(commit.id);

  const gap = 44;
  const width = Math.max(mainLine.length + branchLine.length, 4) * gap + 16;
  const mainY = 22;
  const branchY = 62;
  const x = (i: number) => 18 + i * gap;
  const forkX = x(mainLine.length - 1);

  return (
    <div>
      <div className="scroll-thin overflow-x-auto rounded-md border border-slate-700 bg-slate-950 p-1">
        <svg width={width} height={branchLine.length > 0 || featureBranch ? 84 : 44} role="img" aria-label="Commit history">
          <line x1={x(0)} y1={mainY} x2={g.merged ? x(mainLine.length - 1 + branchLine.length) : forkX} y2={mainY} stroke="#64748b" strokeWidth={2} />
          {mainLine.map((id, i) => (
            <circle key={id} cx={x(i)} cy={mainY} r={6} fill="#94a3b8" />
          ))}
          {branchLine.length > 0 && (
            <>
              <path d={`M ${forkX} ${mainY} C ${forkX + 20} ${mainY}, ${forkX + 20} ${branchY}, ${x(mainLine.length)} ${branchY}`} fill="none" stroke="#10b981" strokeWidth={2} />
              <line x1={x(mainLine.length)} y1={branchY} x2={x(mainLine.length + branchLine.length - 1)} y2={branchY} stroke="#10b981" strokeWidth={2} />
              {branchLine.map((id, i) => (
                <circle key={id} cx={x(mainLine.length + i)} cy={branchY} r={6} fill="#10b981" />
              ))}
              {g.merged && (
                <>
                  <path
                    d={`M ${x(mainLine.length + branchLine.length - 1)} ${branchY} L ${x(mainLine.length + branchLine.length - 1)} ${mainY}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                  <circle cx={x(mainLine.length + branchLine.length - 1)} cy={mainY} r={6} fill="#94a3b8" stroke="#10b981" strokeWidth={2} />
                </>
              )}
            </>
          )}
        </svg>
      </div>
      <ul className="mt-2 space-y-1">
        <li className="flex items-center gap-1.5">
          <i className="h-2.5 w-2.5 rounded-full bg-slate-400" />
          <code className="text-slate-200">main</code>
          <span className="text-slate-500">what customers run</span>
          {g.branch === 'main' && <span className="rounded bg-sky-500/25 px-1 text-[0.72rem] text-sky-200">you are here</span>}
        </li>
        {featureBranch && (
          <li className="flex flex-wrap items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <code className="break-all text-slate-200">{featureBranch}</code>
            {g.branch === featureBranch && <span className="rounded bg-sky-500/25 px-1 text-[0.72rem] text-sky-200">you are here</span>}
            <span className="text-slate-500">{g.remote[featureBranch] ? (g.merged ? 'merged' : 'pushed') : 'only on your laptop'}</span>
          </li>
        )}
      </ul>
      {g.commits.length > 0 && (
        <div className="mt-2 border-t border-slate-800 pt-2 text-slate-400">
          <div className="text-[0.72rem] uppercase tracking-wider text-slate-500">Latest commit</div>
          <code className="text-slate-300">{g.commits[g.commits.length - 1].id}</code> {g.commits[g.commits.length - 1].message}
        </div>
      )}
    </div>
  );
}
