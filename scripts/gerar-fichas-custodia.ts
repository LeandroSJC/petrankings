import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { generateCustodyHtml } from '../src/lib/custody-template';

async function main() {
  console.log('\n================================================================');
  console.log('📑 GERADOR DE FICHAS TÉCNICAS E CUSTÓDIA PROBATÓRIA PADRONIZADA');
  console.log('================================================================\n');

  const products = await prisma.product.findMany({
    where: {
      sourceDocumentUrl: {
        contains: '.html',
      },
    },
  });

  console.log(`Encontrados ${products.length} produto(s) com ficha em formato HTML.`);

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  for (const p of products) {
    console.log(`\n📦 Processando: "${p.commercialName}" (${p.id})`);

    const destHtmlRel = `/uploads/ficha_${p.id}.html`;
    const destHtmlPath = path.join(process.cwd(), 'public', destHtmlRel);
    const rawHtmlRel = `/uploads/raw_ficha_${p.id}.html`;
    const rawHtmlPath = path.join(process.cwd(), 'public', rawHtmlRel);

    // Se já existia um arquivo HTML bruto e ainda não fizemos backup como raw, preservamos o bruto como arquivo probatório
    if (fs.existsSync(destHtmlPath) && !fs.existsSync(rawHtmlPath)) {
      const currentContent = fs.readFileSync(destHtmlPath, 'utf-8');
      // Se não for o template novo, salvamos como raw
      if (!currentContent.includes('PetRankings — Gerador de Ficha Técnica')) {
        fs.writeFileSync(rawHtmlPath, currentContent, 'utf-8');
        console.log(`   📄 Arquivo HTML bruto preservado para perícia em: public${rawHtmlRel}`);
      }
    }

    const hasRaw = fs.existsSync(rawHtmlPath);

    const sheetHtml = generateCustodyHtml({
      id: p.id,
      slug: p.slug,
      commercialName: p.commercialName,
      brand: p.brand,
      manufacturerLegalName: p.manufacturerLegalName,
      species: p.species,
      lifeStage: p.lifeStage,
      breedSize: p.breedSize,
      foodType: p.foodType,
      legalCategory: p.legalCategory,
      coadjuvanteCondition: p.coadjuvanteCondition,
      sourceUrl: p.sourceUrl,
      sourceArchiveUrl: p.sourceArchiveUrl,
      rawHtmlRelPath: hasRaw ? rawHtmlRel : null,
      labelCollectionDate: p.labelCollectionDate,
      curatorResponsible: p.curatorResponsible,
      frontLabelImageUrl: p.frontLabelImageUrl,

      moistureMaxPct: p.moistureMaxPct,
      crudeProteinMinPct: p.crudeProteinMinPct,
      etherExtractMinPct: p.etherExtractMinPct,
      crudeFiberMaxPct: p.crudeFiberMaxPct,
      mineralMatterMaxPct: p.mineralMatterMaxPct,
      calciumMinPct: p.calciumMinPct,
      calciumMaxPct: p.calciumMaxPct,
      phosphorusMinPct: p.phosphorusMinPct,
      sodiumMinPct: p.sodiumMinPct,
      omega3MinPct: p.omega3MinPct,

      topIngredients: p.topIngredients,
      meatClaimType: p.meatClaimType,
      containsGmo: p.containsGmo,
      gmoIngredients: p.gmoIngredients,
      antioxidantType: p.antioxidantType,

      scoreTotal: p.scoreTotal,
      classificationTier: p.classificationTier,
      scoreBreakdown: p.scoreBreakdown,
      editorialOpinion: p.editorialOpinion,
    });

    fs.writeFileSync(destHtmlPath, sheetHtml, 'utf-8');
    console.log(`   ✅ Ficha técnica padronizada gerada com sucesso: public${destHtmlRel}`);
    console.log(`   🔗 URL local: http://localhost:3000${destHtmlRel}`);
  }

  console.log('\n🎉 Processo concluído com sucesso!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
