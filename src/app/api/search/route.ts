import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ products: [], categories: [] });
    }

    const lower = query.toLowerCase();

    // Categorias padrão sugeridas se bater com o termo
    const allCategories = [
      { slug: 'caes-adultos', label: 'Índice Cães Adultos — Alimentos Secos', keywords: ['cão', 'cao', 'caes', 'cães', 'adulto', 'adultos'] },
      { slug: 'caes-filhotes', label: 'Índice Cães Filhotes — Alimentos Secos', keywords: ['filhote', 'filhotes', 'puppy', 'crescimento'] },
      { slug: 'gatos-adultos', label: 'Índice Gatos Adultos — Alimentos Secos', keywords: ['gato', 'gatos', 'felino', 'castrado'] },
      { slug: 'gatos-filhotes', label: 'Índice Gatos Filhotes — Alimentos Secos', keywords: ['kitten', 'filhote de gato', 'gatinho'] },
      { slug: 'coadjuvantes', label: 'Catálogo de Alimentos Coadjuvantes', keywords: ['renal', 'urinario', 'urinário', 'obesidade', 'clinico', 'clínico', 'veterinaria', 'veterinária'] },
    ];

    const matchedCategories = allCategories.filter((cat) =>
      cat.keywords.some((kw) => lower.includes(kw))
    );

    // Busca de produtos auditados no PostgreSQL
    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
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
        scoreTotal: true,
        classificationTier: true,
        frontLabelImageUrl: true,
        legalCategory: true,
        coadjuvanteCondition: true,
      },
      take: 8,
      orderBy: { scoreTotal: 'desc' },
    });

    return NextResponse.json({
      products,
      categories: matchedCategories,
    });
  } catch (error) {
    console.error('Erro na busca de produtos auditados:', error);
    return NextResponse.json({ products: [], categories: [] }, { status: 500 });
  }
}
