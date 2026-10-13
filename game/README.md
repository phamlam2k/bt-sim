# Big Tech SWE Simulator — prototype ("Your first week")

Three short playable days at Rainforest Cloud. Day 1: meet the team and ship a first change with Git.
Day 2: first two code reviews. Day 3: three reviews that need reading code.
Plans live one folder up: `MVP_PLAN.md`, `LEVEL_DESIGN.md`, `MONETIZATION.md`, `RESEARCH_AMAZON.md`.

## Run

```
npm install
npm run dev        # http://localhost:5173
npm test           # engine tests + UI smoke test
npm run build      # type-check and production build
```

## Layout

```
src/
  engine/     Pure TypeScript game rules. No React. Deterministic: step(state, action, content).
  content/
    schema.ts       Zod schemas + cross-reference validation for a company pack
    rainforest/     The Rainforest pack: pack.json, world.json, chats.json, puzzles.json, git.json
  apps/       The windows on the laptop: Chat, Code Review, Workspace (Git), Handbook
  shell/      Desktop, window manager, taskbar, Today panel, lock screen
  tour/       Step-by-step guided tours (desktop, Workspace, Code Review)
  screens/    Start and end-of-day summary
  store.ts    Zustand store: game state + window state
  save.ts     Local autosave
```

## Rules the code follows

- All game changes go through `step()` in `engine/step.ts`. Every action is appended to `state.log`;
  `replay(setup, log)` rebuilds the exact state (tested).
- Game time only moves on `TICK` actions. Nothing is tied to wall-clock time, so pausing or closing the tab costs nothing.
- Company-specific words and text live in the content pack, not in `engine/`, `apps/` or `shell/`.
- A broken content pack fails at load with every problem listed (`validateContent`).

## Adding a review puzzle

Add an entry to `content/rainforest/puzzles.json` and a matching `review:<id>` step in a mission of the same `day` in `world.json`.
Every day needs a `clockout:<day>` step.
Line numbers are 1-based indexes into `diff`. Run `npm test`; validation reports out-of-range lines and unknown ids.

## Customising the office

The office floor is data, not code: `src/content/rainforest/office.json`.

- `map` is the floor drawn as text. Each string is one row and every row must be the same width.
- `tiles` says what each character means: its name, whether you can walk on it, its colour, and an optional `glyph` (emoji).
  Set `image` to a file under `public/` (for example `"/office/desk.png"`) to draw a picture instead of the colour.
- `spots` are the things you can use. `at` is the tile you click, `stand` is the floor tile next to it where the player stops. Both are `[column, row]`, counted from 0.
  Kinds: `desk` (sit down at the laptop), `npc` (talk; `npc` is an id from `world.json`), `coffee`, `game`, `exit` (the elevator), `look` (just a line of text).
- `lines` are what a person says or what you read at that spot.
- `start` is where the player arrives each morning.

Save the file and the dev server reloads. If the map is broken (a row too short, an unknown character, a spot the player cannot walk to),
the game refuses to start and lists every problem, so a bad edit never reaches a player.
