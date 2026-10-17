import prisma from '@/lib/prisma';

/**
 * Busca se um slug antigo possui um redirecionamento 301 permanente cadastrado.
 * Utiliza $queryRawUnsafe para máxima resiliência e independência de runtime.
 */
export async function findProductRedirect(sourceSlug: string): Promise<string | null> {
  if (!sourceSlug) return null;
  try {
    const normalized = sourceSlug.trim().toLowerCase();
    const rows = await prisma.$queryRawUnsafe<{ targetSlug: string }[]>(
      'SELECT "targetSlug" FROM "ProductRedirect" WHERE LOWER("sourceSlug") = LOWER($1) LIMIT 1',
      normalized
    );
    return rows[0]?.targetSlug || null;
  } catch (err) {
    console.error('[redirects] Erro ao buscar redirecionamento:', err);
    return null;
  }
}
