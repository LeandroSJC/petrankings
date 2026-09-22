import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { validateContactAntispam } from '@/lib/antispam';
import { contactMessageSchema } from '@/lib/schemas/contact';
import { contactRateLimiter, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting por IP (defesa contra DoS e inundação de banco)
    const clientIp = getClientIp(req);
    const ipCheck = contactRateLimiter.limit(clientIp);
    if (!ipCheck.success) {
      return NextResponse.json(
        {
          error: `Muitas mensagens enviadas a partir desta conexão. Aguarde ${ipCheck.retryAfterSeconds}s antes de tentar novamente.`,
        },
        { status: 429 }
      );
    }

    // 2. Validação rigorosa com Zod
    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    const parsed = contactMessageSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Dados de contato inválidos.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, subject, message, honeypot, formOpenedAt } = parsed.data;

    // 3. Antispam em 3 camadas (Honeypot, Trava Temporal, Limite por e-mail)
    const antispamCheck = await validateContactAntispam({
      honeypot,
      formOpenedAt,
      email,
    });

    if (!antispamCheck.allowed) {
      if (antispamCheck.isSilentDrop) {
        // Honeypot: simular sucesso sem gravar no banco para não revelar a armadilha
        return NextResponse.json({
          success: true,
          message: 'Sua mensagem foi enviada com sucesso! Agradecemos o contato.',
        });
      }
      return NextResponse.json({ error: antispamCheck.reason }, { status: 400 });
    }

    const savedMessage = await prisma.contactMessage.create({
      data: {
        name,
        email: email.toLowerCase(),
        subject: subject || null,
        message,
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
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
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
