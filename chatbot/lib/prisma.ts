// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // Use globalThis to avoid multiple PrismaClient instances in development
  // https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-with-prismaclient-issues 
  var prisma: PrismaClient | undefined;
}

const prismaClient = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prismaClient;
}

export default prismaClient;