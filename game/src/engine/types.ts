import type { Difficulty, Lang, TicketStatus } from '../content/schema';

export interface Setup {
  playerName: string;
  difficulty: Difficulty;
  lang: Lang;
  seed: number;
  packId: string;
  packVersion: string;
}

export interface ChatMessage {
  id: number;
  channel: string;
  from: string;
  text: string;
  minute: number;
  eventId?: string;
}

export interface QueuedMessage {
  eventId: string;
  index: number;
  at: number;
}

export interface AwaitingReply {
  eventId: string;
  expiresAt: number | null;
}

export interface ChatState {
  messages: ChatMessage[];
  queue: QueuedMessage[];
  awaiting: AwaitingReply[];
  fired: string[];
  scheduled: { eventId: string; at: number }[];
  unread: Record<string, number>;
  nextId: number;
}

export type CommentKind = 'bug' | 'question' | 'nit' | 'cr';

export interface ReviewComment {
  kind: CommentKind;
  /** null for CR-level comments. */
  line: number | null;
  category?: string;
}

export interface IssueOutcome {
  issueId: string;
  found: boolean;
  /** Found the right place but picked a different category. */
  categoryRight: boolean;
}

export interface ReviewResult {
  outcomes: IssueOutcome[];
  falsePositives: number;
  nits: number;
  shouldBlock: boolean;
  verdictCorrect: boolean;
  hintsUsed: number;
  score: number;
}

export interface ReviewSession {
  deliveredAt: number;
  comments: ReviewComment[];
  hintTier: 0 | 1 | 2 | 3;
  verdict: 'approve' | 'changes' | null;
  result: ReviewResult | null;
  /** The player has read the explanation card. */
  acknowledged: boolean;
  /** How many verdicts the player has submitted on this change request. */
  attempts: number;
  /** The first verdict's result. This is the honest score; later attempts only fix what was missed. */
  firstResult: ReviewResult | null;
  /** The mentor found something serious behind the player and sent it back. */
  needsRework: boolean;
}

export interface GitCommit {
  id: string;
  parent: string | null;
  message: string;
  branch: string;
}

export interface GitState {
  branch: string;
  /** branch name -> head commit id */
  branches: Record<string, string>;
  /** branch name -> head commit id known to the remote */
  remote: Record<string, string>;
  commits: GitCommit[];
  workProgress: number;
  modified: boolean;
  staged: boolean;
  crOpen: boolean;
  merged: boolean;
  terminal: { kind: 'in' | 'out' | 'err' | 'tip'; text: string }[];
}

export interface TicketActivity {
  day: number;
  minute: number;
  /** NPC id, "player", or "system" for automatic updates. */
  who: string;
  text: string;
}

export interface TicketState {
  status: TicketStatus;
  assignee: string | null;
  activity: TicketActivity[];
}

/** The player's change travelling to production. `stage` indexes the pack's pipeline stages. */
export interface PipelineState {
  startedAt: number | null;
  stage: number;
  stageStartedAt: number;
  finishedAt: number | null;
}

export interface LatentBug {
  puzzleId: string;
  issueId: string;
}

export interface Focus {
  app: string | null;
  /** What the player is concentrating on; drives Flow. e.g. "work" or "review:cr-201". */
  task: string | null;
}

export interface GameState {
  setup: Setup;
  phase: 'playing' | 'dayEnd';
  day: number;
  /** Minutes since midnight, in game time. */
  minute: number;
  rng: number;
  stats: { flow: number; energy: number; stress: number };
  hidden: { value: number; credit: number; techDebt: number; reviewQuality: number };
  trust: Record<string, number>;
  flags: Record<string, boolean>;
  stepsDone: string[];
  glossary: string[];
  cards: string[];
  focus: Focus;
  chat: ChatState;
  reviews: Record<string, ReviewSession>;
  git: GitState;
  tickets: Record<string, TicketState>;
  pipeline: PipelineState;
  /** Serious problems the player missed on a first attempt. The mentor caught them this week. */
  latentBugs: LatentBug[];
  /** Missions whose deadline passed before they were finished. */
  late: string[];
  metrics: {
    deepWorkMinutes: number;
    interruptions: number;
    coffees: number;
    breaks: number;
    peakFlow: number;
    clockedOutAt: number | null;
  };
  /** Append-only action log. Replaying it from `setup` reproduces this exact state. */
  log: Action[];
}

export type Action =
  | { type: 'TICK'; minutes: number }
  | { type: 'FOCUS'; app: string | null; task: string | null }
  | { type: 'CHAT_READ'; channel: string }
  | { type: 'CHAT_REPLY'; eventId: string; replyId: string }
  | { type: 'REVIEW_COMMENT'; puzzleId: string; comment: ReviewComment }
  | { type: 'REVIEW_REMOVE_COMMENT'; puzzleId: string; index: number }
  | { type: 'REVIEW_HINT'; puzzleId: string }
  | { type: 'REVIEW_VERDICT'; puzzleId: string; verdict: 'approve' | 'changes' }
  | { type: 'REVIEW_ACK'; puzzleId: string }
  | { type: 'GIT_CMD'; input: string }
  | { type: 'GIT_OPEN_CR' }
  | { type: 'TICKET_START'; key: string }
  | { type: 'TICKET_RESOLVE'; key: string }
  | { type: 'COFFEE' }
  | { type: 'PLAY_GAME'; won: boolean; opponent: string | null }
  | { type: 'DISMISS_CARD' }
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'GO_HOME' }
  | { type: 'START_NEXT_DAY' };
