import { PrismaPg } from '@prisma/adapter-pg';
import { attachDatabasePool } from '@vercel/functions';
import { Pool } from 'pg';
import { PrismaClient } from '../../prisma/client/client.js';

export function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString?.trim()) {
    throw new Error('DATABASE_URL is required. See .env.example.');
  }
  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });
  if (process.env.VERCEL === '1') {
    attachDatabasePool(pool);
  }
  return new PrismaClient({
    adapter: new PrismaPg(pool, { disposeExternalPool: true }),
  });
}
