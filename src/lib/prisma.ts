import { PrismaClient } from '@prisma/client';

function getNormalizedDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;
  try {
    const url = new URL(rawUrl);
    // Se for host do pooler da Supabase (Supavisor)
    if (url.hostname.includes('pooler.supabase.com')) {
      // Porta 5432 é Session Mode (máx 15 conexões). Porta 6543 é Transaction Mode (pool compartilhado)
      if (url.port === '5432') {
        url.port = '6543';
      }
      if (!url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true');
      }
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '1');
      }
    } else {
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '3');
      }
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const databaseUrl = getNormalizedDatabaseUrl();

if (databaseUrl && process.env.DATABASE_URL !== databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: databaseUrl
      ? {
          db: {
            url: databaseUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
