import type { Content } from '../content/schema';

export type TourId = 'office' | 'desktop' | 'tickets' | 'git' | 'review' | 'pipeline';

export interface TourStep {
  /** Matches a `data-tour` attribute. Without it the step is shown in the middle of the screen. */
  target?: string;
  title: string;
  body: string;
}

/** Tours are built from the pack so they use the company's own app names and vocabulary. */
export function buildTours(c: Content): Record<TourId, TourStep[]> {
  const app = (id: string) => c.pack.apps[id]?.displayName ?? id;
  const cr = c.pack.terminology.changeRequest;
  const crLong = c.pack.terminology.changeRequestLong;

  return {
    office: [
      {
        title: `Welcome to ${c.pack.name}`,
        body: `This is your floor: ${c.office.name}. You can walk around it, talk to your teammates, get a coffee, and sit down at your desk to work. The clock is stopped during this tour.`,
      },
      {
        target: 'office-you',
        title: 'This is you',
        body: 'Click any spot on the floor to walk there, or use the arrow keys. Click a person or an object to walk up to it and use it.',
      },
      {
        target: 'office-spot-desk',
        title: 'Your desk',
        body: 'Your laptop is here, and so is all of your work. Walk to it to sit down. You can stand up again whenever you like.',
      },
      {
        target: 'today-next',
        title: 'Lost? Look here',
        body: 'This box always shows the one thing to do next, with a button that takes you there. It follows you around the office.',
      },
      {
        target: 'today-list',
        title: 'What is due today',
        body: 'Each piece of work has a time it is due by. Nobody clocks out here: when everything on this list is done, you walk to the elevator and go home.',
      },
    ],
    desktop: [
      {
        title: 'Your work laptop',
        body: `Today has one goal: get a tiny fix from this laptop to real customers, the way professional engineers do it. You will be told what to do at every step, and why. The clock is stopped during this tour.`,
      },
      {
        target: 'today-next',
        title: 'Lost? Look here',
        body: 'This box always shows the one thing to do next, with a button that opens the right app. If you are ever unsure, come back to it.',
      },
      {
        target: 'today-list',
        title: "Today's plan",
        body: 'The whole day at a glance, with the time each item is due. Finished items are crossed out. Day one is short on purpose.',
      },
      {
        target: 'taskbar-apps',
        title: 'Your apps',
        body: `${app('chat')} is where the team talks. ${app('tickets')} lists the work, and who is doing it. ${app('git')} is where you change code. ${app('review')} is where you read teammates' changes (that starts tomorrow). ${app('pipeline')} shows a change travelling to customers. ${app('glossary')} collects every new word you meet. A red badge means something is waiting for you.`,
      },
      {
        target: 'clock',
        title: 'Time only moves while you play',
        body: 'The work day starts at 9 AM in game time and ends when your work is done. It stops whenever you pause, switch to another tab, or read an explanation. You can close the game at any moment and continue later from the same spot.',
      },
      {
        target: 'meters',
        title: 'How you are doing',
        body: 'Flow grows while you stay on one task and makes your work faster. Energy drops through the day; coffee and a break away from the desk bring some back. Stress rises when things go wrong. You do not need to manage them yet. Just notice them.',
      },
      {
        target: 'window-chat',
        title: `Start in ${app('chat')}`,
        body: 'Maya, your mentor, is about to say hello. When someone asks you something, your possible replies appear at the bottom of the chat. Pick one to answer. Windows can be dragged by their title bar, resized from their edges, and maximised with the square button.',
      },
    ],
    git: [
      {
        target: 'git-ticket',
        title: 'Your ticket',
        body: `The ticket you started in ${app('tickets')}, kept in view while you work. A spelling mistake in an error message. Small on purpose: today is about the path, not the code.`,
      },
      {
        target: 'git-editor',
        title: 'The file you will change',
        body: 'This is the code file with the typo. You do not type the fix yourself. Once you are on your own branch, keep this window in front and the fix gets written. The bar under the file shows progress.',
      },
      {
        target: 'git-terminal',
        title: 'The terminal',
        body: 'Engineers save and share code with a tool called Git, by typing short commands here. You do not have to remember them: the yellow "Next" line shows the command for the current step. Click it to run it, or type it yourself to learn it.',
      },
      {
        target: 'git-history',
        title: 'History',
        body: `Each dot is a saved version of the code (a "commit"). The grey line is main: the code customers actually run. Your work will appear as a green line that branches off, so nothing you do can break main.`,
      },
      {
        target: 'git-why',
        title: 'Always ask why',
        body: 'These buttons explain the reason behind each habit: why branches, why messages, why small changes. Reading them is the fastest way to understand how engineers think.',
      },
      {
        target: 'git-open-cr',
        title: `Ask for a review`,
        body: `When your branch is pushed, this button opens a ${cr} (${crLong}): a request for a teammate to read your change before it joins main. Nothing reaches customers without one.`,
      },
    ],
    tickets: [
      {
        title: 'Where work comes from',
        body: `Nobody walks over and tells an engineer what to type. Every piece of work is written down as a ticket, and ${app('tickets')} is where the team keeps them. Maya just assigned you your first one.`,
      },
      {
        target: 'tickets-detail',
        title: 'Read it before you touch any code',
        body: 'The title says what is wrong. Below it: who owns the ticket, who asked for it, how urgent it is, and where the request came from. This one started with a customer.',
      },
      {
        target: 'tickets-lifecycle',
        title: 'The life of a ticket',
        body: `Every ticket walks the same road: to do, in progress, review and deploy, done. After you start it, most of the moves happen by themselves as you open a ${cr} and it ships.`,
      },
      {
        target: 'tickets-actions',
        title: 'Say that you have started',
        body: 'Press Start work. It moves the ticket to In progress, so your team can see it is taken. That is the only thing to do here for now.',
      },
      {
        target: 'tickets-activity',
        title: 'The ticket remembers',
        body: 'Everything that happens is recorded here, with who did it and when. Months later, this is how someone finds out why a line of code changed.',
      },
      {
        target: 'tickets-tabs',
        title: 'The rest of the team',
        body: 'The sprint board shows what each teammate promised for these two weeks. The backlog is everything still waiting. Look around whenever you like: reading other tickets is how you learn what the team does.',
      },
    ],
    pipeline: [
      {
        title: 'The road to customers',
        body: `Nobody copies code onto servers by hand. Once a ${cr} is approved and merged, the pipeline carries it to production through a series of checks. No person presses a deploy button.`,
      },
      {
        target: 'pipeline-stages',
        title: 'One stage at a time',
        body: 'Each box is a stage. The change must pass one before it enters the next, and each stage puts it in front of more real traffic. A yellow box marks where your change is.',
      },
      {
        target: 'pipeline-now',
        title: 'What is happening right now',
        body: 'This line says in plain English where your change is and what that stage is checking. You do not have to do anything while it runs.',
      },
      {
        target: 'pipeline-history',
        title: 'It does not always go well',
        body: 'Look at the red entry: a teammate\'s change set off an alarm, and the pipeline took it back out within minutes. That safety net is why engineers here can ship many times a day.',
      },
    ],
    review: [
      {
        title: 'Now you are the reviewer',
        body: `Yesterday Maya read your change before it shipped. Today you do the same for a teammate. You are not expected to find everything. You are a second pair of eyes.`,
      },
      {
        target: 'review-header',
        title: 'Start with the description',
        body: `The author should say what the change does and why. Read this before the code. If it is empty, that is already worth pointing out.`,
      },
      {
        target: 'review-diff',
        title: 'The change itself',
        body: 'Green lines starting with + were added. Red lines starting with − were removed. Everything else is unchanged and shown for context. Move your mouse over any line to read it in plain English below.',
      },
      {
        target: 'review-plain',
        title: 'Plain English',
        body: 'This strip explains the line under your mouse without any code words. You can review every change in this game using only these explanations.',
      },
      {
        target: 'review-diff',
        title: 'Commenting on a line',
        body: 'When a line looks wrong, click it and choose what kind of problem it is. Each choice comes with a one-sentence explanation. You can remove a comment with the × next to it.',
      },
      {
        target: 'review-cr-checks',
        title: 'Problems with the whole change',
        body: 'Some problems are not on any single line: no tests, no description, or a change that is too big to read. Tick those here.',
      },
      {
        target: 'review-hint',
        title: 'Stuck? Ask',
        body: 'Maya gives up to three hints, each more specific than the last. In Guided mode they are free. Using them is how you learn where to look.',
      },
      {
        target: 'review-verdict',
        title: 'Your decision',
        body: 'Approve if you would be comfortable with this going to customers. Request changes if something must be fixed first. Afterwards you get a full explanation of what was really there, whatever you chose.',
      },
    ],
  };
}

const KEY = 'bts.tours.v1';
const ALL: TourId[] = ['office', 'desktop', 'tickets', 'git', 'review', 'pipeline'];

export function readToursSeen(): TourId[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is TourId => ALL.includes(x)) : [];
  } catch {
    return [];
  }
}

export function writeToursSeen(seen: TourId[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(seen));
  } catch {
    // The tour will simply show again next time.
  }
}
