import { z } from 'zod';
import {
  CardSchema,
  ChannelSchema,
  ChatEventSchema,
  GitScenarioSchema,
  GlossaryEntrySchema,
  MissionSchema,
  NpcSchema,
  OfficeSchema,
  PackSchema,
  PipelineSchema,
  PuzzleSchema,
  SprintSchema,
  TicketSchema,
  validateContent,
  type Content,
} from '../schema';
import chats from './chats.json';
import office from './office.json';
import git from './git.json';
import pack from './pack.json';
import pipeline from './pipeline.json';
import puzzles from './puzzles.json';
import tickets from './tickets.json';
import world from './world.json';

const WorldSchema = z.object({
  npcs: z.array(NpcSchema),
  channels: z.array(ChannelSchema),
  missions: z.array(MissionSchema),
  glossary: z.array(GlossaryEntrySchema),
  cards: z.array(CardSchema),
});

const BoardSchema = z.object({ sprint: SprintSchema, tickets: z.array(TicketSchema) });

/** Parses and cross-checks the pack. Throws with every problem listed, so bad content never reaches a player. */
export function loadRainforest(): Content {
  const w = WorldSchema.parse(world);
  const board = BoardSchema.parse(tickets);
  const content: Content = {
    pack: PackSchema.parse(pack),
    npcs: Object.fromEntries(w.npcs.map((n) => [n.id, n])),
    channels: w.channels,
    missions: w.missions,
    chats: z.array(ChatEventSchema).parse(chats),
    puzzles: z.array(PuzzleSchema).parse(puzzles),
    git: GitScenarioSchema.parse(git),
    sprint: board.sprint,
    tickets: board.tickets,
    pipeline: PipelineSchema.parse(pipeline),
    office: OfficeSchema.parse(office),
    glossary: w.glossary,
    cards: Object.fromEntries(w.cards.map((c) => [c.id, c])),
  };
  const problems = validateContent(content);
  if (problems.length > 0) throw new Error(`Content pack "${content.pack.id}" is invalid:\n- ${problems.join('\n- ')}`);
  return content;
}
