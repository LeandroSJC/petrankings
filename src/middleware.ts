import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { GATE_COOKIE_NAME, createGateToken, verifyGateToken } from '@/lib/gate';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'petrankings_editorial_jwt_secret_token_2026_super_secure'
);

const TOKEN_COOKIE_NAME = 'petrankings_admin_token';

/**
 * Next.js Edge Middleware de Segurança (appsec-data-shield & auth-security-guardian).
 * 
 * Implementa a Arquitetura de Portão Secreto (Stealth Gatekeeper):
 * 1. O painel administrativo (/admin) e a API de login (/api/auth/login) são camuflados com 404 (Not Found)
 *    para qualquer visitante, scanner ou bot que tente acessar diretamente.
 * 2. O acesso só é desbloqueado através de uma rota secreta não-convencional (ADMIN_SECRET_GATE_PATH)
 *    acompanhada da chave de acesso mestre (ADMIN_GATE_KEY).
 * 3. Uma vez validada a chave secreta, o navegador recebe o cookie assinado `petrankings_admin_gate` (7 dias)
 *    e é redirecionado de forma limpa para `/admin/login`.
 * 4. A autenticação normal por credenciais de usuário (e-mail + senha + JWT) só é acessível
 *    para navegadores que possuem o cookie do portão ativo.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Configurações do Portão Secreto e Ambiente
  const configuredGatePath = (process.env.ADMIN_SECRET_GATE_PATH || '/bastidores').trim();
  const gatePath = configuredGatePath.startsWith('/') ? configuredGatePath : `/${configuredGatePath}`;
  const gateKey = (process.env.ADMIN_GATE_KEY || 'petrankings_master_gate_2026_x9').trim();

  const isProduction = process.env.NODE_ENV === 'production';
  const allowAdminInProd = process.env.ALLOW_ADMIN_IN_PRODUCTION === 'true';

  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  const isGatePath = normalizedPath === gatePath.replace(/\/$/, '');
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAuthLoginApi = pathname === '/api/auth/login';

  // 1. Otimização de Performance: Se não for rota administrativa nem portão, passa direto
  if (!isGatePath && !isAdminPath && !isAuthLoginApi) {
    return NextResponse.next();
  }

  // 2. Chave Geral de Produção: Se em produção e ALLOW_ADMIN_IN_PRODUCTION != true, bloqueio total 404
  if (isProduction && !allowAdminInProd) {
    return NextResponse.rewrite(new URL('/_not-found', req.url));
  }

  // 3. Processamento do Portão Secreto (ADMIN_SECRET_GATE_PATH)
  if (isGatePath) {
    const keyParam =
      req.nextUrl.searchParams.get('key') ||
      req.nextUrl.searchParams.get('chave') ||
      req.nextUrl.searchParams.get('token') ||
      req.nextUrl.searchParams.get('pass');

    // Chave incorreta ou ausente: Retorna 404 para camuflar totalmente a existência da rota
    if (!keyParam || keyParam.trim() !== gateKey) {
      return NextResponse.rewrite(new URL('/_not-found', req.url));
    }

    // Chave correta: Gera token criptográfico do portão e redireciona para a tela de login
    const gateToken = await createGateToken();
    const loginUrl = new URL('/admin/login', req.url);
    const response = NextResponse.redirect(loginUrl);

    response.cookies.set({
      name: GATE_COOKIE_NAME,
      value: gateToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  }

  // 4. Verificação do Portão para rotas administrativas e API de login
  const gateCookie = req.cookies.get(GATE_COOKIE_NAME)?.value;
  const isGateUnlocked = await verifyGateToken(gateCookie);

  // Se o portão estiver trancado (sem cookie ou inválido): Camuflagem ativa (404 Not Found)
  if (!isGateUnlocked) {
    if (isAuthLoginApi) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    return NextResponse.rewrite(new URL('/_not-found', req.url));
  }

  // Se a rota for a API de login e o portão estiver aberto, permite prosseguir
  if (isAuthLoginApi) {
    return NextResponse.next();
  }

  // 5. Portão Desbloqueado: Gerenciamento da Sessão Administrativa (/admin/*)
  if (pathname === '/admin/login') {
    // Se o usuário já possuir sessão administrativa válida, redireciona para o painel
    const sessionToken = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
    if (sessionToken) {
      try {
        const { payload } = await jwtVerify(sessionToken, SECRET_KEY);
        if (payload.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', req.url));
        }
      } catch {
        // Token de sessão inválido, prossegue para exibição do formulário de login
      }
    }
    return NextResponse.next();
  }

  // Para qualquer outra página interna (/admin, /admin/rankings, /admin/produtos, etc.)
  const sessionToken = req.cookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!sessionToken) {
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(sessionToken, SECRET_KEY);
    if (payload.role !== 'admin') {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    // Token corrompido ou expirado -> redireciona para login e remove cookie de sessão
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(TOKEN_COOKIE_NAME);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Intercepta todas as requisições exceto arquivos estáticos e assets públicos.
     * Permite que rotas administrativas e rotas secretas personalizadas no .env
     * sejam capturadas com velocidade de execução no Edge Runtime.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|ads.txt|images|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
