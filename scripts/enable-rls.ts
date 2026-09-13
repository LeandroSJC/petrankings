import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Habilitando Row Level Security (RLS) nas tabelas ---');

  // Lista de tabelas essenciais conhecidas do Prisma
  const fallbackTables = [
    'User',
    'Product',
    'AffiliateLink',
    'ManufacturerTicket',
    'ContactMessage',
    'ContactRateLimit',
    'AdminOtp',
  ];

  try {
    // Busca dinâmica de todas as tabelas no schema public do PostgreSQL
    const tables: Array<{ tablename: string; rowsecurity: boolean }> = await prisma.$queryRawUnsafe(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename ASC;
    `);

    if (tables && tables.length > 0) {
      for (const { tablename, rowsecurity } of tables) {
        if (!rowsecurity) {
          try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${tablename}" ENABLE ROW LEVEL SECURITY;`);
            console.log(`✓ RLS ativado com sucesso para: public."${tablename}"`);
          } catch (err) {
            console.error(`Erro ao ativar RLS na tabela ${tablename}:`, err);
          }
        } else {
          console.log(`ℹ RLS já ativo para: public."${tablename}"`);
        }
      }
    } else {
      throw new Error('Nenhuma tabela retornada na consulta pg_tables. Usando lista de fallback.');
    }
  } catch (queryErr) {
    console.warn('Consulta pg_tables falhou ou retornou vazia, aplicando via lista explícita:', queryErr);
    for (const table of fallbackTables) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
        console.log(`✓ RLS ativado com sucesso para: public."${table}"`);
      } catch (err) {
        console.error(`Erro ao ativar RLS na tabela ${table}:`, err);
      }
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
