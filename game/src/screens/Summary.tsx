import { useState } from 'react';
import { allWorkDone, formatClock, hasNextDay } from '../engine/selectors';
import { useStore } from '../store';
import { Avatar, Button } from '../ui';

function trustWord(v: number): string {
  if (v >= 6) return 'likes working with you';
  if (v >= 2) return 'good first impression';
  if (v > -2) return 'no strong opinion yet';
  if (v > -6) return 'a little wary';
  return 'not impressed';
}

export function Summary() {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const abandonGame = useStore((s) => s.abandonGame);
  const replayDay = useStore((s) => s.replayDay);
  const canReplay = useStore((s) => !!s.game && !!s.dayStarts[s.game.day]);
  const [confirmReplay, setConfirmReplay] = useState(false);
  const dispatch = useStore((s) => s.dispatch);
  const openApp = useStore((s) => s.openApp);
  const setChannel = useStore((s) => s.setChannel);
  const setPuzzle = useStore((s) => s.setPuzzle);
  const term = content.pack.terminology.changeRequest;

  const todays = content.puzzles.filter((p) => p.day === game.day);
  const reviewed = todays.filter((p) => game.reviews[p.id]?.firstResult);
  const complete = allWorkDone(game, content);
  const arriveAtOffice = useStore((s) => s.arriveAtOffice);
  const unreviewed = todays.length - reviewed.length;
  const outcomes = reviewed.flatMap((p) => game.reviews[p.id].firstResult!.outcomes);
  const caught = outcomes.filter((o) => o.found).length;
  const falseAlarms = reviewed.reduce((n, p) => n + game.reviews[p.id].firstResult!.falsePositives, 0);
  const hints = reviewed.reduce((n, p) => n + game.reviews[p.id].firstResult!.hintsUsed, 0);
  const average = reviewed.length ? Math.round(reviewed.reduce((n, p) => n + game.reviews[p.id].firstResult!.score, 0) / reviewed.length) : 0;
  const shipped = game.stepsDone.includes('git:live');
  const learned = content.glossary.filter((g) => game.glossary.includes(g.id));
  const slippedToday = game.latentBugs.filter((b) => todays.some((p) => p.id === b.puzzleId));
  const more = hasNextDay(game, content);
  const tomorrow = content.missions.filter((m) => m.day === game.day + 1).sort((a, b) => b.steps.length - a.steps.length)[0];

  // A day worth another try: the change never shipped, reviews were skipped, or real problems got through.
  const roughDay = !complete || (game.day === 1 ? !shipped : slippedToday.length > 0 || (reviewed.length > 0 && average < 60));
  const roughReason = !complete
    ? `You were sent home at ${formatClock(content.pack.sentHomeAt)} with work still open. Day ${game.day + 1} starts once this day is finished.`
    : game.day === 1
      ? 'Your first change did not reach production today.'
      : unreviewed > 0
        ? `${unreviewed} ${term}${unreviewed === 1 ? ' was' : 's were'} left unreviewed.`
        : slippedToday.length > 0
          ? `${slippedToday.length} serious problem${slippedToday.length === 1 ? '' : 's'} got past your first look and had to be sent back.`
          : 'Your reviews scored low today.';

  const stats: { label: string; value: string; note?: string }[] = [];
  if (game.day === 1) {
    stats.push({ label: 'First change', value: shipped ? 'Live in production' : game.git.crOpen ? 'In review' : 'Not shipped', note: `${content.git.ticketKey} · ${game.tickets[content.git.ticketKey]?.status === 'resolved' ? 'ticket resolved' : 'ticket still open'}` });
  }
  if (todays.length > 0) {
    stats.push(
      { label: `${term}s reviewed`, value: `${reviewed.length} of ${todays.length}`, note: `average ${average}/100` },
      { label: 'Problems caught', value: `${caught} of ${outcomes.length}`, note: falseAlarms ? `${falseAlarms} false alarm${falseAlarms === 1 ? '' : 's'}` : 'no false alarms' },
      { label: 'Hints used', value: String(hints) },
    );
  }
  stats.push(
    { label: 'Peak Flow', value: String(Math.round(game.metrics.peakFlow)), note: `${game.metrics.deepWorkMinutes} min of deep work so far` },
    { label: 'Words learned', value: String(learned.length), note: `of ${content.glossary.length}` },
  );

  const headline =
    !complete
      ? `Sent home with work unfinished, ${game.setup.playerName}.`
      : game.day === 1
      ? shipped
        ? `You shipped to production on day one, ${game.setup.playerName}.`
        : `Day one is done, ${game.setup.playerName}.`
      : todays.length > 0 && reviewed.length === todays.length && slippedToday.length === 0
        ? `Nothing got past you today, ${game.setup.playerName}.`
        : `Day ${game.day} is done, ${game.setup.playerName}.`;

  const startNextDay = () => {
    dispatch({ type: 'START_NEXT_DAY' });
    setPuzzle(null);
    setChannel('dm-maya');
    openApp('chat');
    arriveAtOffice();
  };

  return (
    <div className="scroll-thin flex h-full justify-center overflow-y-auto p-6">
      <div className="h-fit w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900/95 p-8 shadow-2xl">
        <div className="text-xs font-semibold uppercase tracking-widest text-emerald-400">End of day {game.day}</div>
        <h1 className="mt-1 text-3xl font-bold text-white">{headline}</h1>
        <p className="mt-1 text-sm text-slate-400">Left the office at {formatClock(game.metrics.clockedOutAt ?? game.minute)}.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <div className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">{s.label}</div>
              <div className="mt-1 text-lg font-semibold text-white">{s.value}</div>
              {s.note && <div className="text-[0.8rem] text-slate-400">{s.note}</div>}
            </div>
          ))}
        </div>

        {game.day === 1 && shipped && (
          <div className="mt-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-50">
            <div className="mb-1 font-semibold text-emerald-300">What you just did</div>
            Ticket → branch → commit → push → {term} → review → pipeline → production. Every change at a company like this takes that same path, whether it is one
            character or ten thousand lines.
          </div>
        )}

        {todays.length > 0 && (
          <>
            <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-slate-400">Your reviews today</h2>
            <div className="mt-2 space-y-2">
              {reviewed.length === 0 && <p className="text-sm text-slate-500">You did not review any {term}s today.</p>}
              {reviewed.map((p) => {
                const result = game.reviews[p.id].firstResult!;
                return (
                  <div key={p.id} className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar npc={content.npcs[p.author]} size={26} />
                        <span className="truncate text-sm font-medium text-white">{p.title}</span>
                      </div>
                      <span className={`shrink-0 text-sm font-bold tabular-nums ${result.score >= 70 ? 'text-emerald-400' : result.score >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {result.score}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm">
                      {p.issues.length === 0 && (
                        <li className="text-slate-400">{result.verdictCorrect ? '✓ Clean, and you approved it.' : '✗ This one was clean. Blocking it cost the author time.'}</li>
                      )}
                      {p.issues.map((issue) => {
                        const o = result.outcomes.find((x) => x.issueId === issue.id)!;
                        return (
                          <li key={issue.id} className={o.found ? 'text-emerald-300' : 'text-rose-300'}>
                            {o.found ? '✓' : '✗'} {issue.explain.what}
                            {!o.found && <span className="mt-0.5 block text-slate-400">How to spot it next time: {issue.explain.tell}</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
              {unreviewed > 0 && (
                <p className="text-sm text-slate-500">
                  {unreviewed} {term}
                  {unreviewed === 1 ? ' was' : 's were'} left unreviewed.
                </p>
              )}
            </div>
          </>
        )}

        {slippedToday.length > 0 && (
          <div className="mt-6 rounded-lg border border-rose-500/50 bg-rose-500/10 p-4">
            <h2 className="text-sm font-semibold text-rose-200">
              {slippedToday.length} problem{slippedToday.length === 1 ? '' : 's'} got past your first look today
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-rose-100/90">
              Nothing shipped: Maya reads every change behind you this week and sent these back for a second look. That safety net is real for new hires, and
              it does not last. Once you review on your own, a missed problem sits quietly in production until the day someone gets paged for it.
            </p>
          </div>
        )}

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-slate-400">What the team thinks</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {Object.entries(game.trust).map(([id, v]) => (
            <div key={id} className="flex items-center gap-2.5 rounded-lg border border-slate-700 bg-slate-800/40 p-2.5">
              <Avatar npc={content.npcs[id]} />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">{content.npcs[id]?.name}</div>
                <div className="text-xs text-slate-400">{trustWord(v)}</div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-slate-400">Words you know now ({learned.length})</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {learned.map((g) => (
            <span key={g.id} title={g.def} className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200">
              {g.term}
            </span>
          ))}
        </div>

        {canReplay && roughDay && (
          <div className="mt-8 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
            <div className="text-sm font-semibold text-amber-200">Want another go at day {game.day}?</div>
            <p className="mt-1 text-sm leading-relaxed text-amber-50/90">
              {roughReason} You can play this day again from 9 AM, now that you know what to look for. Everything from earlier days stays as it is.
            </p>
          </div>
        )}

        <div className="mt-8 border-t border-slate-800 pt-5">
          {!complete ? (
            <p className="text-sm text-slate-300">Your progress is saved. Replay this day to finish it; everything from earlier days stays as it is.</p>
          ) : more ? (
            <>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Good place to stop</div>
              <p className="mt-1 text-sm text-slate-300">
                Your progress is saved. {tomorrow ? `Tomorrow: ${tomorrow.title.toLowerCase()}.` : ''} Come back whenever you like; nothing happens while you are away.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-300">That is the end of this prototype: three days of an intern's first week. Thank you for playing.</p>
          )}

          {confirmReplay ? (
            <div className="mt-4 rounded-lg border border-slate-600 bg-slate-800/60 p-4">
              <p className="text-sm text-slate-200">
                Replay day {game.day}? Today's result is replaced by the new attempt. Days before it are not touched.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button variant="primary" onClick={replayDay}>
                  Yes, replay day {game.day}
                </Button>
                <Button variant="ghost" onClick={() => setConfirmReplay(false)}>
                  Keep today's result
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {more && complete && (
                <Button variant={roughDay && canReplay ? 'default' : 'primary'} className="px-6 py-2" onClick={startNextDay}>
                  Start day {game.day + 1}
                </Button>
              )}
              {canReplay && (
                <Button variant={roughDay ? 'primary' : 'default'} className={roughDay ? 'px-6 py-2' : ''} onClick={() => setConfirmReplay(true)}>
                  Replay day {game.day}
                </Button>
              )}
              <Button variant="ghost" onClick={abandonGame}>
                {more ? 'Start over from day one' : 'Play again from day one'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
