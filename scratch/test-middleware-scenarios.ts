import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';
import { createGateToken } from '../src/lib/gate';

async function runMiddlewareScenarios() {
  console.log('🛡️ Iniciando simulação de cenários do Middleware Stealth Gatekeeper...\n');

  // Cenário 1: Visitante/Bot tenta acessar /admin diretamente sem o cookie
  {
    const req = new NextRequest('http://localhost:3000/admin');
    const res = await middleware(req);
    const rewriteHeader = res.headers.get('x-middleware-rewrite');
    const isRewrittenTo404 = rewriteHeader?.includes('/_not-found');
    console.log('Cenário 1: GET /admin sem cookie de portão');
    console.log('  Status esperado: Camuflado (Rewrite para /_not-found)');
    console.log('  Resultado:', isRewrittenTo404 ? '✅ 404 Not Found Confirmado' : '❌ Falha');
    if (!isRewrittenTo404) throw new Error('Cenário 1 falhou!');
  }

  // Cenário 2: Scanner tenta acessar /admin/login diretamente sem o cookie
  {
    const req = new NextRequest('http://localhost:3000/admin/login');
    const res = await middleware(req);
    const rewriteHeader = res.headers.get('x-middleware-rewrite');
    const isRewrittenTo404 = rewriteHeader?.includes('/_not-found');
    console.log('\nCenário 2: GET /admin/login direto sem o cookie');
    console.log('  Status esperado: Camuflado (Rewrite para /_not-found)');
    console.log('  Resultado:', isRewrittenTo404 ? '✅ 404 Not Found Confirmado' : '❌ Falha');
    if (!isRewrittenTo404) throw new Error('Cenário 2 falhou!');
  }

  // Cenário 3: Scanner tenta acessar /bastidores sem a chave
  {
    const req = new NextRequest('http://localhost:3000/bastidores');
    const res = await middleware(req);
    const rewriteHeader = res.headers.get('x-middleware-rewrite');
    const isRewrittenTo404 = rewriteHeader?.includes('/_not-found');
    console.log('\nCenário 3: GET /bastidores sem parâmetro de chave');
    console.log('  Status esperado: Camuflado (Rewrite para /_not-found)');
    console.log('  Resultado:', isRewrittenTo404 ? '✅ 404 Not Found Confirmado' : '❌ Falha');
    if (!isRewrittenTo404) throw new Error('Cenário 3 falhou!');
  }

  // Cenário 4: Scanner tenta adivinhar com chave incorreta
  {
    const req = new NextRequest('http://localhost:3000/bastidores?key=senha123');
    const res = await middleware(req);
    const rewriteHeader = res.headers.get('x-middleware-rewrite');
    const isRewrittenTo404 = rewriteHeader?.includes('/_not-found');
    console.log('\nCenário 4: GET /bastidores com chave incorreta');
    console.log('  Status esperado: Camuflado (Rewrite para /_not-found)');
    console.log('  Resultado:', isRewrittenTo404 ? '✅ 404 Not Found Confirmado' : '❌ Falha');
    if (!isRewrittenTo404) throw new Error('Cenário 4 falhou!');
  }

  // Cenário 5: Administrador acessa o portão com a chave correta
  {
    const req = new NextRequest('http://localhost:3000/bastidores?key=petrankings_master_gate_2026_x9');
    const res = await middleware(req);
    const isRedirectToLogin = res.headers.get('location')?.includes('/admin/login');
    const setCookieHeader = res.headers.get('set-cookie');
    const hasGateCookie = setCookieHeader?.includes('petrankings_admin_gate');
    console.log('\nCenário 5: GET /bastidores com CHAVE MESTRE CORRETA');
    console.log('  Status esperado: Redirect para /admin/login + Set-Cookie petrankings_admin_gate');
    console.log('  Redirecionamento correto:', isRedirectToLogin ? '✅ Sim' : '❌ Não');
    console.log('  Cookie do portão emitido:', hasGateCookie ? '✅ Sim' : '❌ Não');
    if (!isRedirectToLogin || !hasGateCookie) throw new Error('Cenário 5 falhou!');
  }

  // Cenário 6: Administrador com o cookie de portão acessa /admin/login
  {
    const gateToken = await createGateToken();
    const req = new NextRequest('http://localhost:3000/admin/login', {
      headers: {
        cookie: `petrankings_admin_gate=${gateToken}`,
      },
    });
    const res = await middleware(req);
    const rewriteHeader = res.headers.get('x-middleware-rewrite');
    const isNotRewritten = !rewriteHeader?.includes('/_not-found');
    console.log('\nCenário 6: GET /admin/login com cookie do portão ativo');
    console.log('  Status esperado: Acesso permitido (não é 404)');
    console.log('  Resultado:', isNotRewritten ? '✅ Acesso liberado à tela de login' : '❌ Falha');
    if (!isNotRewritten) throw new Error('Cenário 6 falhou!');
  }

  // Cenário 7: Bot tentando brute force na API de login sem passar pelo portão
  {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
    });
    const res = await middleware(req);
    console.log('\nCenário 7: POST /api/auth/login direto sem cookie do portão');
    console.log('  Status esperado: 404 Not Found');
    console.log('  Resultado:', res.status === 404 ? '✅ 404 Retornado' : '❌ Falha');
    if (res.status !== 404) throw new Error('Cenário 7 falhou!');
  }

  // Cenário 8: Requisição em página pública normal (ex: /ranking/racao) não é afetada
  {
    const req = new NextRequest('http://localhost:3000/ranking/melhor-racao-para-caes');
    const res = await middleware(req);
    const rewriteHeader = res.headers.get('x-middleware-rewrite');
    const isNormal = !rewriteHeader?.includes('/_not-found');
    console.log('\nCenário 8: Página pública regular');
    console.log('  Status esperado: Navegação limpa e transparente');
    console.log('  Resultado:', isNormal ? '✅ Passagem direta sem impacto' : '❌ Falha');
    if (!isNormal) throw new Error('Cenário 8 falhou!');
  }

  console.log('\n===============================================================');
  console.log('🏆 TODOS OS 8 CENÁRIOS DO MIDDLEWARE FORAM VALIDADOS COM SUCESSO!');
  console.log('===============================================================\n');
}

runMiddlewareScenarios().catch((err) => {
  console.error('Falha nos cenários:', err);
  process.exit(1);
});
