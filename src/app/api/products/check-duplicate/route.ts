import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'curador')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawName = searchParams.get('name')?.trim() || '';
    const rawSlug = searchParams.get('slug')?.trim() || '';
    const excludeId = searchParams.get('excludeId')?.trim() || '';

    if (!rawName && !rawSlug) {
      return NextResponse.json({
        isDuplicate: false,
        exactMatch: null,
        similar: [],
      });
    }

    const computedSlug = rawSlug ? generateSlug(rawSlug) : generateSlug(rawName);

    // 1. Checagem de correspondência exata por slug
    let exactMatch = await prisma.product.findFirst({
      where: {
        slug: computedSlug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: {
        id: true,
        commercialName: true,
        brand: true,
        slug: true,
        classificationTier: true,
        scoreTotal: true,
        legalCategory: true,
        species: true,
        frontLabelImageUrl: true,
      },
    });

    // 2. Se não bateu pelo slug, checa correspondência exata pelo nome comercial (case-insensitive)
    if (!exactMatch && rawName) {
      exactMatch = await prisma.product.findFirst({
        where: {
          commercialName: { equals: rawName, mode: 'insensitive' },
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: {
          id: true,
          commercialName: true,
          brand: true,
          slug: true,
          classificationTier: true,
          scoreTotal: true,
          legalCategory: true,
          species: true,
          frontLabelImageUrl: true,
        },
      });
    }

    // 3. Busca de produtos similares com título parecido para alertar variações
    let similar: any[] = [];
    if (rawName.length >= 4) {
      // Pega palavras-chave significativas para buscar semelhanças
      const keywords = rawName
        .split(/\s+/)
        .filter((w) => w.length >= 4)
        .slice(0, 3);

      const whereOr: any[] = [
        { commercialName: { contains: rawName, mode: 'insensitive' } },
      ];

      for (const kw of keywords) {
        whereOr.push({ commercialName: { contains: kw, mode: 'insensitive' } });
      }

      const similarCandidates = await prisma.product.findMany({
        where: {
          OR: whereOr,
          ...(excludeId ? { id: { not: excludeId } } : {}),
          ...(exactMatch ? { id: { not: exactMatch.id } } : {}),
        },
        take: 4,
        select: {
          id: true,
          commercialName: true,
          brand: true,
          slug: true,
          classificationTier: true,
          scoreTotal: true,
          legalCategory: true,
          species: true,
          frontLabelImageUrl: true,
        },
      });

      similar = similarCandidates;
    }

    return NextResponse.json({
      isDuplicate: !!exactMatch,
      exactMatch,
      similar,
      computedSlug,
    });
  } catch (error) {
    console.error('Erro ao verificar duplicidade de produto:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar duplicidade de produto' },
      { status: 500 }
    );
  }
}
