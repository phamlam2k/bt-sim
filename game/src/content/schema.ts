import { z } from 'zod';

/** "09:30" -> minutes since midnight. Content files use clock strings so they stay readable. */
const ClockTime = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .transform((s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  });

export const LangSchema = z.enum(['python', 'java', 'javascript']);
export type Lang = z.infer<typeof LangSchema>;

export const DifficultySchema = z.enum(['guided', 'standard', 'realistic']);
export type Difficulty = z.infer<typeof DifficultySchema>;

export type Condition =
  | { type: 'time'; atLeast: number }
  | { type: 'flag'; id: string; is: boolean }
  | { type: 'stat'; path: string; op: '<' | '>' | '<=' | '>='; value: number }
  | { type: 'stepDone'; step: string }
  | { type: 'reviewed'; puzzle: string }
  | { type: 'manual' }
  | { type: 'all'; of: Condition[] }
  | { type: 'any'; of: Condition[] };

export const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('time'), atLeast: ClockTime }),
    z.object({ type: z.literal('flag'), id: z.string(), is: z.boolean() }),
    z.object({
      type: z.literal('stat'),
      path: z.string(),
      op: z.enum(['<', '>', '<=', '>=']),
      value: z.number(),
    }),
    z.object({ type: z.literal('stepDone'), step: z.string() }),
    z.object({ type: z.literal('reviewed'), puzzle: z.string() }),
    z.object({ type: z.literal('manual') }),
    z.object({ type: z.literal('all'), of: z.array(ConditionSchema) }),
    z.object({ type: z.literal('any'), of: z.array(ConditionSchema) }),
  ]),
);

export const EffectSchema = z.discriminatedUnion('type', [
  /** path is "stats.stress", "hidden.credit" or "trust.<npcId>" */
  z.object({ type: z.literal('stat'), path: z.string(), delta: z.number() }),
  z.object({ type: z.literal('flag'), id: z.string(), value: z.boolean() }),
  z.object({ type: z.literal('step'), step: z.string() }),
  z.object({ type: z.literal('glossary'), id: z.string() }),
  /** Fire a chat event after a delay, regardless of its own `when`. */
  z.object({ type: z.literal('event'), id: z.string(), afterMinutes: z.number().min(0) }),
  z.object({ type: z.literal('card'), id: z.string() }),
  z.object({ type: z.literal('git'), op: z.literal('merge') }),
  /** Skip the clock forward (lunch, a meeting). */
  z.object({ type: z.literal('time'), minutes: z.number().min(0) }),
  /** Hand a ticket to someone. `to` and `by` are NPC ids, or "player". */
  z.object({ type: z.literal('assign'), ticket: z.string(), to: z.string(), by: z.string() }),
]);
export type Effect = z.infer<typeof EffectSchema>;

export const NpcSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  initials: z.string().max(2),
  color: z.string(),
  bot: z.boolean().optional(),
});
export type Npc = z.infer<typeof NpcSchema>;

export const ChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['channel', 'dm']),
  topic: z.string().optional(),
});
export type Channel = z.infer<typeof ChannelSchema>;

export const CategorySchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Plain-English description shown in the picker, written for non-coders. */
  plain: z.string(),
});
export type Category = z.infer<typeof CategorySchema>;

export const PackSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  team: z.string(),
  service: z.string(),
  realMsPerGameMinute: z.number().positive(),
  dayStart: ClockTime,
  dayEnd: ClockTime,
  /** If work is still open this late, the player is sent home and the day counts as unfinished. */
  sentHomeAt: ClockTime,
  /** Company vocabulary. Engine and UI never hard-code these words. */
  terminology: z.object({
    changeRequest: z.string(),
    changeRequestLong: z.string(),
    mainBranch: z.string(),
  }),
  apps: z.record(z.string(), z.object({ displayName: z.string() })),
  /** NPC who answers hints and help requests. */
  mentor: z.string(),
  /** Where the mentor writes to the player directly. */
  mentorChannel: z.string(),
  /** Bot and channel that announce new change requests. */
  crBot: z.object({ npc: z.string(), channel: z.string() }),
  lineCategories: z.array(CategorySchema),
  crCategories: z.array(CategorySchema),
  reviewChecklist: z.array(z.object({ title: z.string(), detail: z.string() })),
  whys: z.record(z.string(), z.object({ title: z.string(), body: z.string() })),
});
export type Pack = z.infer<typeof PackSchema>;

