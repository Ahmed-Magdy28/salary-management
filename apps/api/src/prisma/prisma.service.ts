import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { createPrismaClient, type PrismaClient } from "@salary/db";

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client: PrismaClient = createPrismaClient(process.env.DATABASE_URL);

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
