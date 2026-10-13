import type { Difficulty } from './schema';

/** What the onboarding offers. Only companies with a content pack are playable. */
export interface CompanyListing {
  id: string;
  name: string;
  tagline: string;
  mood: string;
  available: boolean;
  /** Said by the terminal right after the player picks this company. */
  quip: string;
}

export const COMPANIES: CompanyListing[] = [
  {
    id: 'rainforest',
    name: 'Rainforest Cloud',
    tagline: 'Frugal. Customer-obsessed. Paged at 3 AM.',
    mood: 'Survival',
    available: true,
    quip: 'Bold choice. The 3 AM pages are included at no extra cost.',
  },
  { id: 'goggle', name: 'Goggle', tagline: 'Design docs, committees and free lunch.', mood: 'Chill', available: false, quip: '' },
  { id: 'zeta', name: 'Zeta', tagline: 'Move fast. Show impact. Or else.', mood: 'Fast', available: false, quip: '' },
  { id: 'fruitco', name: 'FruitCo', tagline: 'You did not see this. Neither did we.', mood: 'Stealth', available: false, quip: '' },
  { id: 'macrohard', name: 'Macrohard', tagline: 'Enterprise, but make it cloud.', mood: 'Steady', available: false, quip: '' },
  { id: 'flixnet', name: 'Flixnet', tagline: 'Freedom, responsibility and a keeper test.', mood: 'Intense', available: false, quip: '' },
];

export interface BackgroundOption {
  id: string;
  label: string;
  difficulty: Difficulty;
  /** The terminal's answer, and a plain statement of what this choice changes. */
  response: string[];
}

export const BACKGROUNDS: BackgroundOption[] = [
  {
    id: 'new',
    label: 'I have never written code',
    difficulty: 'guided',
    response: [
      'Perfect. You will read code here, never write it from scratch.',
      'Every line comes with a plain-English translation, and hints are free.',
    ],
  },
  {
    id: 'learning',
    label: 'I am learning to code',
    difficulty: 'guided',
    response: ['Good timing. This is the part no course teaches.', 'You get plain-English help and free hints. Turn them down later if it feels too easy.'],
  },
  {
    id: 'student',
    label: 'I study or studied computer science',
    difficulty: 'standard',
    response: ['Then you can read a diff. Let us see if you can review one.', 'Hints are there when you ask. Your mentor notices how often you do.'],
  },
  {
    id: 'pro',
    label: 'I write code for a living',
    difficulty: 'realistic',
    response: ['Then you know how this goes.', 'No hints. No translations. Just you and the diff.'],
  },
];

export interface LadderRung {
  id: string;
  title: string;
  note: string;
  open: boolean;
}

export const LADDER: LadderRung[] = [
  { id: 'intern', title: 'Software Engineer Intern', note: 'open position', open: true },
  { id: 'sde1', title: 'SDE I · Junior', note: 'locked: pass the return-offer review', open: false },
  { id: 'sde2', title: 'SDE II · Mid-level', note: 'locked: earn a promotion', open: false },
  { id: 'senior', title: 'Senior SDE', note: 'locked: earn a promotion', open: false },
  { id: 'principal', title: 'Principal Engineer', note: 'locked: one day', open: false },
];
