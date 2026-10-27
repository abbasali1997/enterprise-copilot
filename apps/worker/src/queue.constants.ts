export const QUEUE_NAMES = {
  llmInteractive: "llm-interactive",
  llmBatch: "llm-batch",
  documents: "documents",
  email: "email",
  system: "system",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
