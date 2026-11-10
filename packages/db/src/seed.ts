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

  console.log("Creating organizations");

  await prisma.organization.createMany({
    data: [
      {
        name: "ACME Corporation",
        slug: slugify("ACME Corporation"),
        logoUrl:
          "https://cdn.freebiesupply.com/logos/large/2x/acme-1-logo-png-transparent.png",
      },
      {
        name: "Fainin",
        slug: slugify("Fainin"),
        logoUrl:
          "https://thegreendealshow.com/wp-content/uploads/2026/05/fainin_Logo_1000-scaled.png",
      },
    ],
  });

  const organizations = await prisma.organization.findMany();

  if (!organizations[0] || !organizations[1]) {
    console.error("Error creating organizations.");
    process.exit(1);
  }

  console.log("Organization created.");

  console.log("Creating organization groups...");

  const [hrGroup, engineeringGroup, financeGroup] = await Promise.all([
    prisma.organizationGroup.create({
      data: { name: "HR", organizationId: organizations[0].id },
    }),
    prisma.organizationGroup.create({
      data: { name: "Engineering", organizationId: organizations[0].id },
    }),
    prisma.organizationGroup.create({
      data: { name: "Finance", organizationId: organizations[1].id },
    }),
    prisma.organizationGroup.create({
      data: { name: "Marketing", organizationId: organizations[1].id },
    }),
  ]);

  console.log("Organization groups created.");

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
      organizationId: organizations[0].id,
      userId: user.id,
      groupId: user.name === "user-1" ? hrGroup.id : engineeringGroup.id,
    });
  }

  await prisma.organizationMember.createMany({
    data: [
      ...data,
      {
        organizationId: organizations[0].id,
        userId: adminUser.id,
        groupId: hrGroup.id,
        role: "OWNER",
      },
      {
        organizationId: organizations[1].id,
        userId: adminUser.id,
        groupId: financeGroup.id,
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
