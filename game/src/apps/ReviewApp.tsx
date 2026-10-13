import { useEffect, useState } from 'react';
import type { Category, Puzzle } from '../content/schema';
import { variantFor } from '../engine/review';
import type { ReviewComment, ReviewSession } from '../engine/types';
import { useStore } from '../store';
import { Avatar, Button, Why } from '../ui';

const STUCK_AFTER_MS = 45_000;

export function ReviewApp() {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const activePuzzle = useStore((s) => s.activePuzzle);
  const setPuzzle = useStore((s) => s.setPuzzle);
  const term = content.pack.terminology.changeRequest;

  const delivered = content.puzzles.filter((p) => game.reviews[p.id]);
  const firstPending = delivered.find((p) => !game.reviews[p.id].verdict);
  const fallback = (firstPending ?? delivered[delivered.length - 1])?.id ?? null;
  const selectedId = activePuzzle && game.reviews[activePuzzle] ? activePuzzle : fallback;

  useEffect(() => {
    if (selectedId !== activePuzzle) setPuzzle(selectedId);
  }, [selectedId, activePuzzle, setPuzzle]);

  const puzzle = content.puzzles.find((p) => p.id === selectedId);

  if (!puzzle) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <div className="text-lg font-semibold text-white">No {term}s to review yet</div>
        <p className="max-w-sm text-sm text-slate-400">
          Nobody has asked for your review yet. When a teammate sends you a {term}, it appears here. The Today panel shows what to do next.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <nav className="scroll-thin w-44 shrink-0 overflow-y-auto border-r border-slate-700 bg-slate-950/60 p-2">
        <div className="px-1 pb-1 text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">Your review queue</div>
        {delivered.map((p) => {
          const session = game.reviews[p.id];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPuzzle(p.id)}
              className={`mb-1 block w-full rounded-md border px-2 py-1.5 text-left ${
                p.id === puzzle.id ? 'border-emerald-500/60 bg-emerald-600/15' : 'border-transparent hover:bg-slate-800'
              }`}
            >
              <div className="line-clamp-2 text-xs font-medium text-slate-100">{p.title}</div>
              <div className="mt-1 flex items-center justify-between text-[0.72rem]">
                <span className="text-slate-400">{content.npcs[p.author]?.name.split(' ')[0]}</span>
                {session.verdict && !session.needsRework && session.firstResult ? (
                  <span className={session.firstResult.score >= 70 ? 'text-emerald-400' : session.firstResult.score >= 40 ? 'text-amber-400' : 'text-rose-400'}>
                    {session.firstResult.score}/100
                  </span>
                ) : session.attempts > 0 ? (
                  <span className="rounded bg-rose-500/25 px-1 text-rose-200">sent back</span>
                ) : (
                  <span className="rounded bg-amber-500/20 px-1 text-amber-300">needs review</span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
      <ReviewPane key={puzzle.id} puzzle={puzzle} session={game.reviews[puzzle.id]} nextPendingId={delivered.find((p) => p.id !== puzzle.id && !game.reviews[p.id].verdict)?.id ?? null} />
    </div>
  );
}

function ReviewPane({ puzzle, session, nextPendingId }: { puzzle: Puzzle; session: ReviewSession; nextPendingId: string | null }) {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const dispatch = useStore((s) => s.dispatch);
  const setPuzzle = useStore((s) => s.setPuzzle);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [hoverLine, setHoverLine] = useState<number | null>(null);
  const [stuck, setStuck] = useState(false);

  const { difficulty, lang } = game.setup;
  const variant = variantFor(puzzle, lang);
  const term = content.pack.terminology.changeRequest;
  const author = content.npcs[puzzle.author];
  const done = session.verdict !== null;
  const lineCats = content.pack.lineCategories;
  const crCats = content.pack.crCategories;
  const catLabel = (id?: string) => [...lineCats, ...crCats].find((x) => x.id === id)?.label ?? id ?? '';

  // Guided mode notices when the player has gone quiet and offers help; it never acts for them.
  useEffect(() => {
    setStuck(false);
    if (difficulty !== 'guided' || done || session.hintTier >= 3) return;
    const t = setTimeout(() => setStuck(true), STUCK_AFTER_MS);
    return () => clearTimeout(t);
  }, [difficulty, done, session.hintTier, session.comments.length]);

  const comment = (c: ReviewComment) => {
    dispatch({ type: 'REVIEW_COMMENT', puzzleId: puzzle.id, comment: c });
    setSelectedLine(null);
  };

  const issueByLine = new Map<number, string>();
  // While the review is back with the player, the missed lines stay hidden: finding them is the point.
  if (done && !session.needsRework) {
    for (const issue of puzzle.issues) for (const n of variant.issueLines[issue.id] ?? []) issueByLine.set(n, issue.id);
  }
  const inHintRegion = (n: number) => !done && session.hintTier >= 2 && !!variant.hintRegion && n >= variant.hintRegion[0] && n <= variant.hintRegion[1];
  const focusLine = hoverLine ?? selectedLine;
  const plain = focusLine ? variant.plain[String(focusLine)] : undefined;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header data-tour="review-header" className="border-b border-slate-700 px-4 py-2.5">
        <div className="flex items-start gap-2.5">
          <Avatar npc={author} />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-white">{puzzle.title}</h2>
            <div className="text-xs text-slate-400">
              {author?.name} wants to merge into <code className="text-slate-300">{content.pack.terminology.mainBranch}</code>
            </div>
          </div>
          <Why id="review" />
        </div>
        <p className={`mt-2 rounded-md bg-slate-800/60 px-3 py-2 text-xs leading-relaxed ${puzzle.description ? 'text-slate-200' : 'italic text-slate-500'}`}>
          {puzzle.description || '(The author left the description empty.)'}
        </p>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-slate-800 bg-slate-950/50 px-3 py-1 font-mono text-[0.8rem] text-slate-400">{variant.path}</div>
          <div data-tour="review-diff" className="scroll-thin min-h-0 flex-1 overflow-auto bg-slate-950 py-1 font-mono text-[0.875rem] leading-6">
            {variant.diff.map((raw, i) => {
              const n = i + 1;
              const sign = raw[0];
              const code = raw.slice(1);
              const mine = session.comments.find((c) => c.line === n);
              const issueId = issueByLine.get(n);
              const outcome = issueId ? session.result?.outcomes.find((o) => o.issueId === issueId) : undefined;
              const tone = sign === '+' ? 'bg-emerald-950/50' : sign === '-' ? 'bg-rose-950/40 text-slate-400' : '';
              return (
                <div key={n}>
                  <div
                    role={done ? undefined : 'button'}
                    tabIndex={done ? undefined : 0}
                    onClick={() => !done && setSelectedLine(selectedLine === n ? null : n)}
                    onKeyDown={(e) => !done && e.key === 'Enter' && setSelectedLine(selectedLine === n ? null : n)}
                    onMouseEnter={() => setHoverLine(n)}
                    onMouseLeave={() => setHoverLine(null)}
                    className={`flex min-w-max items-center border-l-2 pr-3 ${tone} ${done ? '' : 'cursor-pointer hover:brightness-150'} ${
                      selectedLine === n ? 'border-sky-400 bg-sky-900/40!' : outcome ? (outcome.found ? 'border-emerald-400' : 'border-rose-500 bg-rose-900/40!') : inHintRegion(n) ? 'border-amber-400 bg-amber-500/10!' : 'border-transparent'
                    }`}
                  >
                    <span className="w-9 shrink-0 select-none pr-2 text-right text-slate-600">{n}</span>
                    <span className={`w-4 shrink-0 select-none ${sign === '+' ? 'text-emerald-400' : sign === '-' ? 'text-rose-400' : 'text-slate-700'}`}>{sign}</span>
                    <span className="whitespace-pre">{code || ' '}</span>
                    {mine && (
                      <span
                        className={`ml-3 flex shrink-0 items-center gap-1 rounded px-1.5 font-sans text-[0.72rem] font-medium ${
                          mine.kind === 'bug' ? 'bg-rose-500/25 text-rose-200' : mine.kind === 'nit' ? 'bg-slate-600/50 text-slate-200' : 'bg-sky-500/25 text-sky-200'
                        }`}
                      >
                        {mine.kind === 'bug' ? catLabel(mine.category) : mine.kind === 'nit' ? 'nit' : 'question'}
                        {!done && (
                          <button
                            type="button"
                            aria-label="Remove comment"
                            className="text-slate-300 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch({ type: 'REVIEW_REMOVE_COMMENT', puzzleId: puzzle.id, index: session.comments.indexOf(mine) });
                            }}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    )}
                    {outcome && !outcome.found && <span className="ml-3 shrink-0 rounded bg-rose-600 px-1.5 font-sans text-[0.72rem] font-semibold text-white">missed</span>}
                  </div>
                  {selectedLine === n && !done && (
                    <LinePicker
                      categories={lineCats}
                      onBug={(category) => comment({ kind: 'bug', line: n, category })}
                      onQuestion={() => comment({ kind: 'question', line: n })}
                      onNit={() => comment({ kind: 'nit', line: n })}
                      onCancel={() => setSelectedLine(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div data-tour="review-plain" className="min-h-[4.5rem] border-t border-slate-700 bg-slate-900 px-3 py-2 text-sm leading-relaxed">
            {difficulty === 'realistic' ? (
              <span className="text-slate-500">Plain-English help is off in Realistic mode.</span>
            ) : focusLine && plain ? (
              <>
                <span className="font-semibold text-sky-300">Line {focusLine} in plain English: </span>
                <span className="text-slate-200">{plain}</span>
              </>
            ) : focusLine ? (
              <span className="text-slate-500">Line {focusLine}: nothing special here (a blank line, an import or a comment).</span>
            ) : (
              <span className="text-slate-500">
                {done ? 'Hover a line to see what it does.' : 'Hover a line to read it in plain English. Click a line to leave a comment on it.'}
              </span>
            )}
          </div>
        </div>

        <aside className="scroll-thin w-[17rem] shrink-0 overflow-y-auto border-l border-slate-700 bg-slate-900/70 p-3 text-xs">
          {done && session.needsRework ? (
            <SentBack puzzle={puzzle} session={session} catLabel={catLabel} onAgain={() => dispatch({ type: 'REVIEW_ACK', puzzleId: puzzle.id })} />
          ) : done ? (
            <Explanation
              puzzle={puzzle}
              session={session}
              catLabel={catLabel}
              onAck={() => {
                dispatch({ type: 'REVIEW_ACK', puzzleId: puzzle.id });
                if (nextPendingId) setPuzzle(nextPendingId);
              }}
            />
          ) : (
            <div className="space-y-4">
              <section data-tour="review-cr-checks">
                <h3 className="mb-1.5 font-semibold text-slate-200">About the whole {term}</h3>
                <div className="space-y-1.5">
                  {crCats.map((cat) => {
                    const index = session.comments.findIndex((c) => c.kind === 'cr' && c.category === cat.id);
                    const on = index >= 0;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          on
                            ? dispatch({ type: 'REVIEW_REMOVE_COMMENT', puzzleId: puzzle.id, index })
                            : dispatch({ type: 'REVIEW_COMMENT', puzzleId: puzzle.id, comment: { kind: 'cr', line: null, category: cat.id } })
                        }
                        className={`block w-full rounded-md border px-2.5 py-1.5 text-left ${on ? 'border-rose-400 bg-rose-500/20' : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'}`}
                      >
                        <span className="font-medium text-slate-100">
                          {on ? '☑' : '☐'} {cat.label}
                        </span>
                        <span className="mt-0.5 block text-[0.8rem] leading-snug text-slate-400">{cat.plain}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="mb-1.5 font-semibold text-slate-200">The four questions</h3>
                <ol className="space-y-1 text-slate-400">
                  {content.pack.reviewChecklist.map((q, i) => (
                    <li key={q.title} title={q.detail}>
                      <span className="text-slate-300">
                        {i + 1}. {q.title}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>

              {difficulty !== 'realistic' && (
                <section data-tour="review-hint" className={`rounded-md border p-2.5 ${stuck ? 'border-amber-400 bg-amber-500/10' : 'border-slate-700 bg-slate-800/40'}`}>
                  {stuck && session.hintTier === 0 && <p className="mb-2 text-amber-200">Not sure where to look? That is normal on day one. Maya can point you in the right direction.</p>}
                  {session.hintTier >= 1 && <Hint n={1} text={puzzle.hints.look} />}
                  {session.hintTier >= 2 && <Hint n={2} text={puzzle.hints.region} />}
                  {session.hintTier >= 3 && <Hint n={3} text={puzzle.hints.reveal} />}
                  <Button
                    className={`w-full ${stuck ? 'animate-pulse' : ''}`}
                    disabled={session.hintTier >= 3}
                    onClick={() => dispatch({ type: 'REVIEW_HINT', puzzleId: puzzle.id })}
                  >
                    {session.hintTier === 0 ? 'Ask Maya for a hint' : session.hintTier >= 3 ? 'No more hints' : `Another hint (${session.hintTier}/3 used)`}
                  </Button>
                  {difficulty === 'standard' && <p className="mt-1.5 text-[0.8rem] text-slate-500">Each hint uses a little of Maya's patience.</p>}
                </section>
              )}

              <section data-tour="review-verdict">
                <div className="mb-1.5 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-200">Your decision</h3>
                  <Why id="verdict" />
                </div>
                <p className="mb-2 text-slate-400">
                  {session.comments.length === 0 ? 'No comments yet.' : `${session.comments.length} comment${session.comments.length === 1 ? '' : 's'} so far.`}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="primary" onClick={() => dispatch({ type: 'REVIEW_VERDICT', puzzleId: puzzle.id, verdict: 'approve' })}>
                    Approve
                  </Button>
                  <Button variant="danger" onClick={() => dispatch({ type: 'REVIEW_VERDICT', puzzleId: puzzle.id, verdict: 'changes' })}>
                    Request changes
                  </Button>
                </div>
              </section>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Hint({ n, text }: { n: number; text: string }) {
  return (
    <p className="mb-2 leading-relaxed text-slate-200">
      <span className="mr-1 rounded bg-amber-500/25 px-1 text-[0.72rem] font-semibold text-amber-200">Hint {n}</span>
      {text}
    </p>
  );
}

function LinePicker({
  categories,
  onBug,
  onQuestion,
  onNit,
  onCancel,
}: {
  categories: Category[];
  onBug: (category: string) => void;
  onQuestion: () => void;
  onNit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="sticky left-0 w-[min(100%,40rem)] border-y border-sky-500/40 bg-slate-900 p-3 font-sans text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-sky-300">What is wrong with this line?</span>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-white">
          Cancel
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onBug(cat.id)}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-left hover:border-rose-400 hover:bg-slate-700"
          >
            <span className="block font-medium text-slate-100">{cat.label}</span>
            <span className="block text-[0.8rem] leading-snug text-slate-400">{cat.plain}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2 border-t border-slate-700 pt-2">
        <button type="button" onClick={onQuestion} className="rounded-md border border-slate-700 px-2 py-1 text-slate-200 hover:border-sky-400">
          Just a question
        </button>
        <button type="button" onClick={onNit} className="rounded-md border border-slate-700 px-2 py-1 text-slate-200 hover:border-slate-400" title="A small, optional remark about style. Never a reason to block.">
          Nit (optional style remark)
        </button>
      </div>
    </div>
  );
}

/** The mentor read the change after the player and found something serious still in it. */
function SentBack({ puzzle, session, catLabel, onAgain }: { puzzle: Puzzle; session: ReviewSession; catLabel: (id?: string) => string; onAgain: () => void }) {
  const result = session.result!;
  const content = useStore((s) => s.content);
  const term = content.pack.terminology.changeRequest;
  const mentor = content.npcs[content.pack.mentor];
  const serious = puzzle.issues.filter((i) => i.severity >= 2);
  const caught = serious.filter((i) => result.outcomes.find((o) => o.issueId === i.id)?.found);
  const left = serious.length - caught.length;
  const nudge = session.attempts >= 3 ? puzzle.hints.reveal : session.attempts === 2 ? puzzle.hints.region : puzzle.hints.look;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-rose-200">{mentor?.name.split(' ')[0] ?? 'Your mentor'} sent this one back</h3>
        <Why id="rework" label="Why?" />
      </div>

      <div className="flex gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 p-2.5 leading-relaxed text-rose-50">
        <Avatar npc={mentor} size={28} />
        <p>
          {left > 0
            ? `I read this ${term} after you. ${left === 1 ? 'One serious problem is' : `${left} serious problems are`} still in there, so it cannot ship yet. Have another look.`
            : result.shouldBlock
              ? `You found what matters, and then approved it anyway. A ${term} with a problem that must be fixed needs "Request changes".`
              : `I read this ${term} after you and could not find anything that has to change. Blocking it costs the author half a day. Take another look at what you flagged.`}
        </p>
      </div>

      {caught.length > 0 && (
        <div>
          <div className="mb-1 font-semibold text-slate-200">Already caught</div>
          <ul className="space-y-0.5 text-emerald-300">
            {caught.map((i) => (
              <li key={i.id}>✓ {catLabel(i.category)}</li>
            ))}
          </ul>
        </div>
      )}

      {result.falsePositives > 0 && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 leading-relaxed text-amber-100">
          {result.falsePositives} of your comments {result.falsePositives === 1 ? 'points' : 'point'} at something that is fine. Remove {result.falsePositives === 1 ? 'it' : 'them'} with the × next to
          the comment.
        </p>
      )}

      <p className="rounded-md border border-slate-700 bg-slate-800/60 px-2.5 py-2 leading-relaxed text-slate-200">
        <span className="mr-1 rounded bg-amber-500/25 px-1 text-[0.72rem] font-semibold text-amber-200">Where to look</span>
        {nudge}
      </p>

      <p className="text-slate-400">Your comments are kept. Your score for this {term} is from the first attempt: {session.firstResult?.score ?? result.score}/100.</p>

      <Button variant="primary" className="w-full" onClick={onAgain}>
        Take another look
      </Button>
    </div>
  );
}

function Explanation({
  puzzle,
  session,
  catLabel,
  onAck,
}: {
  puzzle: Puzzle;
  session: ReviewSession;
  catLabel: (id?: string) => string;
  onAck: () => void;
}) {
  const result = session.result!;
  const term = useStore((s) => s.content.pack.terminology.changeRequest);
  const firstScore = session.firstResult?.score ?? result.score;
  const scoreColor = firstScore >= 70 ? 'text-emerald-400' : firstScore >= 40 ? 'text-amber-400' : 'text-rose-400';
  const verdictText = session.verdict === 'approve' ? 'approved' : 'requested changes';
  const expected = result.shouldBlock ? 'This needed changes before it could ship.' : `This ${term} was safe to approve.`;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-200">How that went</h3>
        <span className={`text-2xl font-bold tabular-nums ${scoreColor}`}>{firstScore}</span>
      </div>
      {session.attempts > 1 && (
        <p className="text-slate-400">
          Done on attempt {session.attempts}. The score is from your first attempt; the fixes are what let this {term} ship.
        </p>
      )}

      <p className={`rounded-md border px-2.5 py-2 leading-relaxed ${result.verdictCorrect ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100' : 'border-rose-500/40 bg-rose-500/10 text-rose-100'}`}>
        You {verdictText}. {result.verdictCorrect ? 'Right call.' : 'Not the right call.'} {expected}
      </p>

      {puzzle.issues.length === 0 && puzzle.cleanNote && <p className="leading-relaxed text-slate-300">{puzzle.cleanNote}</p>}

      {puzzle.issues.map((issue) => {
        const outcome = result.outcomes.find((o) => o.issueId === issue.id)!;
        return (
          <article key={issue.id} className={`rounded-md border p-2.5 ${outcome.found ? 'border-emerald-500/40' : 'border-rose-500/50'}`}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-100">{catLabel(issue.category)}</span>
              <span className={`shrink-0 rounded px-1.5 text-[0.72rem] font-semibold ${outcome.found ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                {outcome.found ? (outcome.categoryRight ? 'caught' : 'right place') : 'missed'}
              </span>
            </div>
            {outcome.found && !outcome.categoryRight && <p className="mb-1 text-amber-200">You found the right line. The precise name for the problem is "{catLabel(issue.category)}".</p>}
            <p className="leading-relaxed text-slate-200">{issue.explain.what}</p>
            <p className="mt-1.5 leading-relaxed text-slate-300">
              <b className="text-slate-100">Why it matters: </b>
              {issue.explain.why}
            </p>
            <p className="mt-1.5 leading-relaxed text-slate-300">
              <b className="text-slate-100">In real life: </b>
              {issue.explain.realWorld}
            </p>
            <p className="mt-1.5 leading-relaxed text-sky-200">
              <b>How to spot it: </b>
              {issue.explain.tell}
            </p>

          </article>
        );
      })}

      {result.falsePositives > 0 && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 leading-relaxed text-amber-100">
          You flagged {result.falsePositives} thing{result.falsePositives === 1 ? '' : 's'} that {result.falsePositives === 1 ? 'was' : 'were'} fine. False alarms cost the author time and make your next comment easier to ignore. A question is cheaper than an accusation when you are unsure.
        </p>
      )}
      {result.hintsUsed > 0 && <p className="text-slate-500">Hints used: {result.hintsUsed} of 3.</p>}

      {!session.acknowledged && (
        <Button variant="primary" className="w-full" onClick={onAck}>
          Got it
        </Button>
      )}
    </div>
  );
}
