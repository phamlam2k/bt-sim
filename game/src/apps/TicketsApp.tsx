import { useState, type ReactNode } from 'react';
import type { Content, Ticket, TicketStatus } from '../content/schema';
import { formatClock } from '../engine/selectors';
import { canResolve, PLAYER_ID, SYSTEM_ID } from '../engine/tickets';
import type { GameState } from '../engine/types';
import { useStore } from '../store';
import { Avatar, Button, playerAvatar, Why } from '../ui';

type View = 'mine' | 'board' | 'backlog';

const COLUMNS: { status: TicketStatus; title: string; hint: string }[] = [
  { status: 'open', title: 'To do', hint: 'Promised for this sprint, not started.' },
  { status: 'progress', title: 'In progress', hint: 'Someone is working on it now.' },
  { status: 'review', title: 'Review & deploy', hint: 'The code is written. A teammate is reading it, or it is on its way to production.' },
  { status: 'resolved', title: 'Done', hint: 'Live for customers.' },
];

const TYPE_STYLE: Record<Ticket['type'], string> = {
  bug: 'bg-rose-500/20 text-rose-200',
  task: 'bg-slate-600/50 text-slate-200',
  feature: 'bg-sky-500/20 text-sky-200',
  ops: 'bg-amber-500/20 text-amber-200',
};

const PRIORITY: Record<Ticket['priority'], { icon: string; label: string; color: string }> = {
  high: { icon: '▲', label: 'High', color: 'text-rose-400' },
  medium: { icon: '■', label: 'Medium', color: 'text-amber-400' },
  low: { icon: '▼', label: 'Low', color: 'text-slate-400' },
};

const STATUS_STYLE: Record<TicketStatus, string> = {
  open: 'border-slate-500 bg-slate-700/60 text-slate-200',
  progress: 'border-sky-500/60 bg-sky-500/15 text-sky-200',
  review: 'border-amber-500/60 bg-amber-500/15 text-amber-200',
  resolved: 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200',
};

/** The status as a person would say it. The player's own ticket also shows where its change is. */
function statusLabel(game: GameState, content: Content, key: string): string {
  const status = game.tickets[key].status;
  if (status === 'open') return 'To do';
  if (status === 'progress') return 'In progress';
  if (status === 'resolved') return 'Resolved';
  if (key !== content.git.ticketKey || !game.git.merged) return 'In review';
  return game.pipeline.finishedAt !== null ? 'Deployed' : 'Deploying';
}

function usePerson() {
  const npcs = useStore((s) => s.content.npcs);
  const name = useStore((s) => s.game!.setup.playerName);
  return (id: string | null) => {
    if (id === null) return { name: 'Unassigned', avatar: undefined, known: false };
    if (id === PLAYER_ID) return { name: `${name} (you)`, avatar: playerAvatar(name), known: true };
    if (id === SYSTEM_ID) return { name: 'Automatic update', avatar: { initials: '⚙', color: '#475569' }, known: true };
    return { name: npcs[id]?.name ?? id, avatar: npcs[id], known: true };
  };
}

