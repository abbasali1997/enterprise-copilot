import { type Prisma, prisma } from "@enterprise/db";

type DbClient = Prisma.TransactionClient | typeof prisma;

export const findOne = <T extends Prisma.OrganizationMemberFindFirstArgs>(
  args: Prisma.SelectSubset<T, Prisma.OrganizationMemberFindFirstArgs>,
  db: DbClient = prisma,
) => db.organizationMember.findFirst<T>(args);

export const updateOrganizationMemberRecord = <
  T extends Prisma.OrganizationMemberUpdateArgs,
>(
  args: Prisma.SelectSubset<T, Prisma.OrganizationMemberUpdateArgs>,
  db: DbClient = prisma,
) => db.organizationMember.update<T>(args);

export const createOrganizationMember = (
  input: {
    organizationId: string;
    userId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
  },
  db: DbClient = prisma,
) => {
  return db.organizationMember.create({
    data: input,
  });
};

export const findOrganizationMembers = <
  T extends Prisma.OrganizationMemberFindManyArgs,
>(
  args: Prisma.SelectSubset<T, Prisma.OrganizationMemberFindManyArgs>,
  db: DbClient = prisma,
) => {
  return db.organizationMember.findMany<T>(args);
};

export const findOrganizationMember = (
  input: {
    organizationId: string;
    userId: string;
  },
  db: DbClient = prisma,
) => {
  return db.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.userId,
      },
    },
  });
};

export const getMembership = (userId: string, organizationId: string) =>
  prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
      status: "ACTIVE",
      user: { status: "ACTIVE" },
      organization: { status: "ACTIVE" },
    },
    include: { organization: true },
  });
