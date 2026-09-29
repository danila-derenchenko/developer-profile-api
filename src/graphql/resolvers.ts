import { prisma } from '../database/prisma.js';

export const resolvers = {
  Query: {
    profile: () => prisma.profile.findFirst(),
  },
};
