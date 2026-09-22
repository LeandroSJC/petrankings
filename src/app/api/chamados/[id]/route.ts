import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { updateTicketSchema } from '@/lib/schemas/ticket';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'curador')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    const parsed = updateTicketSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Status ou campos inválidos.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const body = parsed.data;

    const ticket = await prisma.manufacturerTicket.update({
      where: { id },
      data: {
        status: body.status,
        internalNotes: body.internalNotes,
        resolvedAt: body.status === 'DEFERIDO' || body.status === 'INDEFERIDO' ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Erro ao atualizar chamado:', error);
    return NextResponse.json({ error: 'Erro ao atualizar chamado' }, { status: 500 });
  }
}
