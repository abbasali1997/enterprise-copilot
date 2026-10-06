import { prisma, type Prisma } from "@enterprise/db";

export const createUser = (
  data: Prisma.UserCreateInput,
  db: Prisma.TransactionClient = prisma,
) => {
  return db.user.create({ data });
};