export const MissionSchema = z.object({
  id: z.string(),
  /** Which in-game day this belongs to. */
  day: z.number().int().positive().default(1),
  title: z.string(),
  /** When this is expected to be finished. Missing it has a cost, but never ends the game. */
  due: ClockTime.optional(),
  steps: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      app: z.string().optional(),
    }),
  ),
});
export type Mission = z.infer<typeof MissionSchema>;

export const ChatEventSchema = z.object({
  id: z.string(),
  /** Which in-game day this belongs to. */
  day: z.number().int().positive().default(1),
  when: ConditionSchema,
  channel: z.string(),
  from: z.string(),
  messages: z.array(z.object({ text: z.string(), afterMinutes: z.number().min(0) })).min(1),
  replies: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        effects: z.array(EffectSchema),
        followUp: z.string().optional(),
      }),
    )
    .optional(),
  expiresAfterMinutes: z.number().positive().optional(),
  onIgnored: z.array(EffectSchema).optional(),
  onDelivered: z.array(EffectSchema).optional(),
});
export type ChatEvent = z.infer<typeof ChatEventSchema>;

const VariantSchema = z.object({
  path: z.string(),
  /** Each line starts with "+", "-" or " " like a unified diff. Line numbers are 1-based indexes. */
  diff: z.array(z.string()).min(1),
  /** Plain-English reading of a line, keyed by its 1-based line number. */
  plain: z.record(z.string(), z.string()),
  /** issue id -> the lines that count as "found it". */
  issueLines: z.record(z.string(), z.array(z.number().int().positive())),
  hintRegion: z.tuple([z.number().int().positive(), z.number().int().positive()]).optional(),
  /** Lines that look suspicious but are fine. */
  decoys: z.array(z.number().int().positive()).optional(),
});
export type PuzzleVariant = z.infer<typeof VariantSchema>;

export const IssueSchema = z.object({
  id: z.string(),
  scope: z.enum(['line', 'cr']),
  category: z.string(),
  /** 1 = nit-level, 2 = must fix before merge, 3 = would cause an incident. */
  severity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  explain: z.object({
    what: z.string(),
    why: z.string(),
    realWorld: z.string(),
    tell: z.string(),
  }),
});
export type Issue = z.infer<typeof IssueSchema>;

export const PuzzleSchema = z.object({
  id: z.string(),
  /** Which in-game day this belongs to. */
  day: z.number().int().positive().default(1),
  author: z.string(),
  title: z.string(),
  description: z.string(),
  deliverWhen: ConditionSchema,
  issues: z.array(IssueSchema),
  hints: z.object({ look: z.string(), region: z.string(), reveal: z.string() }),
  /** Shown after review when the CR had no issues. */
  cleanNote: z.string().optional(),
  /** Glossary entries unlocked once this review is submitted. */
  teaches: z.array(z.string()).optional(),
  variants: z.object({
    python: VariantSchema,
    java: VariantSchema.optional(),
    javascript: VariantSchema.optional(),
  }),
});
export type Puzzle = z.infer<typeof PuzzleSchema>;

