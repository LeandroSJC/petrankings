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

  // Apenas rotas /admin (exceto a tela de login /admin/login)
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
  matcher: ['/admin/:path*'],
};
