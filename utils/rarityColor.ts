// utils/rarityColor.ts
export const rarityColor = (rarity: string): string => {
  switch (rarity.toUpperCase()) {
    case "COMMON":
      return "bg-gray-700/70 border-gray-500";
    case "RARE":
      return "bg-indigo-700/70 border-indigo-500";
    case "EPIC":
      return "bg-purple-700/70 border-purple-500";
    case "LEGENDARY":
      return "bg-yellow-800/70 border-yellow-500";
    case "MYTHIC":
      return "bg-red-800/70 border-red-500";
    default:
      return "bg-gray-700/70 border-gray-500";
  }
};
