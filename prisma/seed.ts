/**
 * Prisma seed — creates test users for local/staging testing.
 * Run with: npx prisma db seed
 * Use only in development/staging; do not seed production with these accounts.
 */

import "dotenv/config";
import { PrismaClient, PlatformUse } from "@prisma/client";
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
    phone: "000-000-0000",
    platformUse: "BUY_LOCAL_GOODS" as const,
    isProducer: false,
    isBuyer: true,
    isCaregiver: false,
    isHomesteadOwner: false,
  },
  {
    email: "producer@test.localyield.example",
    name: "Test Producer",
    role: "PRODUCER" as const,
    zipCode: "90210",
    phone: "000-000-0000",
    platformUse: "SELL_PRODUCTS" as const,
    isProducer: true,
    isBuyer: false,
    isCaregiver: false,
    isHomesteadOwner: false,
  },
  {
    email: "admin@test.localyield.example",
    name: "Test Admin",
    role: "ADMIN" as const,
    zipCode: "90210",
    phone: "000-000-0000",
    platformUse: "OTHER" as const,
    isProducer: false,
    isBuyer: true,
    isCaregiver: false,
    isHomesteadOwner: false,
  },
];

async function main() {
  for (const user of TEST_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        ...user,
        platformUse: user.platformUse === "BUY_LOCAL_GOODS" ? PlatformUse.BUY_LOCAL_GOODS : user.platformUse === "SELL_PRODUCTS" ? PlatformUse.SELL_PRODUCTS : PlatformUse.OTHER,
      },
      update: {
        name: user.name,
        role: user.role,
        zipCode: user.zipCode,
        phone: user.phone,
        platformUse: user.platformUse === "BUY_LOCAL_GOODS" ? PlatformUse.BUY_LOCAL_GOODS : user.platformUse === "SELL_PRODUCTS" ? PlatformUse.SELL_PRODUCTS : PlatformUse.OTHER,
        isProducer: user.isProducer,
        isBuyer: user.isBuyer,
        isCaregiver: user.isCaregiver,
        isHomesteadOwner: user.isHomesteadOwner,
      },
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
