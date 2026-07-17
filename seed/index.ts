// 1. Force load environment variables
import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

// Imports
import { TIER_CONFIG, PACK_METADATA } from "./config.js";
import { generateItem } from "./engine.js";
import { logger } from "./utils.js";
import { AuditService } from "./audit.js";

// 2. Initialize the Postgres Pool and Prisma Adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 3. Initialize Prisma Client with the adapter (Required in Prisma v7+)
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("--- STARTING SEED ---");
  
  try {
    // Reset Database
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Opening", "Inventory", "Item", "Pack", "User" RESTART IDENTITY CASCADE');
    logger.info("Database reset complete.");

    // Create Packs
    const packIds: Record<string, string> = {};
    for (const p of PACK_METADATA) {
      const id = uuidv4();
      await prisma.pack.create({
        data: {
          id: id,
          name: p.name,
          description: p.desc,
          price: p.price,
          image: p.name.toUpperCase(),
          category: p.cat
        }
      });
      packIds[p.name] = id;
    }
    logger.info("Packs created successfully.");

    // Generate and Insert Items for ALL packs
    const itemBatch = [];
    for (const [packName, packId] of Object.entries(packIds)) {
      for (const [key, tier] of Object.entries(TIER_CONFIG)) {
        for (let i = 0; i < tier.qty; i++) {
          // Now passing the dynamic packId instead of hardcoding 'Cosmic Vault'
          itemBatch.push(generateItem(key, packId, i));
        }
      }
    }
    
    // Batch insert items
    await prisma.item.createMany({ data: itemBatch });
    logger.info(`Inserted ${itemBatch.length} items across all packs.`);

    // Audit
    const auditor = new AuditService(prisma);
    await auditor.runFullAudit();

    logger.success("SEEDING COMPLETE");
  } catch (e) {
    logger.error("SEEDING FAILED");
    console.error(e);
  } finally {
    // Gracefully close both Prisma and the Postgres pool
    await prisma.$disconnect();
    await pool.end();
  }
}

main();