export function TicketsApp() {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const activeTicket = useStore((s) => s.activeTicket);
  const setTicket = useStore((s) => s.setTicket);
  const [view, setView] = useState<View>('mine');

  const mine = content.tickets.filter((t) => game.tickets[t.key].assignee === PLAYER_ID);
  const sprint = content.tickets.filter((t) => t.sprint);
  const backlog = content.tickets.filter((t) => !t.sprint);
  const selectedMine = mine.find((t) => t.key === activeTicket) ?? mine[0];
  const drawer = view !== 'mine' ? content.tickets.find((t) => t.key === activeTicket) : undefined;

  const tabs: { id: View; label: string; count: number }[] = [
    { id: 'mine', label: 'Assigned to me', count: mine.length },
    { id: 'board', label: `${content.sprint.name} board`, count: sprint.length },
    { id: 'backlog', label: 'Backlog', count: backlog.length },
  ];

  const switchView = (next: View) => {
    setView(next);
    setTicket(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-700 bg-slate-900/70 px-3 py-2">
        <div data-tour="tickets-tabs" className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchView(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === t.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              {t.label} <span className="ml-1 tabular-nums text-slate-400">{t.count}</span>
            </button>
          ))}
        </div>
        <div data-tour="tickets-why" className="flex flex-wrap gap-1.5">
          <Why id="who-assigns" label="Who gives me work?" />
          <Why id="ticket" label="Why tickets?" />
          <Why id="sprint" label="What is a sprint?" />
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {view === 'mine' &&
          (selectedMine ? (
            <div className="grid h-full min-h-0 grid-cols-[17rem_1fr]">
              <ul data-tour="tickets-list" className="scroll-thin min-h-0 space-y-2 overflow-y-auto border-r border-slate-700 bg-slate-900/40 p-3">
                {mine.map((t) => (
                  <li key={t.key}>
                    <TicketCard ticket={t} selected={t.key === selectedMine.key} onClick={() => setTicket(t.key)} />
                  </li>
                ))}
              </ul>
              <TicketDetail ticket={selectedMine} />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="text-4xl" aria-hidden>
                🎫
              </div>
              <p className="max-w-md text-sm leading-relaxed text-slate-300">
                Nothing is assigned to you yet. In your first week, work reaches you through your mentor. Have a look at the sprint board to see what the rest of the
                team is doing.
              </p>
              <Button onClick={() => switchView('board')}>Open the {content.sprint.name} board</Button>
            </div>
          ))}

        {view === 'board' && (
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-slate-800 px-4 py-2 text-sm text-slate-300">
              <span className="font-semibold text-white">{content.sprint.name}</span> · ends {content.sprint.ends} ·{' '}
              <span className="text-slate-400">Goal: {content.sprint.goal}</span>
            </div>
            <div data-tour="tickets-board" className="scroll-thin grid min-h-0 flex-1 grid-cols-4 gap-3 overflow-auto p-3">
              {COLUMNS.map((col) => {
                const cards = sprint.filter((t) => game.tickets[t.key].status === col.status);
                return (
                  <section key={col.status} className="flex min-w-[11rem] flex-col rounded-lg bg-slate-950/50 p-2" title={col.hint}>
                    <h3 className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {col.title}
                      <span className="tabular-nums text-slate-500">{cards.length}</span>
                    </h3>
                    <ul className="space-y-2">
                      {cards.map((t) => (
                        <li key={t.key}>
                          <TicketCard ticket={t} selected={t.key === activeTicket} onClick={() => setTicket(t.key)} />
                        </li>
                      ))}
                      {cards.length === 0 && <li className="px-1 py-3 text-xs text-slate-600">Nothing here.</li>}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {view === 'backlog' && (
          <div className="scroll-thin h-full overflow-y-auto p-4">
            <p className="mb-3 max-w-3xl text-sm leading-relaxed text-slate-300">
              Work the team has not promised yet. At the next sprint planning the team looks at this list with the manager and the product manager, and pulls the most
              important items into the sprint. Most of it waits: there is always more to do than a team can finish.
            </p>
            <ul className="grid gap-2 lg:grid-cols-2">
              {backlog.map((t) => (
                <li key={t.key}>
                  <TicketCard ticket={t} selected={t.key === activeTicket} onClick={() => setTicket(t.key)} showSource />
                </li>
              ))}
            </ul>
          </div>
        )}

        {drawer && (
          <div className="absolute inset-y-0 right-0 flex w-[min(34rem,100%)] flex-col border-l border-slate-600 bg-slate-900 shadow-2xl">
            <TicketDetail ticket={drawer} onClose={() => setTicket(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

function TicketCard({ ticket, selected, onClick, showSource }: { ticket: Ticket; selected: boolean; onClick: () => void; showSource?: boolean }) {
  const game = useStore((s) => s.game)!;
  const person = usePerson();
  const state = game.tickets[ticket.key];
  const owner = person(state.assignee);
  const isMine = state.assignee === PLAYER_ID;
  const priority = PRIORITY[ticket.priority];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-md border p-2.5 text-left transition-colors ${
        selected ? 'border-emerald-400 bg-slate-700' : isMine ? 'border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/15' : 'border-slate-700 bg-slate-800/70 hover:bg-slate-700/70'
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-mono font-semibold text-sky-300">{ticket.key}</span>
        <span className={`rounded px-1.5 py-0.5 font-medium ${TYPE_STYLE[ticket.type]}`}>{ticket.type}</span>
      </div>
      <div className="mt-1 text-sm leading-snug text-white">{ticket.title}</div>
      {showSource && <div className="mt-1 text-xs text-slate-400">From: {ticket.source}</div>}
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="flex min-w-0 items-center gap-1.5">
          {owner.avatar ? <Avatar npc={owner.avatar} size={20} /> : <i className="h-5 w-5 shrink-0 rounded-md border border-dashed border-slate-500" />}
          <span className="truncate">{owner.name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className={priority.color} title={`${priority.label} priority`}>
            {priority.icon}
          </span>
          <span className="rounded-full bg-slate-700 px-1.5 tabular-nums text-slate-300" title="Size in points: a rough guess at the effort">
            {ticket.points}
          </span>
        </span>
      </div>
    </button>
  );
}

function TicketDetail({ ticket, onClose }: { ticket: Ticket; onClose?: () => void }) {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const dispatch = useStore((s) => s.dispatch);
  const person = usePerson();

  const state = game.tickets[ticket.key];
  const owner = person(state.assignee);
  const reporter = person(ticket.reporter);
  const priority = PRIORITY[ticket.priority];
  const isMine = state.assignee === PLAYER_ID;
  const resolvable = canResolve(game, content, ticket.key);
  const stageIndex = COLUMNS.findIndex((col) => col.status === state.status);

  const activity = [
    ...ticket.history.map((h) => ({ who: h.who, text: h.text, when: h.when })),
    ...state.activity.map((a) => ({ who: a.who, text: a.text, when: `${a.day === game.day ? 'Today' : `Day ${a.day}`}, ${formatClock(a.minute)}` })),
  ];

  return (
    <article className="scroll-thin flex h-full min-h-0 flex-col overflow-y-auto">
      <header data-tour="tickets-detail" className="border-b border-slate-700 bg-slate-900/70 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-sky-500/20 px-1.5 py-0.5 font-mono font-semibold text-sky-300">{ticket.key}</span>
            <span className={`rounded px-1.5 py-0.5 font-medium ${TYPE_STYLE[ticket.type]}`}>{ticket.type}</span>
            <span className={`rounded-full border px-2 py-0.5 font-medium ${STATUS_STYLE[state.status]}`}>{statusLabel(game, content, ticket.key)}</span>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close ticket" className="rounded px-2 text-xl leading-none text-slate-400 hover:bg-slate-700 hover:text-white">
              ×
            </button>
          )}
        </div>
        <h2 className="mt-2 text-xl font-semibold leading-snug text-white">{ticket.title}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <Field label="Assignee">
            {owner.avatar && <Avatar npc={owner.avatar} size={20} />}
            <span className={owner.known ? 'text-white' : 'text-slate-400'}>{owner.name}</span>
          </Field>
          <Field label="Reporter">
            {reporter.avatar && <Avatar npc={reporter.avatar} size={20} />}
            <span className="text-white">{reporter.name}</span>
          </Field>
          <Field label="Priority">
            <span className={priority.color}>{priority.icon}</span>
            <span className="text-white">{priority.label}</span>
          </Field>
          <Field label="Size">
            <span className="text-white">
              {ticket.points} point{ticket.points === 1 ? '' : 's'}
            </span>
          </Field>
          <Field label="Opened">
            <span className="text-white">{ticket.opened}</span>
          </Field>
          <Field label="Sprint">
            <span className="text-white">{ticket.sprint ? content.sprint.name : 'Backlog'}</span>
          </Field>
        </dl>
        <p className="mt-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Where it came from:</span> {ticket.source}
        </p>
      </header>

      <div className="space-y-5 px-5 py-4">
        <section data-tour="tickets-lifecycle">
          <ol className="flex items-center">
            {COLUMNS.map((col, i) => (
              <li key={col.status} className="flex flex-1 items-center last:flex-none" title={col.hint}>
                <span className="flex items-center gap-1.5">
                  <i
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold not-italic ${
                      i < stageIndex ? 'bg-emerald-600 text-white' : i === stageIndex ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {i < stageIndex ? '✓' : i + 1}
                  </i>
                  <span className={`text-xs ${i === stageIndex ? 'font-semibold text-white' : 'text-slate-400'}`}>{col.title}</span>
                </span>
                {i < COLUMNS.length - 1 && <i className={`mx-2 h-0.5 flex-1 ${i < stageIndex ? 'bg-emerald-600' : 'bg-slate-700'}`} />}
              </li>
            ))}
          </ol>
        </section>

        <section data-tour="tickets-actions" className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          {isMine ? (
            <div className="flex flex-wrap items-center gap-3">
              {state.status === 'open' && (
                <Button variant="primary" onClick={() => dispatch({ type: 'TICKET_START', key: ticket.key })}>
                  Start work
                </Button>
              )}
              {state.status !== 'open' && state.status !== 'resolved' && (
                <Button variant={resolvable ? 'primary' : 'default'} disabled={!resolvable} onClick={() => dispatch({ type: 'TICKET_RESOLVE', key: ticket.key })}>
                  Resolve ticket
                </Button>
              )}
              <p className="min-w-0 flex-1 text-sm leading-snug text-slate-300">
                {state.status === 'open' && 'This one is yours. Starting it tells the team you have begun, so nobody else picks it up.'}
                {state.status !== 'open' && state.status !== 'resolved' && !resolvable && 'You can resolve this once the fix is live in production. The status moves by itself until then.'}
                {resolvable && 'The work is live. Resolve the ticket so the board shows the truth.'}
                {state.status === 'resolved' && '✓ Resolved. Anyone can follow this ticket back to the exact change that fixed it.'}
              </p>
              <Why id="ticket-status" label="Why update it?" />
            </div>
          ) : (
            <p className="text-sm leading-snug text-slate-300">
              {state.assignee
                ? `${owner.name} owns this ticket. You can read it, but it is theirs to move.`
                : 'Nobody owns this yet. The team decides who takes it at sprint planning; you do not grab it on your own in week one.'}
            </p>
          )}
        </section>

        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Description</h3>
          <p className="text-sm leading-relaxed text-slate-200">{ticket.description}</p>
        </section>

        <section>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Done when</h3>
          <ul className="space-y-1 text-sm text-slate-200">
            {ticket.acceptance.map((a) => (
              <li key={a} className="flex gap-2">
                <span className={state.status === 'resolved' ? 'text-emerald-400' : 'text-slate-500'}>{state.status === 'resolved' ? '☑' : '☐'}</span>
                {a}
              </li>
            ))}
          </ul>
        </section>

        <LinkedWork ticket={ticket} />

        <section data-tour="tickets-activity">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Activity</h3>
          {activity.length === 0 && <p className="text-sm text-slate-500">Nothing has happened on this ticket yet.</p>}
          <ol className="space-y-2.5">
            {activity.map((a, i) => {
              const who = person(a.who);
              return (
                <li key={i} className="flex gap-2.5 text-sm">
                  {who.avatar && <Avatar npc={who.avatar} size={24} />}
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400">
                      <span className="font-medium text-slate-200">{who.name}</span> · {a.when}
                    </div>
                    <div className="leading-snug text-slate-200">{a.text}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </article>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5">{children}</dd>
    </div>
  );
}

/** Where the code for this ticket is: its branch, its change request, and how far it has travelled. */
function LinkedWork({ ticket }: { ticket: Ticket }) {
  const game = useStore((s) => s.game)!;
  const content = useStore((s) => s.content);
  const openApp = useStore((s) => s.openApp);
  const setPuzzle = useStore((s) => s.setPuzzle);
  const term = content.pack.terminology.changeRequest;
  const rows: { label: string; value: string; done: boolean }[] = [];
  let action: { label: string; run: () => void } | null = null;

  if (ticket.key === content.git.ticketKey) {
    const g = game.git;
    const branch = Object.keys(g.branches).find((b) => b !== content.pack.terminology.mainBranch);
    const stage = content.pipeline.stages[game.pipeline.stage];
    rows.push(
      { label: 'Branch', value: branch ?? 'not created yet', done: !!branch },
      { label: term, value: g.merged ? 'approved and merged' : g.crOpen ? 'waiting for a reviewer' : 'not opened yet', done: g.merged },
      {
        label: 'Pipeline',
        value: game.pipeline.finishedAt !== null ? 'live in production' : game.pipeline.startedAt !== null ? `at ${stage?.name ?? 'the last stage'}` : 'not started',
        done: game.pipeline.finishedAt !== null,
      },
    );
    action = g.merged
      ? { label: `Open ${content.pack.apps.pipeline?.displayName ?? 'Pipeline'}`, run: () => openApp('pipeline') }
      : { label: `Open ${content.pack.apps.git?.displayName ?? 'Workspace'}`, run: () => openApp('git') };
  } else if (ticket.puzzle) {
    const puzzleId = ticket.puzzle;
    const session = game.reviews[puzzleId];
    const puzzle = content.puzzles.find((p) => p.id === puzzleId);
    rows.push({
      label: term,
      value: !session ? 'not opened yet' : session.verdict === 'approve' ? 'you approved it' : session.verdict === 'changes' ? 'you requested changes' : `"${puzzle?.title}" is waiting for your review`,
      done: session?.verdict === 'approve',
    });
    if (session) {
      action = {
        label: `Open in ${content.pack.apps.review?.displayName ?? 'Code Review'}`,
        run: () => {
          setPuzzle(puzzleId);
          openApp('review');
        },
      };
    }
  }

  if (rows.length === 0) return null;

  return (
    <section>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Linked work</h3>
      <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
        <ul className="space-y-1 text-sm">
          {rows.map((r) => (
            <li key={r.label} className="flex gap-2">
              <span className={r.done ? 'text-emerald-400' : 'text-slate-500'}>{r.done ? '✓' : '○'}</span>
              <span className="w-20 shrink-0 text-slate-400">{r.label}</span>
              <span className="min-w-0 break-words text-slate-100">{r.value}</span>
            </li>
          ))}
        </ul>
        {action && (
          <Button className="mt-3" onClick={action.run}>
            {action.label}
          </Button>
        )}
      </div>
    </section>
  );
}
