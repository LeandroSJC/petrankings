import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel, processUrl, closePlaywright } from './cadastrar-por-url';

const TARGET_URLS = [
  'https://www.equilibrio-petfood.com/pt-br/produtos-para-caes/veterinary/veterinary-hepatic/',
  'https://www.equilibrio-petfood.com/pt-br/produtos-para-caes/veterinary/veterinary-intestinal/',
  'https://www.equilibrio-petfood.com/pt-br/produtos-para-gatos/veterinary/veterinary-gatos-renal/',
  'https://www.equilibrio-petfood.com/pt-br/produtos-para-gatos/veterinary/veterinary-gatos-intestinal/',
  'https://www.equilibrio-petfood.com/pt-br/produtos-para-caes/veterinary/veterinary-cardiac/'
];

async function main() {
  console.log('================================================================');
  console.log('🩺 INGESTÃO DOS 5 PRODUTOS EQUILÍBRIO VETERINARY PULADOS');
  console.log('================================================================\n');

  await ensureTunnelOpen();

  const results: { url: string; success: boolean }[] = [];

  for (let i = 0; i < TARGET_URLS.length; i++) {
    const url = TARGET_URLS[i];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`[${i + 1}/${TARGET_URLS.length}] Processando: ${url}`);
    console.log(`----------------------------------------------------------------`);

    // Pausa humanizada entre 2.5s e 4.5s para emular navegação orgânica e evitar detecção de CloudFront/WAF
    if (i > 0) {
      const waitMs = Math.floor(Math.random() * 2000) + 2500;
      console.log(`⏳ Aguardando ${waitMs}ms (cadência orgânica anti-bot)...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }

    try {
      const ok = await processUrl(url);
      results.push({ url, success: ok });
    } catch (err: any) {
      console.error(`❌ Erro crítico ao processar ${url}:`, err.message);
      results.push({ url, success: false });
    }
  }

  await closePlaywright();

  console.log('\n================================================================');
  console.log('📊 RESUMO DA INGESTÃO');
  console.log('================================================================');
  for (const r of results) {
    console.log(`${r.success ? '✅' : '❌'} ${r.url}`);
  }

  // Verificação no Banco de Dados
  console.log('\n================================================================');
  console.log('🔍 AUDITORIA DOS PRODUTOS INSERIDOS NO BANCO DE DADOS');
  console.log('================================================================');

  const slugs = [
    'veterinary-hepatic',
    'veterinary-intestinal',
    'veterinary-gatos-renal',
    'veterinary-gatos-intestinal',
    'veterinary-cardiac'
  ];

  for (const s of slugs) {
    const p = await prisma.product.findUnique({
      where: { slug: s },
      select: {
        id: true,
        slug: true,
        commercialName: true,
        brand: true,
        species: true,
        legalCategory: true,
        coadjuvanteCondition: true,
        scoreTotal: true,
        classificationTier: true,
        frontLabelImageUrl: true,
        sourceDocumentUrl: true,
        topIngredients: true,
        crudeProteinMinPct: true,
        etherExtractMinPct: true,
        editorialOpinion: true,
      }
    });

    if (p) {
      const ingCount = p.topIngredients ? p.topIngredients.split(',').length : 0;
      console.log(`\n✓ [${p.slug}]`);
      console.log(`  Nome Comercial: ${p.commercialName}`);
      console.log(`  Espécie: ${p.species} | Marca: ${p.brand}`);
      console.log(`  Categoria: ${p.legalCategory} | Condição: ${p.coadjuvanteCondition}`);
      console.log(`  Score: ${p.scoreTotal ?? 'null'} | Tier: ${p.classificationTier}`);
      console.log(`  Ingredientes (${ingCount}): ${p.topIngredients?.slice(0, 100)}...`);
      console.log(`  PB / EE: ${p.crudeProteinMinPct}% / ${p.etherExtractMinPct}%`);
      console.log(`  Imagem: ${p.frontLabelImageUrl}`);
      console.log(`  Custódia HTML: ${p.sourceDocumentUrl}`);
      console.log(`  Parecer Editorial: ${p.editorialOpinion?.slice(0, 120)}...`);
    } else {
      console.error(`\n❌ [${s}] NÃO ENCONTRADO NO BANCO DE DADOS!`);
    }
  }

  closeTunnel();
}

main().catch((err) => {
  console.error('Fatal:', err);
  closeTunnel();
  process.exit(1);
});
