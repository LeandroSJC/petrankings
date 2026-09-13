import prisma from '../src/lib/prisma';
import { calcularScoreAnaliseRotulo } from '../src/lib/audit-engine';

async function main() {
  const productId = 'cmtz1b821396047531fbf837';
  const slug = 'premier-formula-gatos-adultos-frango';

  const garantias = {
    umidadeMaxPct: 10.0,
    proteinaBrutaMinPct: 31.5,
    extratoEtereoMinPct: 14.0,
    materiaFibrosaMaxPct: 3.5,
    materiaMineralMaxPct: 8.0,
    calcioMinPct: 0.7,
    calcioMaxPct: 1.5,
    fosforoMinPct: 0.6,
    sodioMinPct: 0.25,
    omega3MinPct: 0.25,
  };

  const topIngredientesList = [
    'Farinha de vísceras de frango',
    'Glúten de milho*',
    'Proteína concentrada de soja*',
    'Grão de milho*',
    'Quirera de arroz',
    'Polpa desidratada de beterraba',
    'Gordura de frango',
    'Biomassa de microalgas (Schizochytrium sp.)',
    'Cloreto de potássio',
    'Cloreto de sódio',
    'Levedura de cana-de-açúcar inativada e desidratada',
    'Ácido cítrico',
    'Bentonita',
    'BHA (Butilhidroxianisol)',
    'BHT (Butilhidroxitolueno)',
    'Cloreto de amônio',
    'DL-metionina',
    'Extrato de yucca (0,05%)',
    'Frutooligossacarídeos',
    'Galactoligossacarídeos',
    'Hexametafosfato de sódio (0,10%)',
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

  const audit = calcularScoreAnaliseRotulo(
    'GATO',
    'ADULTO',
    garantias,
    {
      topIngredientes: topIngredientesList.slice(0, 3),
      antioxidanteTipo: 'SINTETICO',
      omega3OuPrebioticosGarantidos: true,
      claimCarneTipo: 'COM_CARNE',
      claimCarneAdequado: true,
    }
  );

  console.log('Resultado do Score Adulto Frango:', audit.scoreTotal, audit.classificacaoFaixa);

  const product = await prisma.product.upsert({
    where: { id: productId },
    update: {
      slug,
      commercialName: 'PremieR Formula Gatos Adultos Sabor Frango',
      brand: 'PremieR',
      manufacturerLegalName: 'Grandfood Indústria e Comércio Ltda',
      legalCategory: 'ALIMENTO_COMPLETO',
      species: 'GATO',
      lifeStage: 'ADULTO',
      breedSize: 'TODOS',
      foodType: 'SECO',
      coadjuvanteCondition: null,
      sourceUrl: 'https://premierpet.com.br/produto/premier-formula-gatos-adultos-frango/',
      sourceDocumentUrl: `/uploads/ficha_${productId}.pdf`,
      frontLabelImageUrl: `/uploads/produto_${productId}.webp`,
      analyzedBatch: 'LOTE-WEB-2026-09',
      labelCollectionDate: new Date('2026-09-13T10:57:00Z'),
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
      containsGmo: true,
      gmoIngredients: 'Milho transgênico, Glúten de milho transgênico, Proteína concentrada de soja transgênica',
      antioxidantType: 'SINTETICO',
      topIngredients: JSON.stringify(topIngredientesList),
      editorialOpinion:
        'Alimento Super Premium nutricionalmente completo para gatos adultos não castrados, com alto teor calórico (4.016 kcal/kg), relação cálcio:fósforo equilibrada (1,17:1), porém formulado com conservantes sintéticos BHA/BHT e cereais transgênicos.',

      scoreTotal: audit.scoreTotal,
      classificationTier: audit.classificacaoFaixa,
      scoreBreakdown: audit.extratoPontos as any,
      calculatedAt: new Date(),
      isPublished: true,
    },
    create: {
      id: productId,
      slug,
      commercialName: 'PremieR Formula Gatos Adultos Sabor Frango',
      brand: 'PremieR',
      manufacturerLegalName: 'Grandfood Indústria e Comércio Ltda',
      legalCategory: 'ALIMENTO_COMPLETO',
      species: 'GATO',
      lifeStage: 'ADULTO',
      breedSize: 'TODOS',
      foodType: 'SECO',
      coadjuvanteCondition: null,
      sourceUrl: 'https://premierpet.com.br/produto/premier-formula-gatos-adultos-frango/',
      sourceDocumentUrl: `/uploads/ficha_${productId}.pdf`,
      frontLabelImageUrl: `/uploads/produto_${productId}.webp`,
      analyzedBatch: 'LOTE-WEB-2026-09',
      labelCollectionDate: new Date('2026-09-13T10:57:00Z'),
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
      containsGmo: true,
      gmoIngredients: 'Milho transgênico, Glúten de milho transgênico, Proteína concentrada de soja transgênica',
      antioxidantType: 'SINTETICO',
      topIngredients: JSON.stringify(topIngredientesList),
      editorialOpinion:
        'Alimento Super Premium nutricionalmente completo para gatos adultos não castrados, com alto teor calórico (4.016 kcal/kg), relação cálcio:fósforo equilibrada (1,17:1), porém formulado com conservantes sintéticos BHA/BHT e cereais transgênicos.',

      scoreTotal: audit.scoreTotal,
      classificationTier: audit.classificacaoFaixa,
      scoreBreakdown: audit.extratoPontos as any,
      calculatedAt: new Date(),
      isPublished: true,
    },
  });

  console.log('✓ Produto Adulto Frango cadastrado com sucesso!');
  console.log('ID:', product.id);
  console.log('Slug:', product.slug);
  console.log('Nome:', product.commercialName);
  console.log('Score:', product.scoreTotal, product.classificationTier);
  console.log('Imagem:', product.frontLabelImageUrl);
  console.log('PDF:', product.sourceDocumentUrl);
}

main()
  .catch((e) => {
    console.error('Erro ao cadastrar produto:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
