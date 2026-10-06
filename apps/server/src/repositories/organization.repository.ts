import { type Prisma, prisma } from "@enterprise/db";

const slugify = (name: string, count = 0) => {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .concat(count > 0 ? `_${count}` : "");
};

export const createOrganization = async (
  organizationName: string,
  db: Prisma.TransactionClient = prisma,
) => {
  // Find number of organizations with the same name
  const count = await db.organization.count({
    where: {
      name: organizationName,
    },
  });

  return await db.organization.create({
    data: {
      name: organizationName,
      slug: slugify(organizationName, count),
    },
  });
};

export const createOrganizationMember = (input: {
  organizationId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
}, db: Prisma.TransactionClient = prisma) => {
  const { organizationId, userId, role } = input;

  return db.organizationMember.create({
    data: {
      organizationId,
      userId,
      role,
    },
  });
};
