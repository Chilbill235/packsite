export const TIER_CONFIG = {
  STARDUST: { qty: 200, baseVal: 10, chance: 10000, prefixes: ["Faint", "Glowing", "Shimmering", "Cracked", "Dull", "Pulsing", "Dim", "Weak", "Small"], suffixes: ["Shard", "Mote", "Crumbs", "Dust", "Fragment", "Spec", "Trace", "Grain"] },
  NEBULA: { qty: 150, baseVal: 250, chance: 4000, prefixes: ["Swirling", "Deep", "Vibrant", "Radiant", "Ethereal", "Hazy", "Cloudy", "Bright"], suffixes: ["Mist", "Cloud", "Gas", "Veil", "Expanse", "Layer", "Wisp", "Glow"] },
  GALACTIC: { qty: 100, baseVal: 2500, chance: 1200, prefixes: ["Ancient", "Frozen", "Burning", "Solar", "Gravity", "Temporal", "Heavy", "Massive"], suffixes: ["Orb", "Relic", "Core", "Spire", "Icon", "Totem", "Anchor", "Pillar"] },
  VOID: { qty: 75, baseVal: 50000, chance: 150, prefixes: ["Abyssal", "Corrupted", "Eldritch", "Singularity", "Null", "Silent", "Hidden", "Dark"], suffixes: ["Blade", "Shard", "Tear", "Void", "Cutter", "Edge", "Wraith", "Phantom"] },
  CELESTIAL: { qty: 50, baseVal: 1000000, chance: 15, prefixes: ["God-Tier", "Ascended", "Primordial", "Eternal", "Infinite", "Heavenly", "Divine", "Holy"], suffixes: ["Eye", "Heart", "Soul", "Crown", "Halo", "Spark", "Breath", "Will"] },
  OMEGA: { qty: 25, baseVal: 50000000, chance: 2, prefixes: ["UNSTABLE", "REALITY-WARPING", "OMEGA", "FINAL", "GOD-KILLER", "UNKNOWN", "BLACK-HOLE", "TITAN"], suffixes: ["Catalyst", "Engine", "Anomaly", "Event", "Source", "Origin", "Core", "Nexus"] }
};

export const PACK_METADATA = [
  { name: 'Cosmic Vault', price: 1000, desc: 'A vast collection of cosmic artifacts.', cat: 'PREMIUM', rarityMod: 1.5 },
  { name: 'Starter Cache', price: 100, desc: 'Essentials for new explorers.', cat: 'BASIC', rarityMod: 1.0 },
  { name: 'Event Crate', price: 500, desc: 'Limited time seasonal items.', cat: 'EVENT', rarityMod: 1.2 },
  { name: 'Void Box', price: 2000, desc: 'High-tier dark-matter gear.', cat: 'VOID', rarityMod: 2.0 },
  { name: 'Singularity Crate', price: 5000, desc: 'Reality-warping Omega anomalies. Not for the faint of heart.', cat: 'OMEGA', rarityMod: 3.0 },
  { name: 'Promo Bundle', price: 0, desc: 'Daily free rewards.', cat: 'PROMO', rarityMod: 1.1 }
];