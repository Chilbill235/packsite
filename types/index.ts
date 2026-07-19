import { User, Pack, Item, Opening, Prisma } from "@prisma/client";

// These use standard model types for simple entities
export interface PackWithItems extends Pack {
  items: Item[];
}

// BEST PRACTICE: Using Prisma's built-in payload generator
// This ensures that any change to your schema is automatically reflected here
export type InventoryWithItem = Prisma.InventoryGetPayload<{
  include: { item: true };
}>;

export interface OpeningWithRelations extends Opening {
  user: User;
  pack: Pack;
  item: Item;
}

export interface PackOpenResponse {
  success: boolean;
  wonItem: Item;
  item: Item;
  newBalance: number;
}

export interface SellItemResponse {
  success: boolean;
  newBalance: number;
  message: string;
}