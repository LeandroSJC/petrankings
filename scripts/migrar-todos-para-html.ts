import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { generateCustodyHtml } from '../src/lib/custody-template';

async function main() {
  console.log('\n================================================================');
  console.log('🚀 MIGRAÇÃO TOTAL DO CATÁLOGO: PDF -> FICHA TÉCNICA HTML');
  console.log('================================================================\n');

  const products = await prisma.product.findMany({
    where: {
      sourceDocumentUrl: {
        contains: '.pdf',
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`📋 Total de produtos a migrar: ${products.length}`);

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  let migratedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const index = i + 1;

    try {
      const destHtmlRel = `/uploads/ficha_${p.id}.html`;
      const destHtmlPath = path.join(process.cwd(), 'public', destHtmlRel);

      // Verifica se existe PDF original arquivado para manter como link probatório bruto
      let rawRelPath: string | null = null;
      if (p.sourceDocumentUrl) {
        const oldPdfFullPath = path.join(process.cwd(), 'public', p.sourceDocumentUrl);
        const rawPdfRel = `/uploads/raw_pdf_${p.id}.pdf`;
        const rawPdfFullPath = path.join(process.cwd(), 'public', rawPdfRel);

        if (fs.existsSync(oldPdfFullPath)) {
          if (!fs.existsSync(rawPdfFullPath)) {
            fs.copyFileSync(oldPdfFullPath, rawPdfFullPath);
          }
          rawRelPath = rawPdfRel;
        }
      }

      // Gera o HTML padronizado com os dados do banco
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
        rawHtmlRelPath: rawRelPath,
        labelCollectionDate: p.labelCollectionDate,
        curatorResponsible: p.curatorResponsible || 'Curadoria Oficial PetRankings',
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

      // Escreve o novo arquivo HTML oficial
      fs.writeFileSync(destHtmlPath, sheetHtml, 'utf-8');

      // Atualiza o banco de dados
      await prisma.product.update({
        where: { id: p.id },
        data: {
          sourceDocumentUrl: destHtmlRel,
        },
      });

      migratedCount++;
      if (index % 25 === 0 || index === products.length) {
        console.log(`   [${index}/${products.length}] Migrados: ${p.commercialName.substring(0, 50)}...`);
      }
    } catch (err: any) {
      errorCount++;
      console.error(`❌ Erro no produto ID ${p.id} (${p.commercialName}):`, err.message);
    }
  }

  console.log('\n================================================================');
  console.log(`🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!`);
  console.log(`   ✅ Total migrados com sucesso: ${migratedCount}`);
  if (errorCount > 0) {
    console.log(`   ⚠️ Erros encontrados: ${errorCount}`);
  }
  console.log('================================================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
