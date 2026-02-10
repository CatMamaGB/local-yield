/**
 * Prisma seed — creates test users for local/staging testing.
 * Run with: npx prisma db seed
 * Use only in development/staging; do not seed production with these accounts.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run seed");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const TEST_USERS = [
  {
    email: "buyer@test.localyield.example",
    name: "Test Buyer",
    role: "BUYER" as const,
    zipCode: "90210",
  },
  {
    email: "producer@test.localyield.example",
    name: "Test Producer",
    role: "PRODUCER" as const,
    zipCode: "90210",
  },
  {
    email: "admin@test.localyield.example",
    name: "Test Admin",
    role: "ADMIN" as const,
    zipCode: "90210",
  },
];

async function main() {
  for (const user of TEST_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: user,
      update: { name: user.name, role: user.role, zipCode: user.zipCode },
    });
  }
  console.log("Seed complete: test users created/updated.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
