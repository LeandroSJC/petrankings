import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '../src/lib/prisma';
import { calcularScoreAnaliseRotulo } from '../src/lib/audit-engine';

async function main() {
  const productId = 'cmtz' + crypto.randomBytes(10).toString('hex');
  const slug = 'premier-selecao-natural-gatos-adultos-frango';

  // 1. Localização e cópia dos arquivos de mídia e PDF
  const downloadsDir = 'C:/Users/leand/Downloads';
  const downloadFiles = fs.readdirSync(downloadsDir);

  const foundImg = downloadFiles.find(
    (f) => f.toLowerCase().includes('sele') && f.toLowerCase().includes('korin') && f.endsWith('.webp')
  );
  const foundPdf = downloadFiles.find(
    (f) => f.toLowerCase().includes('sele') && f.toLowerCase().includes('korin') && f.endsWith('.pdf')
  );

  if (!foundImg || !foundPdf) {
    throw new Error(`Arquivos não localizados em ${downloadsDir}: img=${foundImg}, pdf=${foundPdf}`);
  }

  const srcImgPath = path.join(downloadsDir, foundImg);
  const srcPdfPath = path.join(downloadsDir, foundPdf);

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const destImgRel = `/uploads/produto_${productId}.webp`;
  const destPdfRel = `/uploads/ficha_${productId}.pdf`;
  const destImgPath = path.join(process.cwd(), 'public', destImgRel);
  const destPdfPath = path.join(process.cwd(), 'public', destPdfRel);

  fs.copyFileSync(srcImgPath, destImgPath);
  fs.copyFileSync(srcPdfPath, destPdfPath);

  // 2. Hash SHA-256 do PDF
  const pdfBuffer = fs.readFileSync(destPdfPath);
  const sha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

  // 3. Garantias oficiais declaradas no PDF
  const garantias = {
    umidadeMaxPct: 10.0,
    proteinaBrutaMinPct: 32.0,
    extratoEtereoMinPct: 18.0,
    materiaFibrosaMaxPct: 3.5,
    materiaMineralMaxPct: 8.0,
    calcioMinPct: 0.8,
    calcioMaxPct: 1.45,
    fosforoMinPct: 0.7,
    sodioMinPct: 0.35,
    omega3MinPct: 0.2,
  };

  // 4. Lista integral dos 48 ingredientes na ordem decrescente exata
  const topIngredientesList = [
    'Farinha de vísceras de frango (Korin)',
    'Farinha de torresmo',
    'Glúten de milho (não transgênico)',
    'Ovo em pó',
    'Plasma sanguíneo desidratado de suíno',
    'Quirera de arroz',
    'Complexo de vegetais – 5,5% (beterraba, brócolis desidratado, cenoura, espinafre desidratado, polpa desidratada de beterraba e salsa desidratada)',
    'Banha refinada',
    'Gordura de frango',
    'Óleo refinado de peixe',
    'Cloreto de potássio',
    'Cloreto de sódio',
    'Levedura de cana-de-açúcar autolisada e desidratada',
    'Ácido cítrico',
    'Antioxidante natural (concentrado de tocoferóis, extrato de alecrim, extrato de chá verde, extrato de menta, hortelã – mín. 0,05%)',
    'Bentonita',
    'Cloreto de amônio',
    'DL-metionina',
    'Extrato de yucca',
    'Hexametafosfato de sódio',
    'Hidrolisado de fígado de suíno',
    'Hidrolisado de fígado de aves',
    'Parede celular de levedura',
    'Sulfato de amônio',
    'Taurina',
    'Vitamina A',
    'Vitamina B1',
    'Vitamina B2',
    'Vitamina B3',
    'Vitamina B5',
    'Vitamina B6',
    'Vitamina B7',
    'Vitamina B9',
    'Vitamina B12',
    'Vitamina C',
    'Cloreto de colina',
    'Vitamina D3',
    'Vitamina E',
    'Vitamina K3',
    'Ferro aminoácido quelato',
    'Iodato de cálcio',
    'Manganês aminoácido quelato',
    'Selenometionina hidroxi análoga',
    'Sulfato de cobre pentahidratado',
    'Sulfato de ferro',
    'Sulfato de manganês',
    'Sulfato de zinco monohidratado',
    'Zinco aminoácido quelato',
  ];

  // 5. Cálculo do Score
  const audit = calcularScoreAnaliseRotulo(
    'GATO',
    'ADULTO',
    garantias,
    {
      topIngredientes: topIngredientesList.slice(0, 3),
      antioxidanteTipo: 'NATURAL',
      omega3OuPrebioticosGarantidos: true,
      claimCarneTipo: 'COM_CARNE',
      claimCarneAdequado: true,
    }
  );

  console.log('Score Audit:', audit.scoreTotal, audit.classificacaoFaixa);

  // 6. Gravação no PostgreSQL via Prisma
  const product = await prisma.product.upsert({
    where: { slug },
    update: {
      commercialName: 'PremieR Seleção Natural Gatos Adultos Sabor Frango Korin',
      brand: 'PremieR',
      manufacturerLegalName: 'Grandfood Indústria e Comércio Ltda',
      legalCategory: 'ALIMENTO_COMPLETO',
      species: 'GATO',
      lifeStage: 'ADULTO',
      breedSize: 'TODOS',
      foodType: 'SECO',
      coadjuvanteCondition: null,
      sourceUrl: 'https://premierpet.com.br/produto/premier-selecao-natural-gatos-adultos-frango/',
      sourceDocumentUrl: destPdfRel,
      frontLabelImageUrl: destImgRel,
      analyzedBatch: 'LOTE-WEB-2026-09',
      labelCollectionDate: new Date('2026-09-13T11:57:00Z'),
      curatorResponsible: 'Curadoria Técnica',

      moistureMaxPct: garantias.umidadeMaxPct,
      crudeProteinMinPct: garantias.proteinaBrutaMinPct,
      etherExtractMinPct: garantias.extratoEtereoMinPct,
      crudeFiberMaxPct: garantias.materiaFibrosaMaxPct,
      mineralMatterMaxPct: garantias.materiaMineralMaxPct,
      calciumMinPct: garantias.calcioMinPct,
      calciumMaxPct: garantias.calcioMaxPct,
      phosphorusMinPct: garantias.fosforoMinPct,
      sodiumMinPct: garantias.sodioMinPct,
      omega3MinPct: garantias.omega3MinPct,

      meatClaimType: 'COM_CARNE',
      containsGmo: false,
      gmoIngredients: null,
      antioxidantType: 'NATURAL',
      topIngredients: JSON.stringify(topIngredientesList),
      editorialOpinion:
        'Alimento Super Premium da linha Seleção Natural para gatos adultos, elaborado com proteína Korin (criada sem antibióticos nem promotores de crescimento), ovos cage-free e complexo de 8 vegetais. Formulação de alta densidade nutricional e energética (4.082 kcal/kg), com conservantes 100% naturais e livre de ingredientes transgênicos.',

      scoreTotal: audit.scoreTotal,
      classificationTier: audit.classificacaoFaixa,
      scoreBreakdown: audit.extratoPontos as any,
      calculatedAt: new Date(),
      isPublished: true,
    },
    create: {
      id: productId,
      slug,
      commercialName: 'PremieR Seleção Natural Gatos Adultos Sabor Frango Korin',
      brand: 'PremieR',
      manufacturerLegalName: 'Grandfood Indústria e Comércio Ltda',
      legalCategory: 'ALIMENTO_COMPLETO',
      species: 'GATO',
      lifeStage: 'ADULTO',
      breedSize: 'TODOS',
      foodType: 'SECO',
      coadjuvanteCondition: null,
      sourceUrl: 'https://premierpet.com.br/produto/premier-selecao-natural-gatos-adultos-frango/',
      sourceDocumentUrl: destPdfRel,
      frontLabelImageUrl: destImgRel,
      analyzedBatch: 'LOTE-WEB-2026-09',
      labelCollectionDate: new Date('2026-09-13T11:57:00Z'),
      curatorResponsible: 'Curadoria Técnica',

      moistureMaxPct: garantias.umidadeMaxPct,
      crudeProteinMinPct: garantias.proteinaBrutaMinPct,
      etherExtractMinPct: garantias.extratoEtereoMinPct,
      crudeFiberMaxPct: garantias.materiaFibrosaMaxPct,
      mineralMatterMaxPct: garantias.materiaMineralMaxPct,
      calciumMinPct: garantias.calcioMinPct,
      calciumMaxPct: garantias.calcioMaxPct,
      phosphorusMinPct: garantias.fosforoMinPct,
      sodiumMinPct: garantias.sodioMinPct,
      omega3MinPct: garantias.omega3MinPct,

      meatClaimType: 'COM_CARNE',
      containsGmo: false,
      gmoIngredients: null,
      antioxidantType: 'NATURAL',
      topIngredients: JSON.stringify(topIngredientesList),
      editorialOpinion:
        'Alimento Super Premium da linha Seleção Natural para gatos adultos, elaborado com proteína Korin (criada sem antibióticos nem promotores de crescimento), ovos cage-free e complexo de 8 vegetais. Formulação de alta densidade nutricional e energética (4.082 kcal/kg), com conservantes 100% naturais e livre de ingredientes transgênicos.',

      scoreTotal: audit.scoreTotal,
      classificationTier: audit.classificacaoFaixa,
      scoreBreakdown: audit.extratoPontos as any,
      calculatedAt: new Date(),
      isPublished: true,
    },
  });

  console.log('\n--- PRODUTO REGISTRADO COM SUCESSO ---');
  console.log('ID:', product.id);
  console.log('Nome:', product.commercialName);
  console.log('Slug:', product.slug);
  console.log('Score:', product.scoreTotal, product.classificationTier);
  console.log('Imagem:', product.frontLabelImageUrl);
  console.log('PDF:', product.sourceDocumentUrl);
  console.log('SHA256:', sha256);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
