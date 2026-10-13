import type { Content, GitScenario } from '../content/schema';
import { postMessage } from './chat';
import { completeStep } from './effects';
import { randomHex } from './rng';
import { findTicket, startTicketFromBranch, ticketCrOpened } from './tickets';
import type { GameState, GitState } from './types';

/**
 * A deliberately small Git model: one repo, one file, linear history.
 * It supports only the commands the Intern curriculum teaches.
 */
export function createGitState(scenario: GitScenario): GitState {
  const commits = scenario.history.map((h, i) => ({
    id: h.id,
    parent: i === 0 ? null : scenario.history[i - 1].id,
    message: h.message,
    branch: 'main',
  }));
  const head = commits[commits.length - 1].id;
  return {
    branch: 'main',
    branches: { main: head },
    remote: { main: head },
    commits,
    workProgress: 0,
    modified: false,
    staged: false,
    crOpen: false,
    merged: false,
    terminal: [],
  };
}

const VAGUE_MESSAGES = new Set(['fix', 'fixes', 'fixed', 'update', 'updates', 'wip', 'changes', 'stuff', 'test', 'asdf', 'commit']);

export function isGoodCommitMessage(message: string): boolean {
  const m = message.trim();
  return m.length >= 12 && m.split(/\s+/).length >= 3 && !VAGUE_MESSAGES.has(m.toLowerCase());
}

const BRANCH_CONVENTION = /^[a-z]+\/[A-Za-z]+-\d+(-[a-z0-9-]+)?$/;

function out(g: GitState, text: string, kind: GitState['terminal'][number]['kind'] = 'out'): void {
  g.terminal.push({ kind, text });
}

function isAhead(g: GitState, branch: string): boolean {
  return g.branches[branch] !== g.remote[branch];
}

function statusLines(g: GitState, c: Content): string[] {
  const lines = [`On branch ${g.branch}`];
  if (g.staged) lines.push('Changes to be committed:', `        modified:   ${c.git.file.path}`);
  else if (g.modified) lines.push('Changes not staged for commit:', `        modified:   ${c.git.file.path}`);
  else if (isAhead(g, g.branch)) lines.push('Your branch has commits that are not on the remote yet. Use "git push".');
  else lines.push('nothing to commit, working tree clean');
  return lines;
}

const HELP = [
  'Commands this laptop understands:',
  '  git status                      what state is my work in?',
  '  git switch -c <branch>          create a branch and move to it',
  '  git switch <branch>             move to an existing branch',
  '  git add .                       stage my changes for the next commit',
  '  git commit -m "<message>"       save a snapshot with a message',
  '  git push                        send my branch to the remote',
  '  git log                         show history',
  '  git diff                        show unstaged changes',
];

