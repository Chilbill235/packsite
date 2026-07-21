// 1. Force load environment variables
import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

// Local Modules
import { TIER_CONFIG, PACK_METADATA } from "./config";
import { generateItem } from "./engine";
import { logger } from "./utils";
import { AuditService } from "./audit";

// 2. Initialize the Postgres Pool and Prisma Adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 3. Initialize Prisma Client with the adapter (Prisma v7+)
const prisma = new PrismaClient({ adapter });

async function main() {
  logger.info("--- STARTING SEED ---");

  try {
    // Reset Database Tables
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "Opening", "Inventory", "Item", "Pack", "User" RESTART IDENTITY CASCADE;'
    );
    logger.info("Database reset complete.");

    // Create Packs with explicit UUIDs
    const packIds: Record<string, string> = {};

    for (const p of PACK_METADATA) {
      const id = uuidv4();
      await prisma.pack.create({
        data: {
          id: id,
          name: p.name,
          description: p.desc,
          price: p.price,
          image: p.name.toUpperCase().replace(/\s+/g, "_"),
          category: p.cat,
        },
      });
      packIds[p.name] = id;
    }
    logger.info(`Successfully created ${Object.keys(packIds).length} packs.`);

    // Generate and Insert Items for ALL created packs
    const itemBatch: ReturnType<typeof generateItem>[] = [];

    for (const packId of Object.values(packIds)) {
      for (const [tierKey, tier] of Object.entries(TIER_CONFIG)) {
        for (let i = 0; i < tier.qty; i++) {
          itemBatch.push(generateItem(tierKey, packId, i));
        }
      }
    }

    // Batch insert items in bulk for maximum performance
    await prisma.item.createMany({ data: itemBatch });
    logger.info(`Inserted ${itemBatch.length} items across all packs.`);

    // Execute System Audit
    const auditor = new AuditService(prisma);
    await auditor.runFullAudit();

    logger.success("SEEDING COMPLETE");
  } catch (e) {
    logger.error("SEEDING FAILED");
    console.error(e);
    process.exitCode = 1;
  } finally {
    // Gracefully close both Prisma Client and Postgres Pool
    await prisma.$disconnect();
    await pool.end();
  }
}

main();