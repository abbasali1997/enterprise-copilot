import type { LLMProviderName } from "./types.js";

export type LLMErrorCode =
  | "AUTHENTICATION"
  | "RATE_LIMIT"
  | "BAD_REQUEST"
  | "TIMEOUT"
  | "UNAVAILABLE"
  | "CANCELLED"
  | "UNKNOWN";

export class LLMProviderError extends Error {
  readonly provider: LLMProviderName;
  readonly code: LLMErrorCode;
  readonly retryable: boolean;
  readonly status?: number;

  constructor(input: {
    provider: LLMProviderName;
    code: LLMErrorCode;
    message: string;
    retryable?: boolean;
    status?: number;
    cause?: unknown;
  }) {
    super(input.message, {
      cause: input.cause,
    });

    this.name = "LLMProviderError";

    this.provider = input.provider;
    this.code = input.code;
    this.retryable = input.retryable ?? false;

    this.status = input.status;
  }
}
