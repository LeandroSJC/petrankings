import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { fetchAllAdSlots, ensureDefaultAdSlots } from '@/lib/ads';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const slots = await fetchAllAdSlots();
    return NextResponse.json({ success: true, slots });
  } catch (error) {
    console.error('Erro ao buscar slots de publicidade:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações de publicidade' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const body = await req.json();
    const { slots } = body;

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: 'Formato inválido. Esperado um array de slots.' }, { status: 400 });
    }

    await ensureDefaultAdSlots();

    // Atualizar cada slot no banco de dados
    for (const item of slots) {
      if (!item.slotKey) continue;

      await prisma.adSlot.upsert({
        where: { slotKey: item.slotKey },
        update: {
          name: item.name !== undefined ? String(item.name).trim() : undefined,
          description: item.description !== undefined ? String(item.description).trim() : undefined,
          code: item.code !== undefined ? String(item.code) : '',
          isActive: Boolean(item.isActive),
        },
        create: {
          slotKey: item.slotKey,
          name: item.name ? String(item.name).trim() : item.slotKey,
          description: item.description ? String(item.description).trim() : null,
          code: item.code ? String(item.code) : '',
          isActive: Boolean(item.isActive),
        },
      });
    }

    // Invalidação agressiva de cache para refletir as alterações instantaneamente
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/', 'page');
      revalidatePath('/ranking/[slug]', 'page');
      revalidatePath('/sobre', 'page');
    } catch (e) {
      console.warn('Aviso de revalidação de cache:', e);
    }

    const updatedSlots = await fetchAllAdSlots();

    return NextResponse.json({
      success: true,
      message: 'Configurações de publicidade salvas com sucesso!',
      slots: updatedSlots,
    });
  } catch (error) {
    console.error('Erro ao salvar slots de publicidade:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar configurações de publicidade' }, { status: 500 });
  }
}
