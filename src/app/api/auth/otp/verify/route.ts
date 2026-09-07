import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { createSessionToken, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { GATE_COOKIE_NAME, verifyGateToken } from '@/lib/gate';

export async function POST(req: NextRequest) {
  try {
    // 1. Verificação do Portão Secreto (Camuflagem Ativa)
    const gateCookie = req.cookies.get(GATE_COOKIE_NAME)?.value;
    const isGateUnlocked = await verifyGateToken(gateCookie);

    if (!isGateUnlocked) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'E-mail e código de acesso são obrigatórios.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const sanitizedCode = code.toString().replace(/\D/g, '').trim();

    if (sanitizedCode.length !== 6) {
      return NextResponse.json(
        { error: 'O código deve conter exatamente 6 dígitos numéricos.' },
        { status: 400 }
      );
    }

    // 2. Busca o usuário administrador correspondente
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores autorizados.' },
        { status: 403 }
      );
    }

    // 3. Busca o código ativo mais recente não utilizado
    const activeOtp = await prisma.adminOtp.findFirst({
      where: {
        email: normalizedEmail,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeOtp) {
      return NextResponse.json(
        { error: 'Nenhum código ativo encontrado para este e-mail. Solicite um novo.' },
        { status: 400 }
      );
    }

    // 4. Verificação de Expiração (10 minutos)
    if (new Date() > activeOtp.expiresAt) {
      await prisma.adminOtp.update({
        where: { id: activeOtp.id },
        data: { usedAt: new Date() },
      });
      return NextResponse.json(
        { error: 'O código de acesso expirou. Solicite um novo código.' },
        { status: 400 }
      );
    }

    // 5. Verificação de Limite de Tentativas Incorretas (máximo 5)
    if (activeOtp.attempts >= 5) {
      await prisma.adminOtp.update({
        where: { id: activeOtp.id },
        data: { usedAt: new Date() },
      });
      return NextResponse.json(
        { error: 'Limite de tentativas excedido para este código. Solicite um novo.' },
        { status: 400 }
      );
    }

    // 6. Comparação Criptográfica do Código
    const isValid = await bcrypt.compare(sanitizedCode, activeOtp.codeHash);

    if (!isValid) {
      const nextAttempts = activeOtp.attempts + 1;
      await prisma.adminOtp.update({
        where: { id: activeOtp.id },
        data: { attempts: nextAttempts },
      });

      const remaining = 5 - nextAttempts;
      return NextResponse.json(
        {
          error: remaining > 0
            ? `Código incorreto. Você tem mais ${remaining} tentativa(s).`
            : 'Limite de tentativas atingido. Solicite um novo código.',
        },
        { status: 400 }
      );
    }

    // 7. Código Válido: Invalida o OTP (uso único) e atualiza último acesso
    await prisma.adminOtp.update({
      where: { id: activeOtp.id },
      data: { usedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 8. Emite o Token de Sessão JWT (7 dias)
    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // 9. Configura o cookie HTTP-Only seguro
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (error) {
    console.error('Erro na rota verify-otp:', error);
    return NextResponse.json(
      { error: 'Erro interno ao validar código de acesso.' },
      { status: 500 }
    );
  }
}