export const TicketStatusSchema = z.enum(['open', 'progress', 'review', 'resolved']);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const TicketSchema = z.object({
  key: z.string(),
  title: z.string(),
  type: z.enum(['bug', 'task', 'feature', 'ops']),
  priority: z.enum(['low', 'medium', 'high']),
  /** Rough size. 1 is an hour or two, 5 is most of a sprint. */
  points: z.number().int().positive(),
  /** NPC id of whoever filed it. */
  reporter: z.string(),
  /** How this work reached the team: roadmap, a customer, another team, an alarm. */
  source: z.string(),
  /** NPC id, "player", or null while nobody owns it. */
  assignee: z.string().nullable(),
  status: TicketStatusSchema,
  /** In the current sprint, or still waiting in the backlog. */
  sprint: z.boolean(),
  opened: z.string(),
  description: z.string(),
  /** "Done when" checklist. */
  acceptance: z.array(z.string()),
  /** The review puzzle whose change request implements this ticket. */
  puzzle: z.string().optional(),
  /** What happened before the player arrived. */
  history: z.array(z.object({ who: z.string(), text: z.string(), when: z.string() })).default([]),
});
export type Ticket = z.infer<typeof TicketSchema>;

export const SprintSchema = z.object({ name: z.string(), goal: z.string(), ends: z.string() });
export type Sprint = z.infer<typeof SprintSchema>;

export const PipelineSchema = z.object({
  name: z.string(),
  /** Bot and channel that announce each finished stage. */
  npc: z.string(),
  channel: z.string(),
  stages: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        /** What this stage is for, written for non-coders. */
        plain: z.string(),
        minutes: z.number().positive(),
        /** Posted to the channel when the stage passes. "{ticket}" is replaced by the ticket key. */
        message: z.string(),
      }),
    )
    .min(1),
  /** Applied when the player's change reaches the last stage. */
  onComplete: z.array(EffectSchema),
  /** Earlier deployments by teammates, newest first. */
  history: z.array(
    z.object({
      ticket: z.string(),
      title: z.string(),
      author: z.string(),
      when: z.string(),
      /** Stage id where it was rolled back; absent when it reached production. */
      rolledBackAt: z.string().optional(),
      note: z.string().optional(),
    }),
  ),
});
export type Pipeline = z.infer<typeof PipelineSchema>;

export const GitScenarioSchema = z.object({
  /** Key of the ticket this change is for. */
  ticketKey: z.string(),
  repo: z.string(),
  file: z.object({
    path: z.string(),
    before: z.array(z.string()),
    after: z.array(z.string()),
    /** 1-based line that changes. */
    changedLine: z.number().int().positive(),
  }),
  workPoints: z.number().positive(),
  suggestedBranch: z.string(),
  suggestedCommitMessage: z.string(),
  history: z.array(z.object({ id: z.string(), message: z.string() })).min(1),
});
export type GitScenario = z.infer<typeof GitScenarioSchema>;

const Cell = z.tuple([z.number().int().min(0), z.number().int().min(0)]);

/**
 * The office floor, drawn as text so it can be edited without touching code.
 * Each string in `map` is one row; each character is a key in `tiles`.
 */
export const OfficeSchema = z.object({
  name: z.string(),
  map: z.array(z.string().min(3)).min(3),
  tiles: z.record(
    z.string().length(1),
    z.object({
      name: z.string(),
      walkable: z.boolean(),
      color: z.string(),
      /** An emoji or character drawn on the tile until real art exists. */
      glyph: z.string().optional(),
      /** Path to a picture under /public, used instead of the colour and glyph. */
      image: z.string().optional(),
    }),
  ),
  /** [column, row] where the player arrives each morning. */
  start: Cell,
  spots: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['desk', 'npc', 'coffee', 'game', 'exit', 'look']),
      label: z.string(),
      /** The tile the player clicks. */
      at: Cell,
      /** The floor tile the player stands on to use it. */
      stand: Cell,
      npc: z.string().optional(),
      /** Things said or shown here, picked in turn. */
      lines: z.array(z.string()).default([]),
    }),
  ),
});
export type Office = z.infer<typeof OfficeSchema>;
export type OfficeSpot = Office['spots'][number];