export function runGitCommand(s: GameState, c: Content, raw: string): void {
  const g = s.git;
  const input = raw.trim().replace(/\s+/g, ' ');
  if (!input) return;
  out(g, input, 'in');

  if (input === 'help' || input === 'git help' || input === 'git') {
    HELP.forEach((l) => out(g, l));
    return;
  }
  if (!input.startsWith('git ')) {
    out(g, `${input.split(' ')[0]}: command not found. Type "help" to see what works here.`, 'err');
    return;
  }

  const args = input.slice(4);
  let m: RegExpMatchArray | null;

  if (args === 'status') {
    statusLines(g, c).forEach((l) => out(g, l));
    return;
  }

  if ((m = args.match(/^(?:switch -c|checkout -b) (\S+)$/))) {
    const name = m[1];
    if (g.branches[name]) {
      out(g, `fatal: a branch named '${name}' already exists`, 'err');
      return;
    }
    g.branches[name] = g.branches[g.branch];
    g.branch = name;
    out(g, `Switched to a new branch '${name}'`);
    if (!BRANCH_CONVENTION.test(name)) {
      out(g, `Tip: the team names branches like ${c.git.suggestedBranch} so anyone can trace a branch back to its ticket.`, 'tip');
    }
    completeStep(s, 'git:branch');
    startTicketFromBranch(s, c);
    return;
  }

  if ((m = args.match(/^(?:switch|checkout) (\S+)$/))) {
    const name = m[1];
    if (!g.branches[name]) {
      out(g, `fatal: invalid reference: ${name}`, 'err');
      return;
    }
    g.branch = name;
    out(g, `Switched to branch '${name}'`);
    return;
  }

  if (/^add (\.|-A|--all|\S+)$/.test(args)) {
    const target = args.slice(4);
    if (!['.', '-A', '--all', c.git.file.path].includes(target)) {
      out(g, `fatal: pathspec '${target}' did not match any files`, 'err');
      return;
    }
    if (!g.modified) {
      out(g, 'Nothing to stage yet. Make the change in the editor first.', 'tip');
      return;
    }
    g.staged = true;
    completeStep(s, 'git:add');
    return;
  }

  if (args.startsWith('commit')) {
    m = args.match(/^commit (?:-m|-am) (["'])(.+)\1$/);
    if (!m) {
      out(g, 'This laptop needs the message inline:  git commit -m "what changed and why"', 'err');
      return;
    }
    if (!g.staged) {
      out(g, g.modified ? 'no changes added to commit (use "git add .")' : 'nothing to commit, working tree clean', 'err');
      return;
    }
    const message = m[2];
    const id = randomHex(s.rng, 7);
    s.rng = id.next;
    g.commits.push({ id: id.value, parent: g.branches[g.branch], message, branch: g.branch });
    g.branches[g.branch] = id.value;
    g.staged = false;
    g.modified = false;
    s.flags.good_commit_msg = isGoodCommitMessage(message);
    out(g, `[${g.branch} ${id.value}] ${message}`);
    out(g, ' 1 file changed, 1 insertion(+), 1 deletion(-)');
    if (!s.flags.good_commit_msg) {
      out(g, 'Tip: a reviewer reads this message first. Say what changed and why, not just "fix".', 'tip');
    }
    completeStep(s, 'git:commit');
    return;
  }

  if (/^push( -u)?( origin( \S+)?)?$/.test(args)) {
    if (g.branch === 'main') {
      if (isAhead(g, 'main')) {
        out(g, `remote: error: 'main' is protected. Every change must go through a ${c.pack.terminology.changeRequest}.`, 'err');
        out(g, `Tip: your commit is safe. Run "git switch -c ${c.git.suggestedBranch}" to move it onto a branch, then push that.`, 'tip');
      } else {
        out(g, 'Everything up-to-date');
      }
      return;
    }
    if (!g.remote[g.branch] && g.branches[g.branch] === g.remote.main) {
      out(g, 'Nothing to push yet: this branch has no new commits. Commit your change first.', 'tip');
      return;
    }
    if (!isAhead(g, g.branch)) {
      out(g, 'Everything up-to-date');
      return;
    }
    g.remote[g.branch] = g.branches[g.branch];
    out(g, `To rainforest.example/${c.git.repo}.git`);
    out(g, ` * [new branch]      ${g.branch} -> ${g.branch}`);
    out(g, `Your branch is on the remote. Next: open a ${c.pack.terminology.changeRequest} so a teammate can review it.`, 'tip');
    completeStep(s, 'git:push');
    return;
  }

  if (args === 'log' || args === 'log --oneline') {
    let id: string | null = g.branches[g.branch];
    while (id) {
      const commit = g.commits.find((x) => x.id === id);
      if (!commit) break;
      out(g, `${commit.id} ${commit.message}`);
      id = commit.parent;
    }
    return;
  }

  if (args === 'diff') {
    if (!g.modified || g.staged) {
      out(g, '(no unstaged changes)');
      return;
    }
    const i = c.git.file.changedLine - 1;
    out(g, `--- a/${c.git.file.path}`);
    out(g, `+++ b/${c.git.file.path}`);
    out(g, `-${c.git.file.before[i]}`);
    out(g, `+${c.git.file.after[i]}`);
    return;
  }

  out(g, `git: '${args.split(' ')[0]}' is not available on this laptop yet. Type "help".`, 'err');
}

/** Called every game minute while the player is focused on the editor. */
export function advanceWork(s: GameState, c: Content, amount: number): void {
  const g = s.git;
  if (g.workProgress >= c.git.workPoints || g.crOpen) return;
  g.workProgress = Math.min(c.git.workPoints, g.workProgress + amount);
  if (g.workProgress >= c.git.workPoints) {
    g.modified = true;
    completeStep(s, 'git:work');
  }
}

export function canOpenCr(g: GitState): boolean {
  return !g.crOpen && g.branch !== 'main' && !!g.remote[g.branch] && g.remote[g.branch] !== g.remote.main;
}

export function openCr(s: GameState, c: Content): void {
  if (!canOpenCr(s.git)) return;
  s.git.crOpen = true;
  s.flags.cr_opened = true;
  completeStep(s, 'git:cr');
  ticketCrOpened(s, c);
  const title = findTicket(c, c.git.ticketKey)?.title ?? '';
  postMessage(s, c.pack.crBot.channel, c.pack.crBot.npc, `${s.setup.playerName} opened a ${c.pack.terminology.changeRequest}: "${c.git.ticketKey} ${title}"`);
}

/** The reviewer approved: the branch lands on main. Returns whether a merge happened. */
export function mergeOpenCr(s: GameState): boolean {
  const g = s.git;
  if (!g.crOpen || g.merged) return false;
  const crBranch = Object.keys(g.remote).find((b) => b !== 'main' && g.remote[b] !== g.remote.main);
  if (!crBranch) return false;
  g.branches.main = g.remote[crBranch];
  g.remote.main = g.remote[crBranch];
  g.merged = true;
  return true;
}
