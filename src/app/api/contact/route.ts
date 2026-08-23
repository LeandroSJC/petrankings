import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { validateContactAntispam } from '@/lib/antispam';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message, honeypot, formOpenedAt } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Informe um e-mail válido' }, { status: 400 });
    }

    // 1. Antispam em 3 camadas
    const antispamCheck = await validateContactAntispam({
      honeypot,
      formOpenedAt,
      email,
    });

    if (!antispamCheck.allowed) {
      if (antispamCheck.isSilentDrop) {
        // Honeypot: simular sucesso sem gravar no banco para não revelar a regra
        return NextResponse.json({
          success: true,
          message: 'Sua mensagem foi enviada com sucesso! Agradecemos o contato.',
        });
      }
      return NextResponse.json({ error: antispamCheck.reason }, { status: 400 });
    }

    // 2. Validações de conteúdo conforme Seção 4.6
    if (!name || name.trim().length < 2 || name.trim().length > 120) {
      return NextResponse.json(
        { error: 'O nome deve conter entre 2 e 120 caracteres' },
        { status: 400 }
      );
    }

    if (email.length > 320) {
      return NextResponse.json(
        { error: 'O e-mail deve ter no máximo 320 caracteres' },
        { status: 400 }
      );
    }

    if (subject && subject.length > 160) {
      return NextResponse.json(
        { error: 'O assunto pode ter no máximo 160 caracteres' },
        { status: 400 }
      );
    }

    if (!message || message.trim().length < 10 || message.trim().length > 5000) {
      return NextResponse.json(
        { error: 'A mensagem deve conter entre 10 e 5.000 caracteres' },
        { status: 400 }
      );
    }

    const savedMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject ? subject.trim() : null,
        message: message.trim(),
        status: 'nova',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sua mensagem foi enviada com sucesso! Nossa equipe entrará em contato se necessário.',
      id: savedMessage.id,
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de contato:', error);
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'todas' | 'nova' | 'lida' | 'arquivada'

    const where: Record<string, string> = {};
    if (status && status !== 'todas') {
      where.status = status;
    }

    const messages = await prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Contadores por status
    const totalCount = await prisma.contactMessage.count();
    const newCount = await prisma.contactMessage.count({ where: { status: 'nova' } });
    const readCount = await prisma.contactMessage.count({ where: { status: 'lida' } });
    const archivedCount = await prisma.contactMessage.count({ where: { status: 'arquivada' } });

    return NextResponse.json({
      messages,
      counts: {
        total: totalCount,
        nova: newCount,
        lida: readCount,
        arquivada: archivedCount,
      },
    });
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    return NextResponse.json({ error: 'Erro ao listar mensagens' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !['nova', 'lida', 'arquivada'].includes(status)) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (error) {
    console.error('Erro ao atualizar status da mensagem:', error);
    return NextResponse.json({ error: 'Erro ao atualizar mensagem' }, { status: 500 });
  }
}
