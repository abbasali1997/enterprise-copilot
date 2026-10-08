import { type Prisma, prisma } from "@enterprise/db";

type DbClient = Prisma.TransactionClient | typeof prisma;

export const countOrganizationsByName = (
  organizationName: string,
  db: DbClient = prisma,
) => {
  return db.organization.count({
    where: {
      name: organizationName,
    },
  });
};

export const createOrganizationRecord = (
  input: {
    name: string;
    slug: string;
  },
  db: DbClient = prisma,
) => {
  return db.organization.create({
    data: input,
  });
};

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

export const createOrganizationInvitation = (
  input: {
    email: string;
    organizationId: string;
    role: "MEMBER" | "ADMIN";
    invitedByUserId: string;
    tokenHash: string;
    expiresAt: Date;
  },
  db: DbClient = prisma,
) => {
  return db.organizationInvitation.create({
    data: input,
  });
};

export const findOrganizationInvitationByTokenHash = (
  tokenHash: string,
  db: DbClient = prisma,
) => {
  return db.organizationInvitation.findUnique({
    where: {
      tokenHash,
    },

    include: {
      organization: {
        select: {
          status: true,
        },
      },
    },
  });
};

export const findPendingOrganizationInvitation = (
  input: {
    organizationId: string;
    email: string;
  },
  db: DbClient = prisma,
) => {
  return db.organizationInvitation.findFirst({
    where: {
      organizationId: input.organizationId,
      email: input.email,
      status: "PENDING",
      expiresAt: {
        gt: new Date(),
      },
    },
  });
};

export const claimOrganizationInvitation = (
  input: {
    id: string;
    status: "ACCEPTED" | "REJECTED";
    respondedAt: Date;
  },
  db: DbClient = prisma,
) => {
  return db.organizationInvitation.updateMany({
    where: {
      id: input.id,
      status: "PENDING",
      expiresAt: {
        gt: input.respondedAt,
      },
    },

    data: {
      status: input.status,
      respondedAt: input.respondedAt,
    },
  });
};

export const setInvitationAcceptedByUser = (
  input: {
    invitationId: string;
    userId: string;
  },
  db: DbClient = prisma,
) => {
  return db.organizationInvitation.update({
    where: {
      id: input.invitationId,
    },

    data: {
      acceptedByUserId: input.userId,
    },
  });
};

export const markInvitationExpired = async (invitationId: string) => {
  return prisma.organizationInvitation.updateMany({
    where: {
      id: invitationId,
      status: "PENDING",
    },
    data: {
      status: "EXPIRED",
      respondedAt: new Date(),
    },
  });
};
