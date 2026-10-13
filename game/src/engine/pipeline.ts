import type { Content } from '../content/schema';
import { postMessage } from './chat';
import { applyEffects } from './effects';
import { ticketDeployed } from './tickets';
import type { GameState, PipelineState } from './types';

export function createPipelineState(): PipelineState {
  return { startedAt: null, stage: 0, stageStartedAt: 0, finishedAt: null };
}

/** A merged change enters the pipeline. Nothing else can start it. */
export function startPipeline(s: GameState): void {
  if (s.pipeline.startedAt !== null || !s.git.merged) return;
  s.pipeline = { startedAt: s.minute, stage: 0, stageStartedAt: s.minute, finishedAt: null };
}

function passStage(s: GameState, c: Content): void {
  const p = s.pipeline;
  const stage = c.pipeline.stages[p.stage];
  postMessage(s, c.pipeline.channel, c.pipeline.npc, stage.message.replaceAll('{ticket}', c.git.ticketKey));
  p.stage += 1;
  p.stageStartedAt = s.minute;
  if (p.stage >= c.pipeline.stages.length) {
    p.finishedAt = s.minute;
    ticketDeployed(s, c);
    applyEffects(s, c.pipeline.onComplete, c);
  }
}

export function tickPipeline(s: GameState, c: Content): void {
  const p = s.pipeline;
  if (p.startedAt === null || p.finishedAt !== null) return;
  if (s.minute - p.stageStartedAt >= c.pipeline.stages[p.stage].minutes) passStage(s, c);
}

/** 0..1 through the stage that is running now. */
export function stageProgress(s: GameState, c: Content): number {
  const p = s.pipeline;
  if (p.startedAt === null || p.finishedAt !== null) return 0;
  return Math.min(1, (s.minute - p.stageStartedAt) / c.pipeline.stages[p.stage].minutes);
}
