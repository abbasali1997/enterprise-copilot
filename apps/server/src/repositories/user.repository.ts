import { type Prisma, prisma } from "@enterprise/db";

type DbClient = Prisma.TransactionClient | typeof prisma;

export const findUserById = (id: string, db: DbClient = prisma) => {
  return db.user.findUnique({
    where: {
      id,
    },
  });
};

export const findUserByEmail = (email: string, db: DbClient = prisma) => {
  return db.user.findUnique({
    where: {
      email,
    },
  });
};

export const createUser = (
  data: Prisma.UserCreateInput,
  db: Prisma.TransactionClient = prisma,
) => {
  return db.user.create({ data });
};
