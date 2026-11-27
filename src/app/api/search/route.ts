import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { searchRateLimiter, getClientIp } from '@/lib/rate-limit';

function normalizeTerm(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

interface SearchProductRow {
  id: string;
  slug: string;
  commercialName: string;
  brand: string;
  species: string;
  lifeStage: string;
  foodType: string;
  scoreTotal: number | null;
  classificationTier: string;
  frontLabelImageUrl: string | null;
  legalCategory: string;
  coadjuvanteCondition: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const ipCheck = searchRateLimiter.limit(clientIp);
    if (!ipCheck.success) {
      return NextResponse.json(
        { error: 'Muitas buscas consecutivas. Por favor, aguarde alguns instantes.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get('q')?.trim() || '';
    const query = rawQuery.slice(0, 100);
    const speciesParam = searchParams.get('species')?.trim().toUpperCase();
    const validSpecies = speciesParam === 'CAO' || speciesParam === 'GATO' ? speciesParam : null;
    const limitParam = parseInt(searchParams.get('limit') || '8', 10);
    const limit = Math.min(Math.max(isNaN(limitParam) ? 8 : limitParam, 1), 20);

    if (!query || query.length < 2) {
      return NextResponse.json({ products: [], categories: [] });
    }

    const normalized = normalizeTerm(query);

    // Categorias padrão sugeridas (comparação tolerante a acentos)
    const allCategories = [
      { slug: 'caes-adultos', label: 'Índice Cães Adultos — Alimentos Secos', keywords: ['cao', 'caes', 'adulto', 'adultos'] },
      { slug: 'caes-filhotes', label: 'Índice Cães Filhotes — Alimentos Secos', keywords: ['filhote', 'filhotes', 'puppy', 'crescimento'] },
      { slug: 'gatos-adultos', label: 'Índice Gatos Adultos — Alimentos Secos', keywords: ['gato', 'gatos', 'felino', 'castrado'] },
      { slug: 'gatos-filhotes', label: 'Índice Gatos Filhotes — Alimentos Secos', keywords: ['kitten', 'filhote de gato', 'gatinho'] },
      { slug: 'coadjuvantes', label: 'Catálogo de Alimentos Coadjuvantes', keywords: ['renal', 'urinario', 'obesidade', 'clinico', 'veterinaria'] },
    ];

    const matchedCategories = allCategories.filter((cat) =>
      cat.keywords.some((kw) => normalized.includes(kw))
    );

    let products: SearchProductRow[] = [];

    // Busca tolerante a acentos e pequenos erros de digitação (PostgreSQL unaccent + pg_trgm)
    try {
      const likePattern = `%${normalized}%`;
      const speciesClause = validSpecies
        ? Prisma.sql`AND "species" = ${validSpecies}`
        : Prisma.empty;

      products = await prisma.$queryRaw<SearchProductRow[]>`
        SELECT
          "id",
          "slug",
          "commercialName",
          "brand",
          "species",
          "lifeStage",
          "foodType",
          "scoreTotal",
          "classificationTier",
          "frontLabelImageUrl",
          "legalCategory",
          "coadjuvanteCondition"
        FROM "Product"
        WHERE "isPublished" = true
          ${speciesClause}
          AND (
            unaccent(lower("commercialName")) LIKE ${likePattern}
            OR unaccent(lower("brand")) LIKE ${likePattern}
            OR unaccent(lower("manufacturerLegalName")) LIKE ${likePattern}
            OR similarity(unaccent(lower("commercialName")), ${normalized}) > 0.25
            OR similarity(unaccent(lower("brand")), ${normalized}) > 0.35
          )
        ORDER BY
          CASE
            WHEN unaccent(lower("commercialName")) LIKE ${likePattern} THEN 0
            WHEN unaccent(lower("brand")) LIKE ${likePattern} THEN 1
            ELSE 2
          END,
          GREATEST(
            similarity(unaccent(lower("commercialName")), ${normalized}),
            similarity(unaccent(lower("brand")), ${normalized})
          ) DESC,
          "scoreTotal" DESC NULLS LAST
        LIMIT ${limit}
      `;
    } catch {
      // Fallback seguro caso as extensões unaccent/pg_trgm não estejam habilitadas no ambiente
      products = await prisma.product.findMany({
        where: {
          isPublished: true,
          ...(validSpecies ? { species: validSpecies } : {}),
          OR: [
            { commercialName: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } },
            { manufacturerLegalName: { contains: query, mode: 'insensitive' } },
            { sourceUrl: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          slug: true,
          commercialName: true,
          brand: true,
          species: true,
          lifeStage: true,
          foodType: true,
          scoreTotal: true,
          classificationTier: true,
          frontLabelImageUrl: true,
          legalCategory: true,
          coadjuvanteCondition: true,
        },
        take: limit,
        orderBy: { scoreTotal: 'desc' },
      });
    }

    return NextResponse.json({
      products,
      categories: matchedCategories,
    });
  } catch (error) {
    console.error('Erro na busca de produtos analisados:', error);
    return NextResponse.json({ products: [], categories: [] }, { status: 500 });
  }
}
