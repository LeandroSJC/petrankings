import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calcularScoreAnaliseRotulo } from '../src/lib/audit-engine';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed do Sistema de Análise Nutricional Pet Food V5 ---');

  // Limpeza prévia
  await prisma.manufacturerTicket.deleteMany();
  await prisma.affiliateLink.deleteMany();
  await prisma.product.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.contactRateLimit.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar Usuário Administrador / Curador
  const passwordHash = await bcrypt.hash('admin123456', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'leandrosantossjc@gmail.com',
      name: 'Leandro Santos',
      passwordHash,
      role: 'admin',
    },
  });
  console.log('✓ Administrador criado:', admin.email);

  // 2. Produtos Auditados
  const produtosSeed = [
    // -------------------------------------------------------------
    // CÃO ADULTO - SUPER PREMIUM (EXEMPLO AUDITADO V4)
    // -------------------------------------------------------------
    {
      slug: 'nutripet-super-premium-caes-adultos-frango-arroz',
      commercialName: 'Ração Super Premium Cães Adultos Frango e Arroz',
      brand: 'NutriPet',
      manufacturerLegalName: 'Indústria Brasileira de Alimentos Pet S/A',
      manufacturerCnpj: '00.000.000/0001-00',
      mapaRegistration: 'SP 000000-0',
      legalCategory: 'ALIMENTO_COMPLETO',
      species: 'CAO',
      lifeStage: 'ADULTO',
      breedSize: 'MEDIO_GRANDE',
      foodType: 'SECO',
      coadjuvanteCondition: null,
      analyzedBatch: 'LOTE-2026-BR-09',
      labelCollectionDate: new Date('2026-08-15'),
      frontLabelImageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=80',
      backLabelImageUrl: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=800&auto=format&fit=crop&q=80',
      curatorResponsible: 'adm_curadoria_01',
      // Garantias MN
      garantias: {
        umidadeMaxPct: 10.0,
        proteinaBrutaMinPct: 26.0,
        extratoEtereoMinPct: 14.0,
        materiaFibrosaMaxPct: 3.0,
        materiaMineralMaxPct: 7.5,
        calcioMinPct: 1.0,
        calcioMaxPct: 1.6,
        fosforoMinPct: 0.8,
        sodioMinPct: 0.22,
        omega3MinPct: 0.35,
      },
      // Rotulagem
      rotulagem: {
        topIngredientes: ['Farinha de vísceras de aves', 'Quirera de arroz', 'Gordura de frango'],
        antioxidanteTipo: 'NATURAL' as const,
        omega3OuPrebioticosGarantidos: true,
        claimCarneTipo: 'COM_CARNE' as const,
        claimCarneAdequado: true,
      },
      containsGmo: true,
      gmoIngredients: 'Milho transgênico (Bt), Soja transgênica (RR)',
      stores: [],
    },
    // -------------------------------------------------------------
    // CÃO ADULTO - PREMIER FORMULA (SUPER PREMIUM)
    // -------------------------------------------------------------
    {
      slug: 'premier-formula-caes-adultos-porte-medio-frango',
      commercialName: 'PremieR Formula Cães Adultos Porte Médio Sabor Frango',
      brand: 'PremieR Pet',
      manufacturerLegalName: 'Grandfood Indústria e Comércio Ltda',
      manufacturerCnpj: '02.435.845/0001-90',
      mapaRegistration: 'SP 05678-9',
      legalCategory: 'ALIMENTO_COMPLETO',
      species: 'CAO',
      lifeStage: 'ADULTO',
      breedSize: 'MEDIO_GRANDE',
      foodType: 'SECO',
      coadjuvanteCondition: null,
      analyzedBatch: 'LOTE-2026-PF-11',
      labelCollectionDate: new Date('2026-07-20'),
      frontLabelImageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80',
      backLabelImageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&auto=format&fit=crop&q=80',
      curatorResponsible: 'adm_curadoria_01',
      garantias: {
        umidadeMaxPct: 10.0,
        proteinaBrutaMinPct: 26.0,
        extratoEtereoMinPct: 14.0,
        materiaFibrosaMaxPct: 3.0,
        materiaMineralMaxPct: 7.0,
        calcioMinPct: 1.1,
        calcioMaxPct: 1.6,
        fosforoMinPct: 0.85,
        sodioMinPct: 0.2,
        omega3MinPct: 0.28,
      },
      rotulagem: {
        topIngredientes: ['Farinha de vísceras de frango', 'Quirera de arroz', 'Gordura de aves'],
        antioxidanteTipo: 'NATURAL' as const,
        omega3OuPrebioticosGarantidos: true,
        claimCarneTipo: 'COM_CARNE' as const,
        claimCarneAdequado: true,
      },
      containsGmo: false,
      gmoIngredients: null,
      stores: [],
    },
    // -------------------------------------------------------------
    // CÃO ADULTO - GOLDEN FORMULA (PREMIUM ESPECIAL)
    // -------------------------------------------------------------
    {
      slug: 'golden-formula-caes-adultos-frango-arroz',
      commercialName: 'Golden Formula Cães Adultos Sabor Frango e Arroz',
      brand: 'Golden',
      manufacturerLegalName: 'Grandfood Indústria e Comércio Ltda',
      manufacturerCnpj: '02.435.845/0001-90',
      mapaRegistration: 'SP 05678-9',
      legalCategory: 'ALIMENTO_COMPLETO',
      species: 'CAO',
      lifeStage: 'ADULTO',
      breedSize: 'TODOS',
      foodType: 'SECO',
      coadjuvanteCondition: null,
      analyzedBatch: 'LOTE-2026-GF-04',
      labelCollectionDate: new Date('2026-08-01'),
      frontLabelImageUrl: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=800&auto=format&fit=crop&q=80',
      backLabelImageUrl: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&auto=format&fit=crop&q=80',
      curatorResponsible: 'adm_curadoria_02',
      garantias: {
        umidadeMaxPct: 10.0,
        proteinaBrutaMinPct: 23.0,
        extratoEtereoMinPct: 12.0,
        materiaFibrosaMaxPct: 3.5,
        materiaMineralMaxPct: 8.0,
        calcioMinPct: 1.0,
        calcioMaxPct: 1.8,
        fosforoMinPct: 0.8,
        sodioMinPct: 0.2,
        omega3MinPct: 0.15,
      },
      rotulagem: {
        topIngredientes: ['Farinha de vísceras de frango', 'Milho integral moído', 'Quirera de arroz'],
        antioxidanteTipo: 'SINTETICO' as const, // BHA/BHT
        omega3OuPrebioticosGarantidos: false,
        claimCarneTipo: 'SABOR_CARNE' as const,
        claimCarneAdequado: true,
      },
      containsGmo: true,
      gmoIngredients: 'Milho transgênico (Bt), Soja transgênica (RR)',
      stores: [],
    },
    // -------------------------------------------------------------
    // CÃO ADULTO - PEDIGREE NUTRIÇÃO COMPLETA (ECONÔMICO)
    // -------------------------------------------------------------
    {
      slug: 'pedigree-nutricao-completa-caes-adultos-carne-vegetais',
      commercialName: 'Pedigree Nutrição Completa Cães Adultos Carne e Vegetais',
      brand: 'Pedigree',
      manufacturerLegalName: 'Mars Brasil Alimentos Ltda',
      manufacturerCnpj: '61.833.007/0001-38',
      mapaRegistration: 'SP 01234-5',
      legalCategory: 'ALIMENTO_COMPLETO',
      species: 'CAO',
      lifeStage: 'ADULTO',
      breedSize: 'TODOS',
      foodType: 'SECO',
      coadjuvanteCondition: null,
      analyzedBatch: 'LOTE-2026-PD-88',
      labelCollectionDate: new Date('2026-06-10'),
      frontLabelImageUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&auto=format&fit=crop&q=80',
      backLabelImageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop&q=80',
      curatorResponsible: 'adm_curadoria_02',
      garantias: {
        umidadeMaxPct: 12.0,
        proteinaBrutaMinPct: 21.0,
        extratoEtereoMinPct: 8.0,
        materiaFibrosaMaxPct: 4.0,
        materiaMineralMaxPct: 10.0,
        calcioMinPct: 1.0,
        calcioMaxPct: 2.4,
        fosforoMinPct: 0.9,
        sodioMinPct: 0.3,
        omega3MinPct: 0.05,
      },
      rotulagem: {
        topIngredientes: ['Milho integral moído', 'Farinha de carne e ossos de bovino', 'Farelo de trigo'],
        antioxidanteTipo: 'SINTETICO' as const,
        omega3OuPrebioticosGarantidos: false,
        claimCarneTipo: 'SABOR_CARNE' as const,
        claimCarneAdequado: true,
      },
      containsGmo: true,
      gmoIngredients: 'Milho e soja geneticamente modificados',
      stores: [],
    },
    // -------------------------------------------------------------
    // CÃO FILHOTE - PREMIER FORMULA FILHOTES (SUPER PREMIUM)
    // -------------------------------------------------------------
    {
      slug: 'premier-formula-caes-filhotes-frango',
      commercialName: 'PremieR Formula Cães Filhotes Frango e Arroz',
      brand: 'PremieR Pet',
      manufacturerLegalName: 'Grandfood Indústria e Comércio Ltda',
      manufacturerCnpj: '02.435.845/0001-90',
      mapaRegistration: 'SP 05678-9',
      legalCategory: 'ALIMENTO_COMPLETO',
      species: 'CAO',
      lifeStage: 'CRESCIMENTO_INICIAL',
      breedSize: 'TODOS',
      foodType: 'SECO',
      coadjuvanteCondition: null,
      analyzedBatch: 'LOTE-2026-PFF-03',
      labelCollectionDate: new Date('2026-08-05'),
      frontLabelImageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80',
      backLabelImageUrl: null,
      curatorResponsible: 'adm_curadoria_01',
      garantias: {
        umidadeMaxPct: 10.0,
        proteinaBrutaMinPct: 29.0,
        extratoEtereoMinPct: 18.0,
        materiaFibrosaMaxPct: 2.5,
        materiaMineralMaxPct: 7.5,
        calcioMinPct: 1.2,
        calcioMaxPct: 1.6,
        fosforoMinPct: 0.95,
        sodioMinPct: 0.22,
        omega3MinPct: 0.4,
      },
      rotulagem: {
        topIngredientes: ['Farinha de vísceras de frango', 'Quirera de arroz', 'Gordura de frango'],
        antioxidanteTipo: 'NATURAL' as const,
        omega3OuPrebioticosGarantidos: true,
        claimCarneTipo: 'COM_CARNE' as const,
        claimCarneAdequado: true,
      },
      containsGmo: false,
      gmoIngredients: null,
      stores: [],
    },
    // -------------------------------------------------------------
    // GATO ADULTO - PREMIER GATOS CASTRADOS (SUPER PREMIUM)
    // -------------------------------------------------------------
    {
      slug: 'premier-gatos-castrados-adultos-salmao',
      commercialName: 'PremieR Gatos Castrados Adultos Sabor Salmão',
      brand: 'PremieR Pet',
      manufacturerLegalName: 'Grandfood Indústria e Comércio Ltda',
      manufacturerCnpj: '02.435.845/0001-90',
      mapaRegistration: 'SP 05678-9',
      legalCategory: 'ALIMENTO_COMPLETO',
      species: 'GATO',
      lifeStage: 'ADULTO',
      breedSize: 'TODOS',
      foodType: 'SECO',
      coadjuvanteCondition: null,
      analyzedBatch: 'LOTE-2026-PGC-22',
      labelCollectionDate: new Date('2026-07-28'),
      frontLabelImageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&auto=format&fit=crop&q=80',
      backLabelImageUrl: null,
      curatorResponsible: 'adm_curadoria_01',
      garantias: {
        umidadeMaxPct: 10.0,
        proteinaBrutaMinPct: 36.0,
        extratoEtereoMinPct: 12.0,
        materiaFibrosaMaxPct: 4.5,
        materiaMineralMaxPct: 7.5,
        calcioMinPct: 1.1,
        calcioMaxPct: 1.4,
        fosforoMinPct: 0.85,
        sodioMinPct: 0.25,
        omega3MinPct: 0.35,
      },
      rotulagem: {
        topIngredientes: ['Farinha de salmão', 'Farinha de vísceras de frango', 'Quirera de arroz'],
        antioxidanteTipo: 'NATURAL' as const,
        omega3OuPrebioticosGarantidos: true,
        claimCarneTipo: 'COM_CARNE' as const,
        claimCarneAdequado: true,
      },
      containsGmo: false,
      gmoIngredients: null,
      stores: [],
    },
    // -------------------------------------------------------------
    // GATO FILHOTE - ROYAL CANIN KITTEN (SUPER PREMIUM)
    // -------------------------------------------------------------
    {
      slug: 'royal-canin-kitten-gatos-filhotes',
      commercialName: 'Royal Canin Feline Health Nutrition Kitten Gatos Filhotes',
      brand: 'Royal Canin',
      manufacturerLegalName: 'Royal Canin do Brasil Indústria e Comércio Ltda',
      manufacturerCnpj: '68.049.201/0001-44',
      mapaRegistration: 'SP 04321-2',
      legalCategory: 'ALIMENTO_COMPLETO',
      species: 'GATO',
      lifeStage: 'CRESCIMENTO_INICIAL',
      breedSize: 'TODOS',
      foodType: 'SECO',
      coadjuvanteCondition: null,
      analyzedBatch: 'LOTE-2026-RCK-90',
      labelCollectionDate: new Date('2026-08-10'),
      frontLabelImageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
      backLabelImageUrl: null,
      curatorResponsible: 'adm_curadoria_01',
      garantias: {
        umidadeMaxPct: 8.0,
        proteinaBrutaMinPct: 34.0,
        extratoEtereoMinPct: 16.0,
        materiaFibrosaMaxPct: 3.0,
        materiaMineralMaxPct: 8.0,
        calcioMinPct: 1.2,
        calcioMaxPct: 1.6,
        fosforoMinPct: 0.95,
        sodioMinPct: 0.3,
        omega3MinPct: 0.45,
      },
      rotulagem: {
        topIngredientes: ['Farinha de vísceras de aves', 'Quirera de arroz', 'Gordura de frango'],
        antioxidanteTipo: 'NATURAL' as const,
        omega3OuPrebioticosGarantidos: true,
        claimCarneTipo: 'COM_CARNE' as const,
        claimCarneAdequado: true,
      },
      containsGmo: true,
      gmoIngredients: 'Milho geneticamente modificado',
      stores: [],
    },
    // -------------------------------------------------------------
    // ALIMENTO COADJUVANTE (PRESCRIÇÃO CLÍNICA - ISOLADO)
    // -------------------------------------------------------------
    {
      slug: 'royal-canin-veterinary-diet-renal-feline',
      commercialName: 'Royal Canin Veterinary Diet Renal Feline Alimento Coadjuvante Seco',
      brand: 'Royal Canin',
      manufacturerLegalName: 'Royal Canin do Brasil Indústria e Comércio Ltda',
      manufacturerCnpj: '68.049.201/0001-44',
      mapaRegistration: 'SP 04321-2',
      legalCategory: 'ALIMENTO_COADJUVANTE',
      species: 'GATO',
      lifeStage: 'ADULTO',
      breedSize: 'TODOS',
      foodType: 'SECO',
      coadjuvanteCondition: 'RENAL',
      analyzedBatch: 'LOTE-2026-VET-RN-01',
      labelCollectionDate: new Date('2026-08-12'),
      frontLabelImageUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&auto=format&fit=crop&q=80',
      backLabelImageUrl: null,
      curatorResponsible: 'adm_curadoria_01',
      garantias: {
        umidadeMaxPct: 8.0,
        proteinaBrutaMinPct: 21.0, // Fisiologicamente reduzida para poupar função renal
        extratoEtereoMinPct: 15.0,
        materiaFibrosaMaxPct: 3.5,
        materiaMineralMaxPct: 6.0,
        calcioMinPct: 0.6,
        calcioMaxPct: 0.9,
        fosforoMinPct: 0.35, // Rigorosamente baixo para retardar progressão da DRC
        sodioMinPct: 0.25,
        omega3MinPct: 0.8,
      },
      rotulagem: {
        topIngredientes: ['Quirera de arroz', 'Farinha de vísceras de aves', 'Gordura de frango'],
        antioxidanteTipo: 'NATURAL' as const,
        omega3OuPrebioticosGarantidos: true,
        claimCarneTipo: 'NENHUM' as const,
        claimCarneAdequado: true,
      },
      containsGmo: true,
      gmoIngredients: 'Milho transgênico (Bt)',
      stores: [],
    },
    {
      slug: 'hills-prescription-diet-cd-multicare-feline-urinario',
      commercialName: "Hill's Prescription Diet c/d Multicare Feline Urinário",
      brand: "Hill's",
      manufacturerLegalName: 'Colgate-Palmolive Divisão Pet Nutrition',
      manufacturerCnpj: '43.821.144/0001-19',
      mapaRegistration: 'SP 09876-1',
      legalCategory: 'ALIMENTO_COADJUVANTE',
      species: 'GATO',
      lifeStage: 'ADULTO',
      breedSize: 'TODOS',
      foodType: 'SECO',
      coadjuvanteCondition: 'URINARIO',
      analyzedBatch: 'LOTE-2026-HIL-CD-55',
      labelCollectionDate: new Date('2026-08-14'),
      frontLabelImageUrl: 'https://images.unsplash.com/photo-1513360309081-38f07627399e?w=800&auto=format&fit=crop&q=80',
      backLabelImageUrl: null,
      curatorResponsible: 'adm_curadoria_01',
      garantias: {
        umidadeMaxPct: 8.0,
        proteinaBrutaMinPct: 30.0,
        extratoEtereoMinPct: 14.0,
        materiaFibrosaMaxPct: 2.5,
        materiaMineralMaxPct: 6.5,
        calcioMinPct: 0.7,
        calcioMaxPct: 1.0,
        fosforoMinPct: 0.6,
        sodioMinPct: 0.35,
        omega3MinPct: 0.7,
      },
      rotulagem: {
        topIngredientes: ['Farinha de vísceras de frango', 'Quirera de arroz', 'Milho integral moído'],
        antioxidanteTipo: 'NATURAL' as const,
        omega3OuPrebioticosGarantidos: true,
        claimCarneTipo: 'NENHUM' as const,
        claimCarneAdequado: true,
      },
      containsGmo: true,
      gmoIngredients: 'Milho geneticamente modificado',
      stores: [],
    },
    // -------------------------------------------------------------
    // CÃO ADULTO - PREMIER GOURMET SACHÊ (ÚMIDO / SUPER PREMIUM)
    // -------------------------------------------------------------
    {
      slug: 'premier-gourmet-caes-peito-de-frango-e-arroz-sache',
      commercialName: 'PremieR Gourmet Sachê Cães Adultos Peito de Frango e Arroz',
      brand: 'PremieR Pet',
      manufacturerLegalName: 'Grandfood Indústria e Comércio Ltda',
      manufacturerCnpj: '02.435.845/0001-90',
      mapaRegistration: 'SP 05678-9',
      legalCategory: 'ALIMENTO_COMPLETO',
      species: 'CAO',
      lifeStage: 'ADULTO',
      breedSize: 'TODOS',
      foodType: 'UMIDO',
      coadjuvanteCondition: null,
      analyzedBatch: 'LOTE-2026-PG-04',
      labelCollectionDate: new Date('2026-08-10'),
      frontLabelImageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=80',
      backLabelImageUrl: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=800&auto=format&fit=crop&q=80',
      curatorResponsible: 'adm_curadoria_01',
      garantias: {
        umidadeMaxPct: 84.0,
        proteinaBrutaMinPct: 10.0,
        extratoEtereoMinPct: 1.5,
        materiaFibrosaMaxPct: 0.5,
        materiaMineralMaxPct: 1.5,
        calcioMinPct: 0.20,
        calcioMaxPct: 0.35,
        fosforoMinPct: 0.15,
        sodioMinPct: 0.05,
        omega3MinPct: 0.05,
      },
      rotulagem: {
        topIngredientes: ['Peito de frango', 'Quirera de arroz', 'Caldo de frango'],
        antioxidanteTipo: 'NATURAL' as const,
        omega3OuPrebioticosGarantidos: true,
        claimCarneTipo: 'COM_CARNE_FRESCA' as const,
        claimCarneAdequado: true,
      },
      containsGmo: false,
      gmoIngredients: null,
      stores: [],
    },
    // -------------------------------------------------------------
    // GATO ADULTO - ROYAL CANIN SENSORY TASTE SACHÊ (ÚMIDO / SUPER PREMIUM)
    // -------------------------------------------------------------
    {
      slug: 'royal-canin-sensory-taste-gatos-adultos-sache',
      commercialName: 'Royal Canin Sachê Gatos Adultos Sensory Taste ao Molho',
      brand: 'Royal Canin',
      manufacturerLegalName: 'Royal Canin do Brasil Indústria e Comércio Ltda',
      manufacturerCnpj: '60.840.017/0001-20',
      mapaRegistration: 'SP 00123-4',
      legalCategory: 'ALIMENTO_COMPLETO',
      species: 'GATO',
      lifeStage: 'ADULTO',
      breedSize: 'TODOS',
      foodType: 'UMIDO',
      coadjuvanteCondition: null,
      analyzedBatch: 'LOTE-2026-RC-08',
      labelCollectionDate: new Date('2026-08-05'),
      frontLabelImageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
      backLabelImageUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&auto=format&fit=crop&q=80',
      curatorResponsible: 'adm_curadoria_01',
      garantias: {
        umidadeMaxPct: 80.5,
        proteinaBrutaMinPct: 9.5,
        extratoEtereoMinPct: 3.0,
        materiaFibrosaMaxPct: 1.2,
        materiaMineralMaxPct: 1.5,
        calcioMinPct: 0.20,
        calcioMaxPct: 0.35,
        fosforoMinPct: 0.16,
        sodioMinPct: 0.13,
        omega3MinPct: 0.05,
      },
      rotulagem: {
        topIngredientes: ['Vísceras de frango', 'Carne de frango', 'Farinha de arroz'],
        antioxidanteTipo: 'NATURAL' as const,
        omega3OuPrebioticosGarantidos: true,
        claimCarneTipo: 'COM_CARNE' as const,
        claimCarneAdequado: true,
      },
      containsGmo: false,
      gmoIngredients: null,
      stores: [],
    },
  ];

  for (const item of produtosSeed) {
    const isCoadjuvante = item.legalCategory === 'ALIMENTO_COADJUVANTE';

    // Se for alimento completo, calcula o score determinístico
    // Se for alimento coadjuvante com formulação dietoterápica exclusiva, não concorre em rankings gerais competitivos
    const audit = calcularScoreAnaliseRotulo(
      item.species as any,
      item.lifeStage as any,
      item.garantias,
      item.rotulagem
    );

    const product = await prisma.product.create({
      data: {
        slug: item.slug,
        commercialName: item.commercialName,
        brand: item.brand,
        manufacturerLegalName: item.manufacturerLegalName,
        legalCategory: item.legalCategory,
        species: item.species,
        lifeStage: item.lifeStage,
        breedSize: item.breedSize,
        foodType: item.foodType,
        coadjuvanteCondition: item.coadjuvanteCondition,
        sourceUrl: (item as any).sourceUrl || `https://www.premierpet.com.br/produtos/${item.slug}`,
        sourceArchiveUrl: (item as any).sourceArchiveUrl || `https://web.archive.org/web/20260901120000/https://www.premierpet.com.br/produtos/${item.slug}`,
        sourceDocumentUrl: (item as any).sourceDocumentUrl || null,
        analyzedBatch: item.analyzedBatch || null,
        labelCollectionDate: item.labelCollectionDate,
        frontLabelImageUrl: item.frontLabelImageUrl,
        backLabelImageUrl: item.backLabelImageUrl || null,
        curatorResponsible: item.curatorResponsible,

        moistureMaxPct: item.garantias.umidadeMaxPct,
        crudeProteinMinPct: item.garantias.proteinaBrutaMinPct,
        etherExtractMinPct: item.garantias.extratoEtereoMinPct,
        crudeFiberMaxPct: item.garantias.materiaFibrosaMaxPct,
        mineralMatterMaxPct: item.garantias.materiaMineralMaxPct,
        calciumMinPct: item.garantias.calcioMinPct,
        calciumMaxPct: item.garantias.calcioMaxPct,
        phosphorusMinPct: item.garantias.fosforoMinPct,
        sodiumMinPct: item.garantias.sodioMinPct,
        omega3MinPct: item.garantias.omega3MinPct,

        meatClaimType: item.rotulagem.claimCarneTipo,
        containsGmo: item.containsGmo,
        gmoIngredients: item.gmoIngredients,
        antioxidantType: item.rotulagem.antioxidanteTipo,
        topIngredients: JSON.stringify(item.rotulagem.topIngredientes),
        editorialOpinion: isCoadjuvante
          ? `Alimento coadjuvante formulado com suporte clínico para ${item.coadjuvanteCondition}. Não concorre em rankings gerais de manutenção regular.`
          : audit.parecerSugerido,

        scoreTotal: isCoadjuvante ? null : audit.scoreTotal,
        classificationTier: isCoadjuvante ? 'COADJUVANTE' : audit.classificacaoFaixa,
        scoreBreakdown: isCoadjuvante ? null : (audit.extratoPontos as any),
        calculatedAt: new Date(),

        affiliateLinks: {
          create: (item.stores as { store: string; url: string }[]).map((s) => ({
            store: s.store,
            productUrl: s.url,
            affiliateUrl: s.url,
          })),
        },
      },
    });

    console.log(`✓ Produto [${product.species}] ${product.commercialName} -> Score: ${product.scoreTotal ?? 'Coadjuvante'} (${product.classificationTier})`);
  }

  // 3. Exemplo de Chamado do Canal do Fabricante (Right of Reply)
  const productNutri = await prisma.product.findFirst({ where: { slug: 'nutripet-super-premium-caes-adultos-frango-arroz' } });
  if (productNutri) {
    const ticket = await prisma.manufacturerTicket.create({
      data: {
        ticketNumber: 'PR-FAB-2026-0001',
        productId: productNutri.id,
        companyName: 'Indústria Brasileira de Alimentos Pet S/A',
        cnpj: '00.000.000/0001-00',
        mapaRegistration: 'SP 000000-0',
        requesterName: 'Dr. Roberto Almeida',
        requesterRole: 'Responsável Técnico (CRMV-SP 12345)',
        requesterEmail: 'roberto.almeida@nutripet.com.br',
        requesterPhone: '(11) 98765-4321',
        requestType: 'ATUALIZACAO_LOTE',
        message: 'Solicitamos a atualização cadastral referente ao lote 2026-BR-10, onde foi atualizado o teor de Ômega-3 para 0.40%. Segue documentação comprobatória com ART.',
        batchNumber: 'LOTE-2026-BR-10',
        status: 'ABERTO',
        slaDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 dias úteis
      },
    });
    console.log('✓ Chamado institucional do Fabricante (Right of Reply) criado:', ticket.ticketNumber);
  }

  // 4. Mensagem de contato institucional
  await prisma.contactMessage.create({
    data: {
      name: 'Dra. Camila Nogueira',
      email: 'camila.vet@exemplo.com.br',
      subject: 'Elogio à metodologia e transparência em MS',
      message: 'Parabéns à equipe do PetRankings pela implantação do cálculo determinístico em Matéria Seca e pela segregação estanque dos alimentos coadjuvantes. Essa transparência eleva o nível técnico do mercado pet brasileiro.',
      status: 'nova',
    },
  });

  console.log('--- Seed do Sistema de Análise Nutricional Pet Food V5 concluído com sucesso! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
