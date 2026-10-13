import { stageProgress } from '../engine/pipeline';
import { findTicket } from '../engine/tickets';
import { useStore } from '../store';
import { Avatar, Button, playerAvatar, Why } from '../ui';

type StageState = 'passed' | 'running' | 'waiting';

export function PipelineApp() {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const openApp = useStore((s) => s.openApp);
  const setTicket = useStore((s) => s.setTicket);

  const { pipeline } = content;
  const p = game.pipeline;
  const g = game.git;
  const term = content.pack.terminology.changeRequest;
  const main = content.pack.terminology.mainBranch;
  const ticket = findTicket(content, content.git.ticketKey);
  const started = p.startedAt !== null;
  const finished = p.finishedAt !== null;
  const progress = stageProgress(game, content);
  const running = started && !finished ? pipeline.stages[p.stage] : undefined;
  const commit = g.commits.find((x) => x.id === g.remote[main]);

  const stateOf = (i: number): StageState => (!started ? 'waiting' : finished || i < p.stage ? 'passed' : i === p.stage ? 'running' : 'waiting');

  const headline = finished
    ? `${content.git.ticketKey} is live for every customer.`
    : running
      ? `${content.git.ticketKey} is at ${running.name}.`
      : g.crOpen
        ? `${content.git.ticketKey} is waiting for a reviewer. The pipeline will not take a change nobody approved.`
        : 'Nothing is on its way right now.';
  const detail = finished
    ? 'Nobody pressed a deploy button. Each stage checked the change and passed it on.'
    : running
      ? running.plain
      : g.crOpen
        ? `The moment your ${term} is approved it merges into ${main}, and the pipeline picks it up by itself.`
        : `A change enters the pipeline when its ${term} is approved and merged into ${main}. Until then this page stays quiet.`;

  return (
    <div className="scroll-thin flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-700 bg-slate-900/70 px-4 py-2.5">
        <div className="text-sm">
          <span className="font-mono font-semibold text-white">{pipeline.name}</span>
          <span className="text-slate-400">
            {' '}
            · {main} → production
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Why id="pipeline" label="Why stages?" />
          <Why id="review" label="Why approval first?" />
        </div>
      </div>

      <section data-tour="pipeline-now" className="border-b border-slate-800 px-4 py-4">
        <div className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">Your change</div>
        <div className={`mt-1 text-lg font-semibold ${finished ? 'text-emerald-300' : 'text-white'}`}>{headline}</div>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-300">{detail}</p>
        {started && commit && ticket && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <Avatar npc={playerAvatar(game.setup.playerName)} size={20} />
            <code className="text-slate-300">{commit.id}</code>
            <span className="text-slate-200">{commit.message}</span>
            <button
              type="button"
              className="rounded bg-sky-500/20 px-1.5 py-0.5 font-mono font-semibold text-sky-300 hover:bg-sky-500/30"
              onClick={() => {
                setTicket(ticket.key);
                openApp('tickets');
              }}
            >
              {ticket.key}
            </button>
          </div>
        )}
      </section>

      <section data-tour="pipeline-stages" className="px-4 py-4">
        <ol className="flex items-stretch gap-1">
          <StageCard name="Source" plain={`An approved ${term} merges into ${main}.`} state={started ? 'passed' : 'waiting'} progress={0} />
          {pipeline.stages.map((st, i) => (
            <StageCard key={st.id} name={st.name} plain={st.plain} state={stateOf(i)} progress={progress} arrow />
          ))}
        </ol>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          Left to right, each stage exposes the change to more risk and more customers. If a stage fails or an alarm fires, the pipeline stops and puts the previous
          version back.
        </p>
      </section>

      <section data-tour="pipeline-history" className="border-t border-slate-800 px-4 py-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Recent deployments</h3>
        <ul className="space-y-2">
          {finished && ticket && (
            <HistoryRow ticketKey={ticket.key} title={ticket.title} who={`${game.setup.playerName} (you)`} avatar={playerAvatar(game.setup.playerName)} when="today" />
          )}
          {pipeline.history.map((h) => {
            const stage = pipeline.stages.find((st) => st.id === h.rolledBackAt);
            return (
              <HistoryRow
                key={h.ticket}
                ticketKey={h.ticket}
                title={h.title}
                who={content.npcs[h.author]?.name ?? h.author}
                avatar={content.npcs[h.author]}
                when={h.when}
                rolledBackAt={stage?.name}
                note={h.note}
              />
            );
          })}
        </ul>
        {!started && !g.crOpen && (
          <Button className="mt-4" onClick={() => openApp('git')}>
            Open {content.pack.apps.git?.displayName ?? 'Workspace'}
          </Button>
        )}
      </section>
    </div>
  );
}

function StageCard({ name, plain, state, progress, arrow }: { name: string; plain: string; state: StageState; progress: number; arrow?: boolean }) {
  const tone =
    state === 'passed' ? 'border-emerald-500/60 bg-emerald-500/10' : state === 'running' ? 'border-amber-400 bg-amber-500/10' : 'border-slate-700 bg-slate-800/40';
  return (
    <li className="flex min-w-0 flex-1 items-stretch gap-1">
      {arrow && (
        <span className={`flex shrink-0 items-center text-lg ${state === 'waiting' ? 'text-slate-600' : 'text-emerald-500'}`} aria-hidden>
          →
        </span>
      )}
      <div className={`flex min-w-0 flex-1 flex-col rounded-lg border p-2.5 ${tone}`} data-state={state}>
        <div className="flex items-center justify-between gap-1">
          <span className={`truncate text-sm font-semibold ${state === 'waiting' ? 'text-slate-400' : 'text-white'}`}>{name}</span>
          <span className={`shrink-0 text-xs font-medium ${state === 'passed' ? 'text-emerald-300' : state === 'running' ? 'text-amber-300' : 'text-slate-500'}`}>
            {state === 'passed' ? '✓ passed' : state === 'running' ? 'running' : 'waiting'}
          </span>
        </div>
        <p className="mt-1 flex-1 text-xs leading-snug text-slate-400">{plain}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700/70">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${state === 'running' ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${state === 'passed' ? 100 : state === 'running' ? Math.round(progress * 100) : 0}%` }}
          />
        </div>
      </div>
    </li>
  );
}

function HistoryRow({
  ticketKey,
  title,
  who,
  avatar,
  when,
  rolledBackAt,
  note,
}: {
  ticketKey: string;
  title: string;
  who: string;
  avatar: { initials: string; color: string } | undefined;
  when: string;
  rolledBackAt?: string;
  note?: string;
}) {
  return (
    <li className={`rounded-lg border p-2.5 ${rolledBackAt ? 'border-rose-500/40 bg-rose-500/5' : 'border-slate-700 bg-slate-800/40'}`}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Avatar npc={avatar} size={22} />
        <span className="font-mono text-xs font-semibold text-sky-300">{ticketKey}</span>
        <span className="min-w-0 flex-1 truncate text-white">{title}</span>
        <span className="text-xs text-slate-400">
          {who} · {when}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rolledBackAt ? 'bg-rose-500/20 text-rose-200' : 'bg-emerald-500/15 text-emerald-200'}`}>
          {rolledBackAt ? `↩ rolled back at ${rolledBackAt}` : '✓ in production'}
        </span>
      </div>
      {note && <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{note}</p>}
    </li>
  );
}
