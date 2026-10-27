import { can, type OrganizationRole, PERMISSIONS } from "@enterprise/auth";
import { TRPCError } from "@trpc/server";
import { GEMINI_MODELS, OPENAI_MODELS } from "@enterprise/llm";

export const getAvailableModels = (role: OrganizationRole) => {
  if (!can(role, PERMISSIONS.MODEL_VIEW)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to view models",
    });
  }

  return [...OPENAI_MODELS, ...GEMINI_MODELS].filter((model) => model.enabled);
};
