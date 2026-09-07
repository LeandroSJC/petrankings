import { createGateToken, verifyGateToken } from '../src/lib/gate';

async function testGatekeeper() {
  console.log('🧪 Iniciando testes de validação do Portão Secreto (Stealth Gatekeeper)...');

  // Teste 1: Geração de token
  const token = await createGateToken();
  console.log('✅ Token gerado com sucesso. Tamanho:', token.length);

  // Teste 2: Validação de token legítimo
  const isValid = await verifyGateToken(token);
  if (!isValid) {
    throw new Error('❌ Falha: Token recém-criado deveria ser válido!');
  }
  console.log('✅ Validação de token legítimo: APROVADO');

  // Teste 3: Rejeição de token nulo/indefinido/vazio
  const isNullValid = await verifyGateToken(null);
  const isUndefinedValid = await verifyGateToken(undefined);
  const isEmptyValid = await verifyGateToken('');
  if (isNullValid || isUndefinedValid || isEmptyValid) {
    throw new Error('❌ Falha: Tokens vazios/nulos não deveriam ser aceitos!');
  }
  console.log('✅ Rejeição de tokens nulos/vazios: APROVADO');

  // Teste 4: Rejeição de token adulterado
  const tamperedToken = token.slice(0, -5) + 'abcde';
  const isTamperedValid = await verifyGateToken(tamperedToken);
  if (isTamperedValid) {
    throw new Error('❌ Falha: Token adulterado não deveria ser aceito!');
  }
  console.log('✅ Rejeição de token com assinatura forjada/adulterada: APROVADO');

  console.log('\n🎉 TODOS OS TESTES DO PORTÃO SECRETO PASSARAM COM 100% DE SUCESSO!');
}

testGatekeeper().catch((err) => {
  console.error('Erro nos testes:', err);
  process.exit(1);
});
