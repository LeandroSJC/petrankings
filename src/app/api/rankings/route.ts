import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const species = searchParams.get('species');
    const productType = searchParams.get('productType');
    const includeAll = searchParams.get('all') === 'true';

    const session = await getSession();
    const isAdmin = session?.role === 'admin';

    // Apenas admins podem ver rascunhos / não publicados
    const isPublishedFilter = includeAll && isAdmin ? {} : { isPublished: true };

    const where: Record<string, unknown> = {
      ...isPublishedFilter,
    };

    if (species && species !== 'todos') {
      where.species = species;
    }

    if (productType && productType !== 'todos') {
      where.productType = productType;
    }

    const rankings = await prisma.ranking.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [
        { isPublished: 'desc' },
        { dataUpdatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ rankings });
  } catch (error) {
    console.error('Erro ao listar rankings:', error);
    return NextResponse.json({ error: 'Erro ao listar rankings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const body = await req.json();
    const { title, species, productType, description, isPublished } = body;

    // Validações conforme seção 4.2 e 7.1
    if (!title || title.trim().length < 3 || title.trim().length > 180) {
      return NextResponse.json(
        { error: 'O título deve conter entre 3 e 180 caracteres' },
        { status: 400 }
      );
    }

    if (!species || !['caes', 'gatos'].includes(species)) {
      return NextResponse.json(
        { error: 'A espécie deve ser "caes" ou "gatos"' },
        { status: 400 }
      );
    }

    if (!productType || productType.trim().length < 2 || productType.trim().length > 120) {
      return NextResponse.json(
        { error: 'O tipo de produto deve conter entre 2 e 120 caracteres' },
        { status: 400 }
      );
    }

    if (description && description.length > 3000) {
      return NextResponse.json(
        { error: 'A descrição pode ter no máximo 3.000 caracteres' },
        { status: 400 }
      );
    }

    // Gerar slug amigável
    let baseSlug = slugify(title);
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await prisma.ranking.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const ranking = await prisma.ranking.create({
      data: {
        title: title.trim(),
        slug: uniqueSlug,
        species,
        productType: productType.trim(),
        description: description ? description.trim() : null,
        isPublished: Boolean(isPublished),
        dataUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, ranking });
  } catch (error) {
    console.error('Erro ao criar ranking:', error);
    return NextResponse.json({ error: 'Erro ao criar ranking' }, { status: 500 });
  }
}
