import { type DbClient, type Prisma, prisma } from "@enterprise/db";

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

export const updateUser = (
  args: Prisma.UserUpdateArgs,
  db: Prisma.TransactionClient = prisma,
) => {
  return db.user.update(args);
};
