import { Injectable } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createPrismaClient } from './create-prisma-client.js';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client = createPrismaClient();

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
