export const TIER_CONFIG = {
  STARDUST: { 
    qty: 150, 
    baseVal: 10, 
    chance: 10000, 
    prefixes: ["Stray", "Astral", "Faded", "Dormant", "Drifting", "Fractured", "Static", "Residual", "Glinting", "Vagrant"], 
    suffixes: ["Ember", "Glimmer", "Shard", "Mote", "Speck", "Scrap", "Trace", "Remnant", "Flux", "Dust"] 
  },
  NEBULA: { 
    qty: 75, 
    baseVal: 150, 
    chance: 4000, 
    prefixes: ["Ionized", "Prismatic", "Luminescent", "Kinetic", "Thermal", "Vibrant", "Nebulous", "Aura-Bound", "Solaris", "Fluorescent"], 
    suffixes: ["Filament", "Bloom", "Cascade", "Pulse", "Veil", "Vapor", "Plasma", "Condensate", "Helix", "Mist"] 
  },
  GALACTIC: { 
    qty: 30, 
    baseVal: 1200, 
    chance: 1200, 
    prefixes: ["Magnetar", "Supermassive", "Hyper-Dense", "Orbital", "Gravitic", "Quasar", "Tectonic", "Chronal", "Stellar-Forged", "Cosmic"], 
    suffixes: ["Core", "Lattice", "Matrix", "Monolith", "Conduit", "Node", "Ingot", "Weave", "Catalyst", "Anchor"] 
  },
  VOID: { 
    qty: 10, 
    baseVal: 25000, 
    chance: 150, 
    prefixes: ["Abyssal", "Zero-Point", "Umbral", "Vantablack", "Eldritch", "Null-Space", "Event-Horizon", "Shattered", "Eclipse", "Sub-Spatial"], 
    suffixes: ["Rift", "Singularity", "Maw", "Fracture", "Vacuum", "Phantom", "Horizon", "Obelisk", "Gaze", "Blade"] 
  },
  CELESTIAL: { 
    qty: 2, 
    baseVal: 750000, 
    chance: 15, 
    prefixes: ["Primordial", "Ascended", "Sovereign", "Archon", "Timeless", "Empyrean", "Infinite", "Genesis", "Aeon", "Divine"], 
    suffixes: ["Apex", "Aegis", "Reliquary", "Crown", "Will", "Sphere", "Engine", "Soul", "Artifact", "Beacon"] 
  },
  OMEGA: { 
    qty: 1, 
    baseVal: 50000000, 
    chance: 2, 
    prefixes: ["REALITY-RENDING", "CAUSALITY-BREAKING", "DOOMSDAY", "OMEGA-PROTOCOL", "UNBOUND-TITAN", "GOD-KILLER", "EXISTENTIAL-ZERO", "CHRONO-COLLAPSED"], 
    suffixes: ["Paradox", "Catalyst", "Nexus", "Anomaly", "Ultimatum", "Ouroboros", "Crucible", "Origin", "Engine", "Singularity"] 
  }
};

export const PACK_METADATA = [
  { 
    name: 'Wayfarer’s Launch Kit', 
    price: 100, 
    desc: 'Standard-issue logistics cache containing basic survival essentials, low-orbit scrap, and foundational crafting components.', 
    cat: 'BASIC', 
    rarityMod: 1.0 
  },
  { 
    name: 'Vanguard Supply Drop', 
    price: 0, 
    desc: 'A subsidized daily manifest distributed by Sector Command. Minimal but reliable materials to keep your thrusters warm.', 
    cat: 'PROMO', 
    rarityMod: 1.1 
  },
  { 
    name: 'Nova-Class Cache', 
    price: 600, 
    desc: 'Highly volatile cargo intercepted from a localized stellar collapse. Packed with time-sensitive cosmic anomalies.', 
    cat: 'EVENT', 
    rarityMod: 1.3 
  },
  { 
    name: 'Empyrean Archival Vault', 
    price: 1500, 
    desc: 'A heavily shielded high-tier vault containing dense starlight matrices, pristine galactic alloys, and pre-collapse relics.', 
    cat: 'PREMIUM', 
    rarityMod: 1.6 
  },
  { 
    name: 'Singularity Containment Unit', 
    price: 3500, 
    desc: 'Sealed with dense magnetic dampeners to trap hyper-unstable null-space energy, zero-point vectors, and raw void shards.', 
    cat: 'VOID', 
    rarityMod: 2.5 
  },
  { 
    name: 'Paradox Core Consignment', 
    price: 12000, 
    desc: 'Strictly black-market cargo banned across civilized sectors. Guaranteed to cause micro-tears in local spacetime upon opening.', 
    cat: 'OMEGA', 
    rarityMod: 4.5 
  }
];