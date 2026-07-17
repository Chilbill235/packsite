export interface TierDef { qty: number; baseVal: number; chance: number; prefixes: string[]; suffixes: string[] }

export interface SeededItem {
  id: string;
  name: string;
  rarity: string;
  value: number;
  chance: number;
  image: string;
  packId: string;
}

export interface SeededUser {
  id: string;
  email: string;
  balance: number;
  luck: number;
  role: string;
}