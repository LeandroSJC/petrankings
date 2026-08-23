import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'petrankings_editorial_jwt_secret_token_2026_super_secure'
);

const TOKEN_COOKIE_NAME = 'petrankings_admin_token';

/**
 * Next.js Edge Middleware de Segurança (appsec-data-shield).
 * Intercepta e protege rotas administrativas (/admin) antes da renderização.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Bloqueio em Produção: A área administrativa (/admin) só existe localmente
  const isProduction = process.env.NODE_ENV === 'production';
  const allowAdminInProd = process.env.ALLOW_ADMIN_IN_PRODUCTION === 'true';

  if (pathname.startsWith('/admin') && isProduction && !allowAdminInProd) {
    // Em produção, finge que a rota /admin não existe (Retorna 404 Not Found)
    return NextResponse.rewrite(new URL('/_not-found', req.url));
  }

  // 2. Proteção JWT da área administrativa no ambiente local
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      if (payload.role !== 'admin') {
        const loginUrl = new URL('/admin/login', req.url);
        loginUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      // Token inválido ou expirado -> redireciona para login e limpa cookie
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(TOKEN_COOKIE_NAME);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
