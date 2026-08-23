import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Habilitando Row Level Security (RLS) nas tabelas ---');

  const tables = [
    'User',
    'Ranking',
    'Product',
    'ProductStore',
    'RankingProduct',
    'ContactMessage',
    'ContactRateLimit',
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`✓ RLS ativado com sucesso para: public."${table}"`);
    } catch (err) {
      console.error(`Erro ao ativar RLS na tabela ${table}:`, err);
    }
  }

  console.log('--- Todas as tabelas agora estão protegidas com RLS! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
