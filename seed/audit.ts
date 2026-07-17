import { PrismaClient } from "@prisma/client";

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  async runFullAudit() {
    const item = await this.prisma.item.count();
    console.log(`[AUDIT] Items in database: ${item}`);
  }
}