import { v4 as uuidv4 } from "uuid";

interface QueryResult {
  query: (sql: string, params: unknown[]) => Promise<void>;
}

export class InventoryService {
  constructor(private client: QueryResult) {}

  async distribute(userIds: string[], itemIds: string[]) {
    for (const userId of userIds) {
      const count = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < count; i++) {
        const itemId = itemIds[Math.floor(Math.random() * itemIds.length)];
        await this.client.query(
          'INSERT INTO "Inventory" (id, "userId", "itemId", "acquiredAt") VALUES ($1, $2, $3, $4)',
          [uuidv4(), userId, itemId, new Date()]
        );
      }
    }
  }
}