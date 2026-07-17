import { z } from "zod";

export const ItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  rarity: z.string(),
  value: z.number(),
  chance: z.number(),
  image: z.string(),
  packId: z.string().uuid()
});

export const validateItem = (data: any) => ItemSchema.parse(data);