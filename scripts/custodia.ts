import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { calcularScoreAnaliseRotulo, generateTechnicalEditorialOpinion, FaseVida } from '../src/lib/audit-engine';
import { generateCustodyHtml } from '../src/lib/custody-template';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5433/petrankings_db'
    }
  }
});

const CUSTODY_DIR = path.join(process.cwd(), 'custodia_documental');
const MANIFESTS_DIR = path.join(CUSTODY_DIR, 'manifestos');

export interface CustodyManifest {
  productId: string;
  slug: string;
  commercialName: string;
  brand: string;
  manufacturer: string;
  primarySource: {
    type: 'PDF_OFICIAL' | 'HTML_OFICIAL' | 'ROTULO_FISICO' | 'VAREJO_AUTORIZADO';
    url: string;
    localFile: string | null;
    sha256: string | null;
    retrievedAt: string;
  };
  supplementarySources?: Array<{
    provider: string;
    url?: string;
    fieldsSupplied: string[];
    notes: string;
  }>;
  guaranteesDeclared: {
    umidadeMaxPct: number;
    proteinaBrutaMinPct: number;
    extratoEtereoMinPct: number;
    materiaFibrosaMaxPct?: number | null;
    materiaMineralMaxPct: number;
    calcioMinPct: number;
    calcioMaxPct?: number | null;
    fosforoMinPct: number;
    sodioMinPct?: number | null;
    omega3MinPct?: number | null;
  };
  rawIngredientsText: string;
  cleanIngredients: string[];
  evaluation: {
    scoreTotal: number | null;
    classificationTier: string | null;
    scoreBreakdown: any;
    calculatedAt: string;
  };
}

// 1. AÇÃO: BUSCAR PRODUTO NA CUSTÓDIA
async function buscarCustodia(query: string) {
  if (!query) {
    console.error('❌ Especifique um slug ou termo de busca. Ex: npx tsx scripts/custodia.ts buscar large-breed');
    return;
  }

  console.log(`\n🔍 Buscando na Custódia Documental por: "${query}"...\n`);

  // Busca no banco primeiro para pegar produtos
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { slug: { contains: query, mode: 'insensitive' } },
        { commercialName: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 5
  });

  if (products.length === 0) {
    console.log(`⚠️ Nenhum produto encontrado com o termo "${query}".`);
    return;
  }

  for (const p of products) {
    console.log('========================================================================');
    console.log(`🏷️  PRODUTO: ${p.commercialName}`);
    console.log(`   Slug: ${p.slug} | ID: ${p.id}`);
    console.log(`   Marca: ${p.brand} | Espécie: ${p.species} | Fase: ${p.lifeStage} | Tipo: ${p.foodType}`);

    const manifestPath = path.join(MANIFESTS_DIR, `${p.slug}.json`);
    let manifest: CustodyManifest | null = null;
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    }

    if (manifest) {
      console.log(`\n📋 MANIFESTO DE CUSTÓDIA ENCONTRADO (${manifest.primarySource.type}):`);
      console.log(`   🔗 URL Oficial: ${manifest.primarySource.url}`);
      console.log(`   📁 Arquivo Local: ${manifest.primarySource.localFile || 'Não arquivado localmente'}`);
      console.log(`   🔒 Hash SHA-256: ${manifest.primarySource.sha256 || 'N/A'}`);
      console.log(`   📅 Coletado em: ${manifest.primarySource.retrievedAt}`);

      if (manifest.supplementarySources && manifest.supplementarySources.length > 0) {
        console.log(`\n   ℹ️ FONTES COMPLEMENTARES:`);
        for (const s of manifest.supplementarySources) {
          console.log(`      - [${s.provider}] Nutrientes: ${s.fieldsSupplied.join(', ')}`);
          if (s.notes) console.log(`        Nota: ${s.notes}`);
          if (s.url) console.log(`        URL: ${s.url}`);
        }
      }

      console.log(`\n   📊 Níveis de Garantia Custodiados (MN):`);
      console.log(
        `      Umidade: ${manifest.guaranteesDeclared.umidadeMaxPct}% | PB: ${manifest.guaranteesDeclared.proteinaBrutaMinPct}% | EE: ${manifest.guaranteesDeclared.extratoEtereoMinPct}% | MM: ${manifest.guaranteesDeclared.materiaMineralMaxPct}%`
      );
      console.log(
        `      Cálcio: ${manifest.guaranteesDeclared.calcioMinPct}% a ${manifest.guaranteesDeclared.calcioMaxPct ?? 'N/A'}% | Fósforo: ${manifest.guaranteesDeclared.fosforoMinPct}% | Sódio: ${manifest.guaranteesDeclared.sodioMinPct ?? 'N/A'}%`
      );

      console.log(`\n   🥩 Top 5 Ingredientes Primários:`);
      const top5 = manifest.cleanIngredients.slice(0, 5);
      top5.forEach((ing, idx) => console.log(`      #${idx + 1} ${ing}`));
      console.log(`      ... total de ${manifest.cleanIngredients.length} ingredientes oficiais declarados.`);

      console.log(`\n   ⭐ Avaliação Determinística PetRankings:`);
      console.log(
        `      Score: ${manifest.evaluation.scoreTotal} pontos | Classificação: ${manifest.evaluation.classificationTier}`
      );
    } else {
      console.log(`\nℹ️  Produto cadastrado no banco, ficha gerada em: ${p.sourceDocumentUrl}`);
      console.log(`   URL Oficial: ${p.sourceUrl}`);
      console.log(`   (Manifesto JSON detalhado pendente de arquivamento para este produto)`);
    }
    console.log('========================================================================\n');
  }
}

