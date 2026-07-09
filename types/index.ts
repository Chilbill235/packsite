import type { User, Pack, Item, Inventory, Opening } from "@prisma/client";

export interface PackWithItems extends Pack {
  items: Item[];
}

export interface InventoryWithItem extends Inventory {
  item: Item;
}

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
