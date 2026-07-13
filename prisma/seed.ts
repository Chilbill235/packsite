import { Pool } from "pg";
import "dotenv/config";
import { v4 as uuidv4 } from "uuid";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ALL_ITEMS = [
  // --- COMMON ---
  { name: "Plastic Spork", rarity: "COMMON", value: 1, chance: 5000 },
  { name: "Paperclip", rarity: "COMMON", value: 2, chance: 5000 },
  { name: "Used Napkin", rarity: "COMMON", value: 0.5, chance: 5000 },
  { name: "Frayed Shoelace", rarity: "COMMON", value: 1, chance: 5000 },
  { name: "Soda Tab", rarity: "COMMON", value: 0.25, chance: 5000 },
  { name: "Dry Pen", rarity: "COMMON", value: 1, chance: 5000 },
  { name: "Single Sock", rarity: "COMMON", value: 2, chance: 5000 },
  { name: "Twist Tie", rarity: "COMMON", value: 0.5, chance: 5000 },
  { name: "Bubble Wrap", rarity: "COMMON", value: 3, chance: 5000 },
  { name: "Rusty Nail", rarity: "COMMON", value: 1, chance: 5000 },
  { name: "Mint Wrapper", rarity: "COMMON", value: 0.5, chance: 5000 },
  { name: "Old Receipt", rarity: "COMMON", value: 0.1, chance: 5000 },
  { name: "Sticky Note", rarity: "COMMON", value: 1, chance: 5000 },
  { name: "Broken Match", rarity: "COMMON", value: 0.5, chance: 5000 },
  { name: "Elastic Band", rarity: "COMMON", value: 1, chance: 5000 },
  { name: "Rusty Paperclip", rarity: "COMMON", value: 0.1, chance: 5000 },
  { name: "Used Eraser", rarity: "COMMON", value: 0.5, chance: 5000 },
  { name: "Dusty Marble", rarity: "COMMON", value: 1, chance: 5000 },
  { name: "Bent Spoon", rarity: "COMMON", value: 1, chance: 5000 },
  { name: "Old Keychain", rarity: "COMMON", value: 2, chance: 5000 },

  // --- RARE ---
  { name: "Silver Dagger", rarity: "RARE", value: 150, chance: 800 },
  { name: "Gold Plated Mouse", rarity: "RARE", value: 250, chance: 800 },
  { name: "Mechanical Switch", rarity: "RARE", value: 100, chance: 800 },
  { name: "Designer Wallet", rarity: "RARE", value: 300, chance: 800 },
  { name: "Vintage Camera", rarity: "RARE", value: 450, chance: 800 },
  { name: "Crypto Ledger", rarity: "RARE", value: 500, chance: 800 },
  { name: "Gaming Headset", rarity: "RARE", value: 350, chance: 800 },
  { name: "Smart Watch", rarity: "RARE", value: 600, chance: 800 },
  { name: "Retro Console", rarity: "RARE", value: 400, chance: 800 },
  { name: "Crystal Prism", rarity: "RARE", value: 200, chance: 800 },
  { name: "Top-Tier GPU", rarity: "RARE", value: 800, chance: 800 },
  { name: "Mechanical Keyboard", rarity: "RARE", value: 300, chance: 800 },
  { name: "Signed Baseball", rarity: "RARE", value: 400, chance: 800 },
  { name: "Drone", rarity: "RARE", value: 650, chance: 800 },
  { name: "VR Headset", rarity: "RARE", value: 700, chance: 800 },

  // --- LEGENDARY ---
  { name: "Golden Crown", rarity: "LEGENDARY", value: 5000, chance: 50 },
  { name: "Diamond Ring", rarity: "LEGENDARY", value: 7500, chance: 50 },
  { name: "Master Clock", rarity: "LEGENDARY", value: 9000, chance: 50 },
  { name: "Luxury Supercar", rarity: "LEGENDARY", value: 15000, chance: 50 },
  { name: "Private Island Key", rarity: "LEGENDARY", value: 20000, chance: 50 },
  { name: "Pro Sports Team Share", rarity: "LEGENDARY", value: 25000, chance: 50 },
  { name: "Penthouse Suite Key", rarity: "LEGENDARY", value: 30000, chance: 50 },
  { name: "Superyacht Blueprint", rarity: "LEGENDARY", value: 45000, chance: 50 },
  { name: "Ancient Relic", rarity: "LEGENDARY", value: 12000, chance: 50 },
  { name: "Space Station Slot", rarity: "LEGENDARY", value: 18000, chance: 50 },

  // --- MYTHIC (Chase Tier) ---
  { name: "Galaxy Core", rarity: "MYTHIC", value: 100000, chance: 5 },
  { name: "Time Machine Prototype", rarity: "MYTHIC", value: 250000, chance: 3 },
  { name: "Small Star Fragment", rarity: "MYTHIC", value: 500000, chance: 2 },
  { name: "Alien Artifact", rarity: "MYTHIC", value: 750000, chance: 1 },
  { name: "Interdimensional Portal", rarity: "MYTHIC", value: 1000000, chance: 1 }
];

async function main() {
  console.log("Seeding with SQL...");
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE "Opening", "Inventory", "Item", "Pack" RESTART IDENTITY CASCADE');

    const packId = uuidv4();
    await client.query(
      'INSERT INTO "Pack" (id, name, description, price, image, category) VALUES ($1, $2, $3, $4, $5, $6)',
      [packId, 'The Mega Vault', 'A massive collection of 40+ unique items, including Mythic tier rewards.', 500, 'VAULT_GOLD', 'POPULAR']
    );

    for (const item of ALL_ITEMS) {
      await client.query(
        'INSERT INTO "Item" (id, name, rarity, value, chance, image, "packId") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [uuidv4(), item.name, item.rarity, item.value, item.chance, item.name.toUpperCase().replace(/\s/g, "_"), packId]
      );
    }
    await client.query('COMMIT');
    console.log(`✅ Seed complete! Added ${ALL_ITEMS.length} items.`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
  } finally {
    client.release();
    await pool.end();
  }
}
main();