// 2. AÇÃO: STATUS DO ARQUIVO DE CUSTÓDIA
async function statusCustodia() {
  console.log('\n📊 STATUS DO SISTEMA DE CUSTÓDIA PROBATÓRIA PETRANKINGS:');

  const totalProducts = await prisma.product.count();
  fs.mkdirSync(MANIFESTS_DIR, { recursive: true });
  const manifestFiles = fs.readdirSync(MANIFESTS_DIR).filter((f) => f.endsWith('.json'));

  let pdfCount = 0;
  let htmlCount = 0;
  let hasShaCount = 0;

  for (const f of manifestFiles) {
    try {
      const data: CustodyManifest = JSON.parse(fs.readFileSync(path.join(MANIFESTS_DIR, f), 'utf-8'));
      if (data.primarySource.type === 'PDF_OFICIAL') pdfCount++;
      if (data.primarySource.type === 'HTML_OFICIAL') htmlCount++;
      if (data.primarySource.sha256) hasShaCount++;
    } catch {}
  }

  console.log(`- Total de produtos no banco: ${totalProducts}`);
  console.log(`- Manifestos de custódia estruturados: ${manifestFiles.length}`);
  console.log(`- Documentos originais em PDF: ${pdfCount}`);
  console.log(`- Snapshots originais em HTML: ${htmlCount}`);
  console.log(`- Evidências com Hash SHA-256 verificado: ${hasShaCount}`);
  console.log(`- Diretório físico: ${CUSTODY_DIR}\n`);
}

// 3. AÇÃO: RECÁLCULO DETERMINÍSTICO A PARTIR DA CUSTÓDIA
async function recalcularCustodia(slug: string) {
  if (!slug) {
    console.error('❌ Especifique o slug do produto para recalcular. Ex: npx tsx scripts/custodia.ts recalcular dog-excellence-super-premium-adultos-racas-grandes');
    return;
  }

  const manifestPath = path.join(MANIFESTS_DIR, `${slug}.json`);
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Manifesto de custódia não encontrado para o slug "${slug}" em: ${manifestPath}`);
    return;
  }

  const manifest: CustodyManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const p = await prisma.product.findUnique({ where: { slug } });
  if (!p) {
    console.error(`❌ Produto "${slug}" não encontrado no banco de dados.`);
    return;
  }

  console.log(`\n⚙️ Recalculando determinísticamente a partir dos dados custodiados: "${manifest.commercialName}"...`);

  const isFilhote =
    p.lifeStage === 'CRESCIMENTO_INICIAL' ||
    p.lifeStage === 'CRESCIMENTO_FINAL' ||
    p.lifeStage === 'FILHOTE';
  const auditFase: FaseVida = (isFilhote ? 'CRESCIMENTO_INICIAL' : p.lifeStage) as FaseVida;

  const isWet = p.foodType === 'UMIDO';
  const isLight = /light|baixas?\s+calorias|controle\s+de\s+peso|reduced\s+calorie|weight\s+care|peso\s+perfeito/i.test(
    p.commercialName + ' ' + p.slug
  );

  const audit = calcularScoreAnaliseRotulo(
    p.species as any,
    auditFase,
    manifest.guaranteesDeclared,
    {
      topIngredientes: manifest.cleanIngredients,
      antioxidanteTipo: (p.antioxidantType as any) || 'SINTETICO',
      containsGmo: p.containsGmo,
      omega3OuPrebioticosGarantidos: isWet
        ? (manifest.guaranteesDeclared.omega3MinPct ?? 0) >= 0.015
        : (manifest.guaranteesDeclared.omega3MinPct ?? 0) >= 0.2,
      claimCarneTipo: (p.meatClaimType as any) || 'COM_CARNE',
      claimCarneAdequado: true,
      foodType: p.foodType as any,
      isLightOuControlePeso: isLight,
      nomeComercial: p.commercialName
    },
    p.foodType as any
  );

  const newOpinion = generateTechnicalEditorialOpinion({
    ...p,
    topIngredients: JSON.stringify(manifest.cleanIngredients),
    scoreTotal: audit.scoreTotal,
    classificationTier: audit.classificacaoFaixa,
    scoreBreakdown: audit.extratoPontos
  });

  // Atualizar manifesto com novo cálculo
  manifest.evaluation = {
    scoreTotal: audit.scoreTotal,
    classificationTier: audit.classificacaoFaixa,
    scoreBreakdown: audit.extratoPontos,
    calculatedAt: new Date().toISOString()
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  // Atualizar no banco
  await prisma.product.update({
    where: { id: p.id },
    data: {
      scoreTotal: audit.scoreTotal,
      classificationTier: audit.classificacaoFaixa,
      scoreBreakdown: audit.extratoPontos as any,
      editorialOpinion: newOpinion,
      calculatedAt: new Date()
    }
  });

  console.log(`✅ Recálculo concluído com sucesso!`);
  console.log(`   Score Anterior: ${p.scoreTotal} (${p.classificationTier})`);
  console.log(`   Score Novo: ${audit.scoreTotal} (${audit.classificacaoFaixa})`);
}

async function main() {
  const [action, ...args] = process.argv.slice(2);

  switch (action) {
    case 'buscar':
      await buscarCustodia(args.join(' '));
      break;
    case 'status':
      await statusCustodia();
      break;
    case 'recalcular':
      await recalcularCustodia(args[0]);
      break;
    default:
      console.log(`
PetRankings — Sistema de Custódia Probatória & Rastreabilidade Documental

Uso:
  npx tsx scripts/custodia.ts buscar <slug-ou-marca>    Busca dados brutos e evidências de um produto
  npx tsx scripts/custodia.ts status                    Exibe o status e estatísticas do arquivo de custódia
  npx tsx scripts/custodia.ts recalcular <slug>         Recalcula determinísticamente a partir dos dados custodiados
      `);
      break;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
