import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
    } = body;

    // Validações obrigatórias
    if (!companyName || !requesterName || !requesterRole || !requesterEmail || !message) {
      return NextResponse.json(
        { error: 'Por favor, preencha os dados de identificação e a mensagem.' },
        { status: 400 }
      );
    }

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
