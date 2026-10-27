import type { LLMStreamEvent } from "@enterprise/llm";
import { REDIS_CONNECTION } from "./redis.js";

export type GenerationEvent =
  | LLMStreamEvent
  | {
      type: "error";
      generationId: string;
      message: string;
    };

export const generationStreamKey = (id: string) => `generation:${id}:events`;
export const GENERATION_TTL_SECONDS = 3600;

export const publishGenerationEvent = async (event: GenerationEvent) => {
  const key = generationStreamKey(event.generationId);

  const result = await REDIS_CONNECTION.multi()
    .xadd(key, "*", "event", JSON.stringify(event))
    .expire(key, GENERATION_TTL_SECONDS)
    .exec();

  if (!result || result.some(([error]) => error)) {
    throw new Error("Failed to publish generation event");
  }
};
