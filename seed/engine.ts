import { v4 as uuidv4 } from "uuid";
import { TIER_CONFIG } from "./config";
import { getRandom } from "./utils";

export const generateItem = (tierKey: string, packId: string, index: number) => {
  const tier = TIER_CONFIG[tierKey as keyof typeof TIER_CONFIG];
  const prefix = getRandom([...tier.prefixes]);
  const suffix = getRandom([...tier.suffixes]);
  const name = `${prefix} ${suffix} #${index}`;
  return {
    id: uuidv4(),
    name,
    rarity: tierKey,
    value: tier.baseVal,
    chance: tier.chance,
    image: name.toUpperCase().replace(/\s/g, "_"),
    packId
  };
};

