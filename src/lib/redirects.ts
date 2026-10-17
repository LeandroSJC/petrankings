import prisma from '@/lib/prisma';

/**
 * Busca se um slug antigo possui um redirecionamento 301 permanente cadastrado.
 * Utiliza $queryRawUnsafe para máxima resiliência e independência de runtime.
 */
export async function findProductRedirect(sourceSlug: string): Promise<string | null> {
  if (!sourceSlug) return null;
  try {
    let decoded = sourceSlug.trim();
    try {
      decoded = decodeURIComponent(decoded);
    } catch {}

    const normalized = decoded.toLowerCase();
    const plusVariant = normalized.replace(/\+/g, '-plus-').replace(/-+/g, '-');

    const rows = await prisma.$queryRawUnsafe<{ targetSlug: string }[]>(
      'SELECT "targetSlug" FROM "ProductRedirect" WHERE LOWER("sourceSlug") = LOWER($1) OR LOWER("sourceSlug") = LOWER($2) OR LOWER("sourceSlug") = LOWER($3) LIMIT 1',
      sourceSlug.trim().toLowerCase(),
      normalized,
      plusVariant
    );
    return rows[0]?.targetSlug || null;
  } catch (err) {
    console.error('[redirects] Erro ao buscar redirecionamento:', err);
    return null;
  }
}
