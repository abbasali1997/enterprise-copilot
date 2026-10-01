import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const rootEnvPath = fileURLToPath(
  new URL("../../.env", import.meta.url)
);

config({
  path: rootEnvPath,
});

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: process.env.DATABASE_URL!,
  },
});