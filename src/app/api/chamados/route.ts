import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'curador')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'todos') {
      where.status = status;
    }

    const tickets = await prisma.manufacturerTicket.findMany({
      where,
      orderBy: [{ slaDeadline: 'asc' }],
      include: {
        product: {
          select: {
            id: true,
            commercialName: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Erro ao listar chamados:', error);
    return NextResponse.json({ error: 'Erro ao listar chamados' }, { status: 500 });
  }
}
