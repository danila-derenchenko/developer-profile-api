import 'dotenv/config';
import { createPrismaClient } from '../src/database/create-prisma-client.js';
import { seedProfile } from './seed-profile.js';

const prisma = createPrismaClient();
try {
  await seedProfile(prisma);
  console.log('Profile data synchronized.');
} finally {
  await prisma.$disconnect();
}
