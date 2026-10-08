import { TRPCError } from "@trpc/server";
import { Prisma } from "@enterprise/db";

export const registerResponseError = (error: unknown): TRPCError => {
  if (error instanceof TRPCError) {
    throw error;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = error.meta?.target;
    const isEmailConflict = Array.isArray(target)
      ? target.includes("email")
      : typeof target === "string" && target.includes("email");

    throw new TRPCError({
      code: "CONFLICT",
      message: isEmailConflict
        ? "An account with this email already exists"
        : "Registration conflicts with an existing record",
      cause: error,
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Unable to register. Please try again later.",
    cause: error,
  });
};
