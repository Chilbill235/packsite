import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

import { TIER_CONFIG, PACK_CONFIGS, getPackConfig } from "./config";
import { generateItem } from "./engine";
import { logger } from "./utils";
import { AuditService } from "./audit";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PACK_METADATA = PACK_CONFIGS;

async function main() {
  logger.info("--- STARTING SEED ---");

  try {
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "Opening", "Inventory", "Item", "Pack", "Session", "Account", "User" RESTART IDENTITY CASCADE;'
    );
    logger.info("Database reset complete.");

    // Create seed users
    const adminId = uuidv4();
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash("password123", 10);

    await prisma.user.createMany({
      data: [
        {
          id: adminId,
          username: "admin",
          email: "admin@packsite.com",
          password: hashedPassword,
          role: "ADMIN",
          balance: 10000000,
        },
        {
          id: userId,
          username: "player1",
          email: "player1@packsite.com",
          password: hashedPassword,
          role: "USER",
          balance: 500000,
        },
      ],
    });
    logger.info("Created seed users (admin + player1).");

    // Create an active database session for player1 (valid for 30 days)
    const seedSessionToken = uuidv4();
    const sessionExpires = new Date();
    sessionExpires.setDate(sessionExpires.getDate() + 30);

    await prisma.session.create({
      data: {
        sessionToken: seedSessionToken,
        userId: userId,
        expires: sessionExpires,
      },
    });
    logger.info("Created active NextAuth session for player1.");

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
          image: p.name.toUpperCase().replace(/\s+/g, "_"),
          category: p.cat,
        },
      });
      packIds[p.name] = id;
    }
    logger.info(`Successfully created ${Object.keys(packIds).length} packs.`);

    // Create Items
    const itemBatch: ReturnType<typeof generateItem>[] = [];
    for (const packId of Object.values(packIds)) {
      const packName = Object.keys(packIds).find((k) => packIds[k] === packId);
      const config = packName ? getPackConfig(packName) : null;
      const allowedRarities = config?.allowedRarities?.length
        ? config.allowedRarities
        : Object.keys(TIER_CONFIG);
      for (const tierKey of allowedRarities) {
        const tier = TIER_CONFIG[tierKey as keyof typeof TIER_CONFIG];
        for (let i = 0; i < tier.qty; i++) {
          itemBatch.push(generateItem(tierKey, packId, i));
        }
      }
    }

    await prisma.item.createMany({ data: itemBatch });
    logger.info(`Inserted ${itemBatch.length} items across all packs.`);

    const auditor = new AuditService(prisma);
    await auditor.runFullAudit();

    logger.success("SEEDING COMPLETE");
    logger.info(`Login credentials: player1@packsite.com / password123`);
    logger.info(`Active Session Token: ${seedSessionToken}`);
  } catch (e) {
    logger.error("SEEDING FAILED");
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();