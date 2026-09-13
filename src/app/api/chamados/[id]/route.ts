import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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
    const body = await req.json();

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
