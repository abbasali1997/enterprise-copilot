import * as bcrypt from "bcrypt";
import { prisma } from "./index";

async function main() {
  console.log("Clearing database…");

  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.user.deleteMany(),
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
        email: "employee@example.com",
        name: "user-1",
        passwordHash: await bcrypt.hash("user123", 10),
      },
    ],
  });

  console.log("Users created.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
