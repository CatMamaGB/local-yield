/**
 * Prisma 7 config — database URL and CLI behavior.
 * Requires: npm install dotenv (and load .env before running prisma CLI).
 */
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
});
