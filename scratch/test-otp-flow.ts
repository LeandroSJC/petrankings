import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma';
import { createGateToken } from '../src/lib/gate';
import { POST as requestOtpHandler } from '../src/app/api/auth/otp/request/route';
import { POST as verifyOtpHandler } from '../src/app/api/auth/otp/verify/route';
import { NextRequest } from 'next/server';

async function testOtpFlow() {
  console.log('🧪 Iniciando testes do Fluxo Passwordless via OTP por E-mail...\n');

  const testEmail = 'admin@petrankings.com.br';
  const gateToken = await createGateToken();

  // Teste 1: Tentar solicitar sem cookie de portão -> Deve retornar 404
  {
    console.log('Teste 1: Solicitar OTP sem passar pelo Portão Secreto');
    const req = new NextRequest('http://localhost:3000/api/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail }),
    });
    const res = await requestOtpHandler(req);
    console.log('  Status retornado:', res.status);
    if (res.status !== 404) throw new Error('Teste 1 falhou: deveria retornar 404');
    console.log('  Resultado: ✅ 404 Not Found Confirmado');
  }

  // Teste 2: Solicitar OTP com portão destrancado para e-mail inexistente
  {
    console.log('\nTeste 2: Solicitar OTP para e-mail não-administrador');
    const req = new NextRequest('http://localhost:3000/api/auth/otp/request', {
      method: 'POST',
      headers: {
        cookie: `petrankings_admin_gate=${gateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'estranho@gmail.com' }),
    });
    const res = await requestOtpHandler(req);
    console.log('  Status retornado:', res.status);
    if (res.status !== 403) throw new Error('Teste 2 falhou: deveria retornar 403');
    console.log('  Resultado: ✅ 403 Acesso Negado Confirmado');
  }

  // Teste 3: Solicitar OTP legítimo para o admin
  let generatedOtp = '';
  {
    console.log('\nTeste 3: Solicitação legítima de OTP para admin@petrankings.com.br');
    const req = new NextRequest('http://localhost:3000/api/auth/otp/request', {
      method: 'POST',
      headers: {
        cookie: `petrankings_admin_gate=${gateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });
    const res = await requestOtpHandler(req);
    const data = await res.json();
    console.log('  Status retornado:', res.status);
    console.log('  Resposta:', data);
    if (res.status !== 200 || !data.success) throw new Error('Teste 3 falhou');

    // Recupera o registro salvo no banco
    const dbOtp = await prisma.adminOtp.findFirst({
      where: { email: testEmail, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!dbOtp) throw new Error('Registro OTP não encontrado no banco!');
    console.log('  Registro criado no banco ID:', dbOtp.id);
    console.log('  Hash bcrypt no banco:', dbOtp.codeHash.slice(0, 20) + '...');
    console.log('  Resultado: ✅ OTP gerado e armazenado com sucesso');
  }

  // Teste 4: Tentar código errado
  {
    console.log('\nTeste 4: Validar código incorreto (ex: 000000)');
    const req = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
      method: 'POST',
      headers: {
        cookie: `petrankings_admin_gate=${gateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail, code: '000000' }),
    });
    const res = await verifyOtpHandler(req);
    const data = await res.json();
    console.log('  Status retornado:', res.status);
    console.log('  Mensagem de erro esperada:', data.error);
    if (res.status !== 400) throw new Error('Teste 4 falhou: deveria rejeitar código errado');

    // Checa incremento de tentativas no banco
    const dbOtp = await prisma.adminOtp.findFirst({
      where: { email: testEmail, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (dbOtp?.attempts !== 1) throw new Error(`Tentativas não incrementadas! Esperado 1, obteve ${dbOtp?.attempts}`);
    console.log('  Tentativas registradas no banco:', dbOtp.attempts);
    console.log('  Resultado: ✅ Código incorreto rejeitado e tentativa contabilizada');
  }

  // Teste 5: Gerar um código conhecido e validar sucesso
  {
    console.log('\nTeste 5: Validar código correto com emissão de token JWT');
    const knownCode = '123456';
    const codeHash = await bcrypt.hash(knownCode, 10);
    const otpRecord = await prisma.adminOtp.create({
      data: {
        email: testEmail,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const req = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
      method: 'POST',
      headers: {
        cookie: `petrankings_admin_gate=${gateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail, code: knownCode }),
    });
    const res = await verifyOtpHandler(req);
    const data = await res.json();
    const setCookieHeader = res.headers.get('set-cookie');
    console.log('  Status retornado:', res.status);
    console.log('  Sucesso:', data.success);
    console.log('  Cookie de sessão emitido:', setCookieHeader?.includes('petrankings_admin_token') ? '✅ Sim' : '❌ Não');
    if (res.status !== 200 || !data.success || !setCookieHeader?.includes('petrankings_admin_token')) {
      throw new Error('Teste 5 falhou');
    }

    // Checa se foi marcado como usedAt no banco
    const updated = await prisma.adminOtp.findUnique({ where: { id: otpRecord.id } });
    if (!updated?.usedAt) throw new Error('OTP não foi marcado como usado!');
    console.log('  Resultado: ✅ Acesso liberado, sessão emitida e OTP invalidado');
  }

  // Teste 6: Replay attack (tentar reutilizar o mesmo código já usado)
  {
    console.log('\nTeste 6: Prevenção de reutilização (Replay Attack)');
    const req = new NextRequest('http://localhost:3000/api/auth/otp/verify', {
      method: 'POST',
      headers: {
        cookie: `petrankings_admin_gate=${gateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail, code: '123456' }),
    });
    const res = await verifyOtpHandler(req);
    console.log('  Status retornado:', res.status);
    if (res.status !== 400) throw new Error('Teste 6 falhou: código reutilizado deveria falhar');
    console.log('  Resultado: ✅ Código já usado bloqueado com sucesso');
  }

  console.log('\n===============================================================');
  console.log('🏆 TODOS OS TESTES DO FLUXO PASSWORDLESS OTP PASSARAM COM SUCESSO!');
  console.log('===============================================================\n');
}

testOtpFlow().catch((err) => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