export const GlossaryEntrySchema = z.object({ id: z.string(), term: z.string(), def: z.string() });
export type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>;

export const CardSchema = z.object({
  id: z.string(),
  kicker: z.string(),
  title: z.string(),
  body: z.array(z.string()),
  /** "In real life" note: what actually happens, and what the game exaggerates. */
  realWorld: z.string().optional(),
  source: z.object({ label: z.string(), url: z.string().url() }).optional(),
});
export type Card = z.infer<typeof CardSchema>;

export interface Content {
  pack: Pack;
  npcs: Record<string, Npc>;
  channels: Channel[];
  missions: Mission[];
  chats: ChatEvent[];
  puzzles: Puzzle[];
  git: GitScenario;
  sprint: Sprint;
  tickets: Ticket[];
  pipeline: Pipeline;
  office: Office;
  glossary: GlossaryEntry[];
  cards: Record<string, Card>;
}

function effectsOf(c: Content): { where: string; effects: Effect[] }[] {
  const out: { where: string; effects: Effect[] }[] = [{ where: 'pipeline/onComplete', effects: c.pipeline.onComplete }];
  for (const e of c.chats) {
    for (const r of e.replies ?? []) out.push({ where: `chat ${e.id}/${r.id}`, effects: r.effects });
    if (e.onIgnored) out.push({ where: `chat ${e.id}/onIgnored`, effects: e.onIgnored });
    if (e.onDelivered) out.push({ where: `chat ${e.id}/onDelivered`, effects: e.onDelivered });
  }
  return out;
}

function conditionRefs(cond: Condition, visit: (c: Condition) => void): void {
  visit(cond);
  if (cond.type === 'all' || cond.type === 'any') cond.of.forEach((c) => conditionRefs(c, visit));
}

/** The floor must be a rectangle, and every place the player needs must be reachable on foot. */
function validateOffice(c: Content): string[] {
  const problems: string[] = [];
  const { map, tiles, start, spots } = c.office;
  const cols = map[0].length;
  map.forEach((row, y) => {
    if (row.length !== cols) problems.push(`office: row ${y + 1} is ${row.length} wide, expected ${cols}`);
    for (const ch of row) if (!tiles[ch]) problems.push(`office: row ${y + 1} uses "${ch}", which is not in tiles`);
  });
  if (problems.length > 0) return problems;

  const walkable = ([x, y]: readonly [number, number]) => y < map.length && x < cols && tiles[map[y][x]].walkable;
  if (!walkable(start)) problems.push('office: start is not on a walkable tile');

  const seen = new Set<string>([start.join(',')]);
  const queue: [number, number][] = [[start[0], start[1]]];
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next: [number, number] = [x + dx, y + dy];
      if (next[0] < 0 || next[1] < 0 || !walkable(next) || seen.has(next.join(','))) continue;
      seen.add(next.join(','));
      queue.push(next);
    }
  }

  for (const spot of spots) {
    const where = `office spot ${spot.id}`;
    if (spot.at[1] >= map.length || spot.at[0] >= cols) problems.push(`${where}: "at" is outside the map`);
    if (!walkable(spot.stand)) problems.push(`${where}: "stand" is not on a walkable tile`);
    else if (!seen.has(spot.stand.join(','))) problems.push(`${where}: cannot be reached from the start`);
    if (spot.kind === 'npc' && (!spot.npc || !c.npcs[spot.npc])) problems.push(`${where}: unknown npc "${spot.npc}"`);
  }
  for (const kind of ['desk', 'exit'] as const) {
    if (spots.filter((s) => s.kind === kind).length !== 1) problems.push(`office: needs exactly one "${kind}" spot`);
  }
  return problems;
}

/**
 * Cross-reference checks that a schema cannot express.
 * Returns a list of human-readable problems; empty means the pack is consistent.
 */
