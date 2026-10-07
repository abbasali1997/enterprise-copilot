import { TRPCError } from "@trpc/server";
import { Prisma } from "@enterprise/db";

export const invitationResponseError = (error: unknown): TRPCError => {
  if (error instanceof TRPCError) return error;
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return new TRPCError({
      code: "CONFLICT",
      message: "Account or membership already exists",
      cause: error,
    });
  }
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Unable to respond to invitation. Please try again later.",
    cause: error,
  });
};
