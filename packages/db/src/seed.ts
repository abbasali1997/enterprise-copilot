import * as bcrypt from "bcrypt";
import { prisma } from "./index";

function slugify(name: string): string {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "organization"
  );
}

async function main() {
  console.log("Clearing database…");

  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organization.deleteMany(),
  ]);

  console.log("Database cleared.");

  console.log("Creating users...");

  await prisma.user.createMany({
    data: [
      {
        email: "admin@example.com",
        name: "admin",
        passwordHash: await bcrypt.hash("admin123", 10),
      },
      {
        email: "employee1@example.com",
        name: "user-1",
        passwordHash: await bcrypt.hash("user123", 10),
      },
      {
        email: "employee2@example.com",
        name: "user-2",
        passwordHash: await bcrypt.hash("user123", 10),
      },
    ],
  });

  console.log("Users created.");

  console.log("Creating organization");

  const newOrganization = await prisma.organization.create({
    data: {
      name: "ORG-I",
      slug: slugify("ORG-I"),
    },
  });

  console.log("Organization created.");

  console.log("Creating memberships");

  const adminUser = await prisma.user.findFirstOrThrow({
    where: {
      name: "admin",
    },
  });

  const users = await prisma.user.findMany({
    where: {
      name: { in: ["user-1", "user-2"] },
    },
  });

  if (users.length < 1) {
    throw new Error("No users found.");
  }

  const data = [];
  for (const user of users) {
    data.push({
      organizationId: newOrganization.id,
      userId: user.id,
    });
  }

  await prisma.organizationMember.createMany({
    data: [
      ...data,
      {
        organizationId: newOrganization.id,
        userId: adminUser.id,
        role: "ADMIN",
      },
    ],
  });

  console.log("Memberships created.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
