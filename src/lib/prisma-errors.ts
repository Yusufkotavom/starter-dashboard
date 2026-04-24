import { Prisma } from '@/lib/prisma-client';

export function isPrismaTableMissingError(error: unknown, tableName?: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== 'P2021') {
    return false;
  }

  if (!tableName) {
    return true;
  }

  const table = error.meta?.table;
  return typeof table === 'string' && table.includes(tableName);
}