export function validateContent(c: Content): string[] {
  const problems: string[] = [];
  const stepIds = new Set(c.missions.flatMap((m) => m.steps.map((s) => s.id)));
  const eventIds = new Set(c.chats.map((e) => e.id));
  const puzzleIds = new Set(c.puzzles.map((p) => p.id));
  const channelIds = new Set(c.channels.map((ch) => ch.id));
  const glossaryIds = new Set(c.glossary.map((g) => g.id));
  const lineCats = new Set(c.pack.lineCategories.map((x) => x.id));
  const crCats = new Set(c.pack.crCategories.map((x) => x.id));
  const ticketKeys = new Set(c.tickets.map((t) => t.key));
  const isPerson = (id: string) => id === 'player' || !!c.npcs[id];

  const checkCondition = (where: string, cond: Condition) =>
    conditionRefs(cond, (x) => {
      if (x.type === 'stepDone' && !stepIds.has(x.step)) problems.push(`${where}: unknown step "${x.step}"`);
      if (x.type === 'reviewed' && !puzzleIds.has(x.puzzle)) problems.push(`${where}: unknown puzzle "${x.puzzle}"`);
    });

  for (const e of c.chats) {
    if (!channelIds.has(e.channel)) problems.push(`chat ${e.id}: unknown channel "${e.channel}"`);
    if (!c.npcs[e.from]) problems.push(`chat ${e.id}: unknown npc "${e.from}"`);
    checkCondition(`chat ${e.id}`, e.when);
  }

  for (const { where, effects } of effectsOf(c)) {
    for (const fx of effects) {
      if (fx.type === 'step' && !stepIds.has(fx.step)) problems.push(`${where}: unknown step "${fx.step}"`);
      if (fx.type === 'event' && !eventIds.has(fx.id)) problems.push(`${where}: unknown event "${fx.id}"`);
      if (fx.type === 'card' && !c.cards[fx.id]) problems.push(`${where}: unknown card "${fx.id}"`);
      if (fx.type === 'glossary' && !glossaryIds.has(fx.id)) problems.push(`${where}: unknown glossary "${fx.id}"`);
      if (fx.type === 'assign') {
        if (!ticketKeys.has(fx.ticket)) problems.push(`${where}: unknown ticket "${fx.ticket}"`);
        for (const who of [fx.to, fx.by]) if (!isPerson(who)) problems.push(`${where}: unknown person "${who}"`);
      }
      if (fx.type === 'stat') {
        const [root, key] = fx.path.split('.');
        if (!['stats', 'hidden', 'trust'].includes(root) || !key) problems.push(`${where}: bad stat path "${fx.path}"`);
        if (root === 'trust' && !c.npcs[key]) problems.push(`${where}: trust for unknown npc "${key}"`);
      }
    }
  }

  for (const p of c.puzzles) {
    const where = `puzzle ${p.id}`;
    if (!c.npcs[p.author]) problems.push(`${where}: unknown author "${p.author}"`);
    const reviewStep = c.missions.find((m) => m.steps.some((st) => st.id === `review:${p.id}`));
    if (!reviewStep) problems.push(`${where}: no mission step "review:${p.id}"`);
    else if (reviewStep.day !== p.day) problems.push(`${where}: is on day ${p.day} but its mission step is on day ${reviewStep.day}`);
    checkCondition(where, p.deliverWhen);
    for (const id of p.teaches ?? []) if (!glossaryIds.has(id)) problems.push(`${where}: teaches unknown glossary "${id}"`);
    for (const issue of p.issues) {
      const cats = issue.scope === 'line' ? lineCats : crCats;
      if (!cats.has(issue.category)) problems.push(`${where}/${issue.id}: unknown category "${issue.category}"`);
    }
    for (const [lang, v] of Object.entries(p.variants)) {
      if (!v) continue;
      const max = v.diff.length;
      const inRange = (n: number) => n >= 1 && n <= max;
      v.diff.forEach((line, i) => {
        if (!/^[+\- ]/.test(line)) problems.push(`${where}/${lang}: line ${i + 1} must start with "+", "-" or " "`);
      });
      for (const issue of p.issues) {
        const lines = v.issueLines[issue.id];
        if (issue.scope === 'line') {
          if (!lines || lines.length === 0) problems.push(`${where}/${lang}: issue "${issue.id}" has no lines`);
          else if (!lines.every(inRange)) problems.push(`${where}/${lang}: issue "${issue.id}" line out of range`);
        }
      }
      for (const id of Object.keys(v.issueLines)) {
        if (!p.issues.some((i) => i.id === id)) problems.push(`${where}/${lang}: lines for unknown issue "${id}"`);
      }
      for (const key of Object.keys(v.plain)) {
        if (!inRange(Number(key))) problems.push(`${where}/${lang}: plain text for line ${key} out of range`);
      }
      if (v.hintRegion && !(inRange(v.hintRegion[0]) && inRange(v.hintRegion[1]) && v.hintRegion[0] <= v.hintRegion[1])) {
        problems.push(`${where}/${lang}: hintRegion out of range`);
      }
      if (p.issues.some((i) => i.scope === 'line') && !v.hintRegion) {
        problems.push(`${where}/${lang}: has line issues but no hintRegion`);
      }
      for (const d of v.decoys ?? []) if (!inRange(d)) problems.push(`${where}/${lang}: decoy line ${d} out of range`);
    }
  }

  const days = [...new Set(c.missions.map((m) => m.day))].sort((a, b) => a - b);
  days.forEach((d, i) => {
    if (d !== i + 1) problems.push(`missions: days must be 1, 2, 3… without gaps (found day ${d})`);
    if (!stepIds.has(`leave:${d}`)) problems.push(`missions: day ${d} has no "leave:${d}" step`);
  });

  if (ticketKeys.size !== c.tickets.length) problems.push('tickets: keys must be unique');
  for (const t of c.tickets) {
    const where = `ticket ${t.key}`;
    if (!c.npcs[t.reporter]) problems.push(`${where}: unknown reporter "${t.reporter}"`);
    if (t.assignee !== null && !isPerson(t.assignee)) problems.push(`${where}: unknown assignee "${t.assignee}"`);
    if (t.puzzle && !puzzleIds.has(t.puzzle)) problems.push(`${where}: unknown puzzle "${t.puzzle}"`);
    for (const h of t.history) if (!isPerson(h.who)) problems.push(`${where}: history by unknown person "${h.who}"`);
  }
  if (!ticketKeys.has(c.git.ticketKey)) problems.push(`git: unknown ticket "${c.git.ticketKey}"`);
  for (const kind of ['start', 'resolve']) {
    if (!stepIds.has(`ticket:${kind}:${c.git.ticketKey}`)) problems.push(`git: no mission step "ticket:${kind}:${c.git.ticketKey}"`);
  }

  if (!c.npcs[c.pipeline.npc]) problems.push(`pipeline: unknown npc "${c.pipeline.npc}"`);
  if (!channelIds.has(c.pipeline.channel)) problems.push(`pipeline: unknown channel "${c.pipeline.channel}"`);
  const stageIds = new Set(c.pipeline.stages.map((st) => st.id));
  for (const h of c.pipeline.history) {
    if (!c.npcs[h.author]) problems.push(`pipeline history ${h.ticket}: unknown author "${h.author}"`);
    if (h.rolledBackAt && !stageIds.has(h.rolledBackAt)) problems.push(`pipeline history ${h.ticket}: unknown stage "${h.rolledBackAt}"`);
  }

  problems.push(...validateOffice(c));
  if (!channelIds.has(c.pack.mentorChannel)) problems.push(`pack: unknown mentorChannel "${c.pack.mentorChannel}"`);

  if (c.git.file.before.length !== c.git.file.after.length) problems.push('git: before/after must have the same number of lines');
  if (c.git.file.changedLine > c.git.file.before.length) problems.push('git: changedLine out of range');

  return problems;
}
