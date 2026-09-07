import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email';
import { GATE_COOKIE_NAME, verifyGateToken } from '@/lib/gate';

export async function POST(req: NextRequest) {
  try {
    // 1. Verificação do Portão Secreto (Camuflagem Ativa)
    const gateCookie = req.cookies.get(GATE_COOKIE_NAME)?.value;
    const isGateUnlocked = await verifyGateToken(gateCookie);

    if (!isGateUnlocked) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'E-mail administrativo é obrigatório.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Validação se o usuário existe e é administrador
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'E-mail não encontrado ou sem permissão de administrador.' },
        { status: 403 }
      );
    }

    // 3. Rate Limit Anti-Abuso (Máximo de 3 pedidos em 10 minutos)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentRequestsCount = await prisma.adminOtp.count({
      where: {
        email: normalizedEmail,
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (recentRequestsCount >= 3) {
      return NextResponse.json(
        { error: 'Limite de solicitações atingido. Aguarde 10 minutos antes de pedir um novo código.' },
        { status: 429 }
      );
    }

    // 4. Cooldown de 45 segundos entre disparos consecutivos
    const latestOtp = await prisma.adminOtp.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp) {
      const secondsSinceLast = (Date.now() - latestOtp.createdAt.getTime()) / 1000;
      if (secondsSinceLast < 45) {
        const remaining = Math.ceil(45 - secondsSinceLast);
        return NextResponse.json(
          { error: `Aguarde ${remaining}s antes de solicitar um novo código.` },
          { status: 429 }
        );
      }
    }

    // 5. Invalida códigos pendentes anteriores para este e-mail
    await prisma.adminOtp.updateMany({
      where: {
        email: normalizedEmail,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // 6. Geração de código criptográfico de 6 dígitos
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // 7. Salva o hash do código no banco
    await prisma.adminOtp.create({
      data: {
        email: normalizedEmail,
        codeHash,
        expiresAt,
      },
    });

    // 8. Dispara o e-mail com Resend (ou console fallback)
    const emailResult = await sendOtpEmail({
      to: normalizedEmail,
      code,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Falha ao enviar e-mail de verificação.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Código de acesso enviado com sucesso.',
    });
  } catch (error) {
    console.error('Erro na rota request-otp:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar solicitação de código.' },
      { status: 500 }
    );
  }
}
