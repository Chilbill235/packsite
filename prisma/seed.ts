import { Pool } from "pg";
import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import type { Item } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const generateLootPool = (): { name: string; rarity: string; value: number; chance: number }[] => {
  const items: { name: string; rarity: string; value: number; chance: number }[] = [];
  const tiers = [
    { name: "COMMON", qty: 30, baseVal: 5, chance: 5000 },
    { name: "UNCOMMON", qty: 30, baseVal: 50, chance: 2500 },
    { name: "RARE", qty: 30, baseVal: 500, chance: 800 },
    { name: "LEGENDARY", qty: 25, baseVal: 10000, chance: 50 },
    { name: "MYTHIC", qty: 10, baseVal: 500000, chance: 5 },
    { name: "COSMIC", qty: 5, baseVal: 10000000, chance: 1 }
  ];

  tiers.forEach(tier => {
    for (let i = 1; i <= tier.qty; i++) {
      items.push({
        name: `${tier.name} Artifact #${i}`,
        rarity: tier.name,
        value: tier.baseVal * i,
        chance: tier.chance
      });
    }
  });
  return items;
};

async function main() {
  const lootPool: { name: string; rarity: string; value: number; chance: number }[] = generateLootPool();
  console.log(`Seeding ${lootPool.length} items to database...`);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Warning: This clears all current inventory/openings
    await client.query('TRUNCATE TABLE "Opening", "Inventory", "Item", "Pack" RESTART IDENTITY CASCADE');

    const packId = uuidv4();
    await client.query(
      'INSERT INTO "Pack" (id, name, description, price, image, category) VALUES ($1, $2, $3, $4, $5, $6)',
      [packId, 'The Cosmic Vault', 'A premium collection of 130 tiered artifacts.', 1000, 'VAULT_COSMIC', 'PREMIUM']
    );

    for (const item of lootPool) {
      await client.query(
        'INSERT INTO "Item" (id, name, rarity, value, chance, image, "packId") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [uuidv4(), item.name, item.rarity, item.value, item.chance, item.name.toUpperCase().replace(/\s/g, "_"), packId]
      );
    }
    await client.query('COMMIT');
    console.log(`✅ Success: ${lootPool.length} items seeded.`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
  } finally {
    client.release();
    await pool.end();
  }
}

main();