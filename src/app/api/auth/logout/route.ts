import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE_NAME, GATE_COOKIE_NAME } from '@/lib/auth';

/**
 * Endpoint de encerramento de sessão administrativa.
 * Suporta o parâmetro `lockGate=true` para trancar também o Portão Secreto
 * e reativar a camuflagem 404 imediatamente neste navegador.
 */
export async function POST(req: NextRequest) {
  let lockGate = req.nextUrl.searchParams.get('lockGate') === 'true';

  // Também aceita via JSON body opcional
  try {
    const body = await req.json();
    if (body && body.lockGate === true) {
      lockGate = true;
    }
  } catch {
    // Corpo vazio ou inexistente é aceito normalmente
  }

  const response = NextResponse.json({
    success: true,
    gateLocked: lockGate,
    message: lockGate
      ? 'Sessão encerrada e portão secreto trancado (camuflagem 404 reativada).'
      : 'Sessão encerrada com sucesso.',
  });

  // Limpa o cookie de sessão do usuário
  response.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  // Se lockGate for solicitado, apaga também o cookie do portão secreto
  if (lockGate) {
    response.cookies.set({
      name: GATE_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }

  return response;
}
