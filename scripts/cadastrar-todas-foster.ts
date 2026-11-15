import 'dotenv/config';
import { ensureTunnelOpen, closeTunnel, processUrl, closePlaywright } from './cadastrar-por-url';
import prisma from '../src/lib/prisma';

const urls = [
  'https://fosterpet.com.br/produto/produto-foster-snacks-bifinho-sabor-frango/',
  'https://fosterpet.com.br/produto/produto-foster-snacks-bifinho-sabor-carne/',
  'https://fosterpet.com.br/produto/produto-foster-snacks-bifinho-sabor-churrasco/',
  'https://fosterpet.com.br/produto/foster-up-filhotes-racas-pequenas-frango-e-batata-doce/',
  'https://fosterpet.com.br/produto/foster-up-adultos-racas-pequenas-frango-e-batata-doce-2/',
  'https://fosterpet.com.br/produto/foster-up-adultos-racas-pequenas-frango-e-batata-doce/',
  'https://fosterpet.com.br/produto/foster-up-adultos-racas-medias-e-grandes-frango-e-batata-doce/',
  'https://fosterpet.com.br/produto/foster-up-gatos-castradaos-salmao-e-batata-doce/',
  'https://fosterpet.com.br/produto/foster-gold-gatos-castradaos-salmao-e-arroz/',
  'https://fosterpet.com.br/produto/foster-gold-filhotes-racas-medias-e-grandes/',
  'https://fosterpet.com.br/produto/foster-gold-filhotes-racas-pequenas/',
  'https://fosterpet.com.br/produto/foster-gold-senior-7-todas-as-rac/',
  'https://fosterpet.com.br/produto/foster-gold-adultos-racas-pequenas/',
  'https://fosterpet.com.br/produto/foster-one-gatos-adultos-e-filhotes-blend-de-carnes/',
  'https://fosterpet.com.br/produto/foster-one-gatos-castrados-blend-de-carnes/',
  'https://fosterpet.com.br/produto/foster-one-filhotes-carne-leite/',
  'https://fosterpet.com.br/produto/foster-one-racas-pequenas-carne-arroz/',
  'https://fosterpet.com.br/produto/foster-original/',
  'https://fosterpet.com.br/produto/foster-one-racas-medias-e-grandes-carne-arroz/',
  'https://fosterpet.com.br/produto/foster-gold/',
];

async function main() {
  console.log('🚀 [Foster / Lupus Alimentos] Iniciando ingestão dos 20 produtos Foster...\n');
  await ensureTunnelOpen();

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\n------------------------------------------------------------`);
    console.log(`[${i + 1}/${urls.length}] Processando: ${url}`);
    console.log(`------------------------------------------------------------`);

    try {
      const ok = await processUrl(url);
      if (ok) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (err: any) {
      console.error(`❌ Erro no processamento de ${url}:`, err.message);
      failCount++;
    }

    // Pequeno intervalo para ser gentil com o servidor
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n============================================================`);
  console.log(`🎉 Ingestão Foster concluída!`);
  console.log(`✅ Sucesso: ${successCount} | ❌ Falhas: ${failCount}`);
  console.log(`============================================================\n`);

  // Lista os produtos Foster cadastrados
  const fosterProds = await prisma.product.findMany({
    where: { brand: 'Foster' },
    select: { id: true, commercialName: true, slug: true, frontLabelImageUrl: true, auditScore: true },
    orderBy: { commercialName: 'asc' },
  });

  console.log(`📋 Total de produtos Foster no banco: ${fosterProds.length}`);
  for (const p of fosterProds) {
    console.log(` - [${p.auditScore ?? 'N/A'} pts] ${p.commercialName} (/produto/${p.slug})`);
  }

  await closePlaywright();
  closeTunnel();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal error:', e);
  await closePlaywright();
  closeTunnel();
  process.exit(1);
});
