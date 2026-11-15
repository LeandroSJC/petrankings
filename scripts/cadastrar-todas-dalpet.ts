import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { ensureTunnelOpen, closeTunnel, closePlaywright } from './cadastrar-por-url';
import prisma from '../src/lib/prisma';
import { parseProductFromHtml } from '../src/lib/html-product-parser';
import { calcularScoreAnaliseRotulo, generateEditorialOpinionWithGemini } from '../src/lib/audit-engine';

async function downloadImage(imgUrl: string, destPath: string, retries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(imgUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
      });
      if (!res.ok) {
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        return false;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) return false;
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      if (destPath.endsWith('.webp')) {
        try {
          await sharp(buf).trim().webp({ quality: 90 }).toFile(destPath);
        } catch {
          fs.writeFileSync(destPath, buf);
        }
      } else {
        fs.writeFileSync(destPath, buf);
      }
      return true;
    } catch {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  return false;
}

function getCanonicalDetails(p: any) {
  const slug = (p.slug || '').toLowerCase();
  const title = (p.title || '').trim();
  const imgName = Array.isArray(p.images) && p.images[0] ? p.images[0] : '';
  const imgUrl = imgName ? `https://dwu86ft0a6abz.cloudfront.net/243/public/templates/${imgName}` : '';

  let commercialName = '';
  let brand = '';

  // DALCAT
  if (/dalcat/i.test(slug + ' ' + title)) {
    brand = 'DalCat';
    if (/filhotes/i.test(slug + ' ' + title)) {
      commercialName = 'DalCat Gatos Filhotes Sabor Frango';
    } else if (/castrados/i.test(slug + ' ' + title)) {
      if (/salm[ãa]o/i.test(slug + ' ' + title)) {
        commercialName = 'DalCat Gatos Castrados Sabor Salmão';
      } else {
        commercialName = 'DalCat Gatos Castrados Sabor Frango';
      }
    } else if (/adultos/i.test(slug + ' ' + title)) {
      if (/carne/i.test(slug + ' ' + title)) {
        commercialName = 'DalCat Gatos Adultos Sabor Carne';
      } else {
        commercialName = 'DalCat Gatos Adultos Sabor Frango';
      }
    } else {
      commercialName = 'DalCat Gatos Adultos';
    }
  }
  // DALDOG
  else if (/daldog/i.test(slug + ' ' + title)) {
    brand = 'DalDog';
    if (/essencial/i.test(slug + ' ' + title)) {
      commercialName = 'DalDog Essencial Cães Adultos Raças Médias e Grandes Sabor Frango e Carne';
    } else if (/s[êe]nior|senior/i.test(slug + ' ' + title)) {
      if (/pequenas|mini/i.test(slug + ' ' + title)) {
        commercialName = 'DalDog Cães Sênior Castrados e Light Raças Mini e Pequenas Sabor Frango e Arroz';
      } else {
        commercialName = 'DalDog Cães Sênior Castrados e Light Raças Médias e Grandes Sabor Frango e Arroz';
      }
    } else if (/filhotes/i.test(slug + ' ' + title)) {
      if (/pequenas|mini/i.test(slug + ' ' + title)) {
        commercialName = 'DalDog Cães Filhotes Raças Mini e Pequenas Sabor Carne';
      } else {
        commercialName = 'DalDog Cães Filhotes Raças Médias e Grandes Sabor Carne';
      }
    } else if (/adultos/i.test(slug + ' ' + title)) {
      if (/pequenas|mini/i.test(slug + ' ' + title)) {
        commercialName = 'DalDog Cães Adultos Raças Mini e Pequenas Sabor Carne';
      } else {
        commercialName = 'DalDog Cães Adultos Raças Médias e Grandes Sabor Carne';
      }
    }
  }
  // PRO ÔMEGA
  else if (/pro[-_\s]*omega/i.test(slug + ' ' + title)) {
    brand = 'Pro Ômega';
    const isNatural = /natural/i.test(slug + ' ' + title);
    const isGato = /gato/i.test(slug + ' ' + title);

    if (isNatural) {
      if (isGato) {
        if (/castrados/i.test(slug + ' ' + title)) {
          commercialName = 'Pro Ômega Natural Gatos Castrados';
        } else if (/filhotes/i.test(slug + ' ' + title)) {
          commercialName = 'Pro Ômega Natural Gatos Filhotes';
        } else {
          commercialName = 'Pro Ômega Natural Gatos Adultos';
        }
      } else {
        // Cães
        if (/filhotes/i.test(slug + ' ' + title)) {
          if (/mini|pequeno/i.test(slug + ' ' + title)) {
            commercialName = 'Pro Ômega Natural Cães Filhotes Raças Mini e Pequenas';
          } else {
            commercialName = 'Pro Ômega Natural Cães Filhotes Raças Médias e Grandes';
          }
        } else {
          if (/mini|pequeno/i.test(slug + ' ' + title)) {
            commercialName = 'Pro Ômega Natural Cães Adultos Raças Mini e Pequenas';
          } else {
            commercialName = 'Pro Ômega Natural Cães Adultos Raças Médias e Grandes';
          }
        }
      }
    } else {
      // Tradicional / Life / Action
      if (/action|gigantes/i.test(slug + ' ' + title)) {
        commercialName = 'Pro Ômega Action Cães Adultos Raças Médias e Gigantes';
      } else if (/life/i.test(imgName)) {
        if (/filhotes/i.test(slug + ' ' + title)) {
          commercialName = 'Pro Ômega Life Cães Filhotes Raças Médias e Grandes';
        } else {
          commercialName = 'Pro Ômega Life Cães Adultos Raças Médias e Grandes';
        }
      } else {
        if (/filhotes/i.test(slug + ' ' + title)) {
          commercialName = 'Pro Ômega Cães Filhotes Raças Pequenas';
        } else {
          commercialName = 'Pro Ômega Cães Adultos Raças Pequenas';
        }
      }
    }
  }

  return { commercialName, brand, imgUrl };
}

