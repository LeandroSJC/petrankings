import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { rankings } = body;

    if (!Array.isArray(rankings) || rankings.length === 0) {
      return NextResponse.json({ error: 'Nenhum ranking enviado para importação' }, { status: 400 });
    }

    if (rankings.length > 200) {
      return NextResponse.json({ error: 'O limite máximo por lote é de 200 rankings.' }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rankings.length; i++) {
      const item = rankings[i];
      const rowNum = i + 1;

      try {
        const title = (item.titulo || item.title || '').trim();
        const rawSpecies = (item.especie || item.species || '').trim().toLowerCase();
        const species = rawSpecies === 'gatos' || rawSpecies === 'gato' || rawSpecies === 'cat' ? 'gatos' : 'caes';
        const productType = (item.tipo_produto || item.productType || item.tipo || '').trim();
        const description = (item.descricao || item.description || '').trim() || null;
        const id = (item.id || '').trim();
        let slug = (item.slug || '').trim();

        if (!title || title.length < 3) {
          errors.push(`Linha ${rowNum}: O título do ranking é obrigatório e deve ter no mínimo 3 caracteres.`);
          continue;
        }

        if (!productType || productType.length < 2) {
          errors.push(`Linha ${rowNum} (${title}): O tipo de produto é obrigatório.`);
          continue;
        }

        if (!slug) {
          slug = slugify(title);
        }

        const isPublished = item.publicado !== undefined ? String(item.publicado).toLowerCase() === 'true' || item.publicado === true || item.publicado === '1' : true;

        // Buscar se já existe por ID ou por Slug
        let existing = null;
        if (id) {
          existing = await prisma.ranking.findUnique({ where: { id } });
        }
        if (!existing) {
          existing = await prisma.ranking.findUnique({ where: { slug } });
        }

        if (existing) {
          await prisma.ranking.update({
            where: { id: existing.id },
            data: {
              title,
              species,
              productType,
              description,
              isPublished,
            },
          });
          updatedCount++;
        } else {
          await prisma.ranking.create({
            data: {
              slug,
              title,
              species,
              productType,
              description,
              isPublished,
            },
          });
          createdCount++;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        errors.push(`Linha ${rowNum}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: true,
      total: rankings.length,
      created: createdCount,
      updated: updatedCount,
      errors,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro ao processar importação';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
