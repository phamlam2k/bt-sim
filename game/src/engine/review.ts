import type { Content, Lang, Puzzle, PuzzleVariant } from '../content/schema';
import { postMessage } from './chat';
import { evalCondition } from './conditions';
import { addStat, completeStep } from './effects';
import { ticketReviewRequested, ticketReviewed } from './tickets';
import type { GameState, IssueOutcome, ReviewComment, ReviewResult, ReviewSession } from './types';

/** Falls back to Python until the other language variants are written. */
export function variantFor(p: Puzzle, lang: Lang): PuzzleVariant {
  return p.variants[lang] ?? p.variants.python;
}

export function deliverPuzzles(s: GameState, c: Content): void {
  for (const p of c.puzzles) {
    if (s.reviews[p.id] || p.day !== s.day || !evalCondition(s, p.deliverWhen)) continue;
    s.reviews[p.id] = {
      deliveredAt: s.minute,
      comments: [],
      hintTier: 0,
      verdict: null,
      result: null,
      acknowledged: false,
      attempts: 0,
      firstResult: null,
      needsRework: false,
    };
    ticketReviewRequested(s, c, p.id);
    const author = c.npcs[p.author]?.name ?? p.author;
    postMessage(s, c.pack.crBot.channel, c.pack.crBot.npc, `New ${c.pack.terminology.changeRequest} from ${author} needs your review: "${p.title}"`);
  }
}

export function addComment(s: GameState, puzzleId: string, comment: ReviewComment): void {
  const session = s.reviews[puzzleId];
  if (!session || session.verdict) return;
  // One comment per line, and one per CR-level category: a new one replaces the old.
  session.comments = session.comments.filter((x) =>
    comment.line === null ? !(x.line === null && x.category === comment.category) : x.line !== comment.line,
  );
  session.comments.push(comment);
}

export function removeComment(s: GameState, puzzleId: string, index: number): void {
  const session = s.reviews[puzzleId];
  if (!session || session.verdict) return;
  session.comments.splice(index, 1);
}

export function requestHint(s: GameState, c: Content, puzzleId: string): void {
  const session = s.reviews[puzzleId];
  if (!session || session.verdict || session.hintTier >= 3) return;
  if (s.setup.difficulty === 'realistic') return;
  session.hintTier = (session.hintTier + 1) as ReviewSession['hintTier'];
  // Outside Guided mode, asking costs a little of the mentor's patience.
  if (s.setup.difficulty === 'standard') addStat(s, `trust.${c.pack.mentor}`, -2);
}

export function scoreReview(p: Puzzle, lang: Lang, session: ReviewSession, verdict: 'approve' | 'changes'): ReviewResult {
  const v = variantFor(p, lang);
  const bugComments = session.comments.filter((x) => x.kind === 'bug' && x.line !== null);
  const crComments = session.comments.filter((x) => x.kind === 'cr');

  const outcomes: IssueOutcome[] = p.issues.map((issue) => {
    if (issue.scope === 'cr') {
      const hit = crComments.some((x) => x.category === issue.category);
      return { issueId: issue.id, found: hit, categoryRight: hit };
    }
    const lines = v.issueLines[issue.id] ?? [];
    const hits = bugComments.filter((x) => lines.includes(x.line as number));
    return {
      issueId: issue.id,
      found: hits.length > 0,
      categoryRight: hits.some((x) => x.category === issue.category),
    };
  });

  const issueLines = new Set(p.issues.filter((i) => i.scope === 'line').flatMap((i) => v.issueLines[i.id] ?? []));
  const crCategories = new Set(p.issues.filter((i) => i.scope === 'cr').map((i) => i.category));
  const falsePositives =
    bugComments.filter((x) => !issueLines.has(x.line as number)).length +
    crComments.filter((x) => !crCategories.has(x.category ?? '')).length;

  const shouldBlock = p.issues.some((i) => i.severity >= 2);
  const verdictCorrect = (verdict === 'changes') === shouldBlock;

  let score: number;
  if (p.issues.length === 0) {
    score = 100;
  } else {
    const earned = outcomes.reduce((sum, o) => sum + (o.found ? (o.categoryRight ? 1 : 0.6) : 0), 0);
    score = (100 * earned) / p.issues.length;
  }
  score -= 15 * falsePositives;
  if (!verdictCorrect) score -= 25;

  return {
    outcomes,
    falsePositives,
    nits: session.comments.filter((x) => x.kind === 'nit').length,
    shouldBlock,
    verdictCorrect,
    hintsUsed: session.hintTier,
    score: Math.round(Math.min(100, Math.max(0, score))),
  };
}

export function submitVerdict(s: GameState, c: Content, puzzleId: string, verdict: 'approve' | 'changes'): void {
  const session = s.reviews[puzzleId];
  const p = c.puzzles.find((x) => x.id === puzzleId);
  if (!session || !p || session.verdict) return;

  const result = scoreReview(p, s.setup.lang, session, verdict);
  session.verdict = verdict;
  session.result = result;

  const missedSerious = result.outcomes.filter((o) => !o.found && (p.issues.find((i) => i.id === o.issueId)?.severity ?? 0) >= 2);

  // Only the first attempt counts for the player's record. Later ones repair what the mentor sent back.
  if (session.attempts === 0) {
    session.firstResult = result;
    const found = result.outcomes.filter((o) => o.found).length;
    addStat(s, 'hidden.reviewQuality', (result.score - 50) / 10);
    addStat(s, 'hidden.value', found * 2);
    addStat(s, `trust.${p.author}`, found > 0 ? 2 : 0);
    addStat(s, `trust.${p.author}`, -3 * result.falsePositives - (result.nits > 3 ? 2 : 0));
    if (result.falsePositives > 0) addStat(s, 'stats.stress', 2 * result.falsePositives);
    for (const o of missedSerious) s.latentBugs.push({ puzzleId, issueId: o.issueId });
    if (missedSerious.length > 0) addStat(s, 'stats.stress', 3);
  }
  session.attempts += 1;

  // The mentor reads every change request behind an intern. Nothing serious ships; it comes back instead.
  session.needsRework = missedSerious.length > 0 || !result.verdictCorrect;
  if (session.needsRework) return;

  for (const id of p.teaches ?? []) if (!s.glossary.includes(id)) s.glossary.push(id);
  completeStep(s, `review:${puzzleId}`);
  ticketReviewed(s, c, puzzleId, verdict);
}

export function acknowledgeReview(s: GameState, puzzleId: string): void {
  const session = s.reviews[puzzleId];
  if (!session?.result) return;
  if (!session.needsRework) {
    session.acknowledged = true;
    return;
  }
  // Back to the diff, comments kept, with a stronger hint each time so nobody is stuck for long.
  session.verdict = null;
  session.result = null;
  session.needsRework = false;
  session.hintTier = Math.max(session.hintTier, Math.min(3, session.attempts)) as ReviewSession['hintTier'];
}
