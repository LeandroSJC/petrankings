import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fabricanteTicketSchema } from '@/lib/schemas/fabricante';
import { fabricanteRateLimiter, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting por IP (defesa contra inundação de tickets)
    const clientIp = getClientIp(req);
    const ipCheck = fabricanteRateLimiter.limit(clientIp);
    if (!ipCheck.success) {
      return NextResponse.json(
        {
          error: `Muitas solicitações enviadas a partir desta conexão. Por favor, aguarde ${ipCheck.retryAfterSeconds}s antes de enviar nova solicitação.`,
        },
        { status: 429 }
      );
    }

    // 2. Validação de Schema com Zod
    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    const parsed = fabricanteTicketSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Dados inválidos na solicitação institucional.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      companyName,
      cnpj,
      mapaRegistration,
      requesterName,
      requesterRole,
      requesterEmail,
      requesterPhone,
      requestType,
      batchNumber,
      message,
      documentUrl,
      productSlug,
    } = parsed.data;

    // Buscar produto se informado o slug
    let productId: string | undefined = undefined;
    if (productSlug) {
      const prod = await prisma.product.findUnique({
        where: { slug: productSlug },
        select: { id: true },
      });
      if (prod) productId = prod.id;
    }

    // Gerar número de protocolo único sequencial
    const count = await prisma.manufacturerTicket.count();
    const ticketNumber = `PR-FAB-2026-${String(count + 1).padStart(4, '0')}`;

    // SLA: 5 dias úteis (7 dias corridos)
    const slaDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const ticket = await prisma.manufacturerTicket.create({
      data: {
        ticketNumber,
        productId,
        companyName,
        cnpj: cnpj || null,
        mapaRegistration: mapaRegistration || null,
        requesterName,
        requesterRole,
        requesterEmail,
        requesterPhone,
        requestType: requestType || 'ATUALIZACAO_LOTE',
        batchNumber,
        message,
        documentUrl,
        slaDeadline,
        status: 'ABERTO',
      },
    });

    return NextResponse.json({
      success: true,
      ticketNumber: ticket.ticketNumber,
      slaDeadline: ticket.slaDeadline.toISOString(),
      message: 'Solicitação registrada com sucesso. Prazo de resposta: até 5 dias úteis.',
    });
  } catch (error) {
    console.error('Erro ao abrir chamado do fabricante:', error);
    return NextResponse.json(
      { error: 'Falha interna ao registrar solicitação institucional.' },
      { status: 500 }
    );
  }
}