function buildCustodyHtml(commercialName: string, imgUrl: string, composition: string, warranty: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${commercialName} - Dalpet Alimentos</title>
</head>
<body>
  <h1>${commercialName}</h1>
  <div class="product-image">
    <img src="${imgUrl}" alt="${commercialName}">
  </div>
  <div class="composicao-basica">
    <h2>Composição Básica</h2>
    ${composition || ''}
  </div>
  <div class="niveis-de-garantia">
    <h2>Níveis de Garantia</h2>
    ${warranty || ''}
  </div>
</body>
</html>`;
}

async function main() {
  console.log('🚀 [DalPet Alimentos] Iniciando ingestão das Linhas Pro Ômega, DalDog e DalCat...\n');
  await ensureTunnelOpen();

  const url = 'https://beta.scribo.dev/api/cms/dalpet/products?limit=200&populate=*';
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    },
  });
  const data = await res.json();
  const items: any[] = data.data || [];

  const ptItems = items.filter((p) => p.locale === 'pt-BR' || !p.locale);
  const targetProds = ptItems.filter((p) => {
    const full = `${p.slug || ''} ${p.title || ''}`.toLowerCase();
    return /pro[-_\s]*omega|daldog|dalcat/i.test(full);
  });

  console.log(`📦 Total de produtos DalPet identificados para cadastro: ${targetProds.length}`);

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const custodiaDir = path.join(uploadsDir, 'custodia');
  if (!fs.existsSync(custodiaDir)) fs.mkdirSync(custodiaDir, { recursive: true });

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targetProds.length; i++) {
    const p = targetProds[i];
    const { commercialName, brand, imgUrl } = getCanonicalDetails(p);
    const sourceUrl = `https://dalpet.com.br/produto/${p.slug}`;

    console.log(`\n------------------------------------------------------------`);
    console.log(`[${i + 1}/${targetProds.length}] Processando: ${commercialName}`);
    console.log(`🔗 URL oficial: ${sourceUrl}`);
    console.log(`------------------------------------------------------------`);

    try {
      const html = buildCustodyHtml(commercialName, imgUrl, p.composition, p.warranty);
      const meta = parseProductFromHtml(html, sourceUrl);

      // Garante nome e marca canônicos
      meta.commercialName = commercialName;
      meta.brand = brand;
      meta.manufacturerLegalName = 'Dalpet Alimentos Ltda.';

      // Verifica duplicidade no banco
      const existing = await prisma.product.findFirst({
        where: {
          OR: [{ sourceUrl }, { slug: meta.slug }],
        },
      });

      const targetSlug = existing ? existing.slug : meta.slug;
      const productId = existing ? existing.id : 'cmtz' + crypto.randomBytes(10).toString('hex');

      // 1. Custódia HTML com hash SHA-256
      const destHtmlRel = `/uploads/custodia/ficha_${productId}.html`;
      const destHtmlPath = path.join(process.cwd(), 'public', destHtmlRel);
      fs.writeFileSync(destHtmlPath, html, 'utf-8');
      const sourceDocumentHash = crypto.createHash('sha256').update(html, 'utf-8').digest('hex');

      // 2. Download do packshot WebP oficial
      let destImgRel = existing?.frontLabelImageUrl || `/uploads/produto_${productId}.webp`;
      if (imgUrl) {
        const destImgPath = path.join(process.cwd(), 'public', destImgRel);
        console.log(`🖼️ Baixando packshot oficial em alta resolução (${imgUrl})...`);
        const imgOk = await downloadImage(imgUrl, destImgPath);
        if (imgOk) {
          console.log(`✅ Imagem salva em: public${destImgRel}`);
        } else {
          console.warn(`⚠️ Não foi possível baixar imagem remota, mantendo URL original.`);
          destImgRel = imgUrl;
        }
      }

      // 3. Score determinístico
      const isWet = meta.foodType === 'UMIDO';
      const isFilhote = meta.lifeStage === 'CRESCIMENTO_INICIAL' || meta.lifeStage === 'CRESCIMENTO_FINAL';
      const isLight = /light|baixas?\s+calorias|controle\s+de\s+peso|peso\s+perfeito/i.test(commercialName);

      const audit = calcularScoreAnaliseRotulo(
        meta.species as any,
        (isFilhote ? 'CRESCIMENTO_INICIAL' : meta.lifeStage) as any,
        {
          umidadeMaxPct: meta.umidadeMaxPct,
          proteinaBrutaMinPct: meta.proteinaBrutaMinPct,
          extratoEtereoMinPct: meta.extratoEtereoMinPct,
          materiaFibrosaMaxPct: meta.materiaFibrosaMaxPct,
          materiaMineralMaxPct: meta.materiaMineralMaxPct,
          calcioMinPct: meta.calcioMinPct,
          calcioMaxPct: meta.calcioMaxPct,
          fosforoMinPct: meta.fosforoMinPct,
          sodioMinPct: meta.sodioMinPct,
        },
        {
          topIngredientes: meta.topIngredientsList,
          antioxidanteTipo: meta.antioxidantType as any,
          omega3OuPrebioticosGarantidos: (meta.omega3MinPct && meta.omega3MinPct > 0) || false,
          claimCarneTipo: 'SEM_CLAIM',
          claimCarneAdequado: true,
          nomeComercial: commercialName,
          isLightOuControlePeso: isLight,
          foodType: meta.foodType as any,
        },
        meta.foodType as any
      );

      console.log(`📊 Score: ${audit.scoreTotal} (${audit.classificacaoFaixa})`);

      // 4. Parecer editorial técnico via Gemini AI
      console.log('🤖 Gerando parecer editorial técnico via Gemini AI...');
      let editorialOpinion: string;
      try {
        editorialOpinion = await generateEditorialOpinionWithGemini({
          commercialName: meta.commercialName,
          species: meta.species,
          lifeStage: meta.lifeStage,
          scoreTotal: audit.scoreTotal,
          classificationTier: audit.classificacaoFaixa,
          topIngredients: meta.topIngredientsList,
          moistureMaxPct: meta.umidadeMaxPct,
          crudeProteinMinPct: meta.proteinaBrutaMinPct,
          etherExtractMinPct: meta.extratoEtereoMinPct,
          crudeFiberMaxPct: meta.materiaFibrosaMaxPct,
          mineralMatterMaxPct: meta.materiaMineralMaxPct,
          calciumMinPct: meta.calcioMinPct,
          calciumMaxPct: meta.calcioMaxPct,
          phosphorusMinPct: meta.fosforoMinPct,
          containsGmo: meta.containsGmo,
          antioxidantType: meta.antioxidantType,
          foodType: meta.foodType,
          legalCategory: meta.legalCategory,
          meatClaimType: 'SEM_CLAIM',
        });
      } catch (geminiErr: any) {
        console.warn(`⚠️ Gemini fallback: ${geminiErr.message}`);
        editorialOpinion = `Avaliação nutricional de conformidade técnica baseada estritamente nas garantias declaradas pelo fabricante Dalpet Alimentos.`;
      }

      // 5. Upsert no Prisma
      const productData = {
        commercialName: meta.commercialName,
        brand: meta.brand,
        manufacturerLegalName: meta.manufacturerLegalName,
        legalCategory: meta.legalCategory as any,
        species: meta.species as any,
        lifeStage: meta.lifeStage as any,
        foodType: meta.foodType as any,
        sourceUrl,
        sourceDocumentUrl: destHtmlRel,
        frontLabelImageUrl: destImgRel,
        moistureMaxPct: meta.umidadeMaxPct,
        crudeProteinMinPct: meta.proteinaBrutaMinPct,
        etherExtractMinPct: meta.extratoEtereoMinPct,
        crudeFiberMaxPct: meta.materiaFibrosaMaxPct,
        mineralMatterMaxPct: meta.materiaMineralMaxPct,
        calciumMinPct: meta.calcioMinPct,
        calciumMaxPct: meta.calcioMaxPct,
        phosphorusMinPct: meta.fosforoMinPct,
        sodiumMinPct: meta.sodioMinPct,
        meatClaimType: 'SEM_CLAIM' as any,
        containsGmo: meta.containsGmo,
        gmoIngredients: meta.gmoIngredients,
        antioxidantType: meta.antioxidantType as any,
        topIngredients: JSON.stringify(meta.topIngredientsList),
        scoreTotal: audit.scoreTotal,
        classificationTier: audit.classificacaoFaixa as any,
        scoreBreakdown: audit.extratoPontos as any,
        editorialOpinion,
        calculatedAt: new Date(),
        isPublished: true,
      };

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: productData,
        });
        console.log(`🔄 Registro atualizado no banco (ID: ${existing.id})`);
      } else {
        await prisma.product.create({
          data: {
            id: productId,
            slug: targetSlug,
            ...productData,
          },
        });
        console.log(`✨ Novo registro criado no banco (ID: ${productId} | Slug: ${targetSlug})`);
      }

      console.log(`🎉 PRODUTO CADASTRADO / ATUALIZADO COM SUCESSO!`);
      console.log(`👉 Visualizar no Portal: http://localhost:3000/produto/${targetSlug}`);
      successCount++;
    } catch (err: any) {
      console.error(`❌ Erro no cadastro de ${commercialName}:`, err.message);
      failCount++;
    }

    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n============================================================`);
  console.log(`🎉 Ingestão DalPet concluída!`);
  console.log(`✅ Sucesso: ${successCount} | ❌ Falhas: ${failCount}`);
  console.log(`============================================================\n`);

  // Lista os produtos DalPet cadastrados
  const dalpetProds = await prisma.product.findMany({
    where: { manufacturerLegalName: 'Dalpet Alimentos Ltda.' },
    select: {
      id: true,
      commercialName: true,
      brand: true,
      slug: true,
      scoreTotal: true,
      classificationTier: true,
      frontLabelImageUrl: true,
    },
    orderBy: { commercialName: 'asc' },
  });

  console.log(`📋 Total de produtos DalPet no banco: ${dalpetProds.length}`);
  for (const p of dalpetProds) {
    console.log(` - [${p.scoreTotal ?? 'N/A'} pts - ${p.classificationTier ?? 'N/A'}] ${p.commercialName} (/produto/${p.slug})`);
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
