import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed do PetRankings ---');

  // Limpar tabelas existentes em ordem
  await prisma.contactRateLimit.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.rankingProduct.deleteMany();
  await prisma.productStore.deleteMany();
  await prisma.product.deleteMany();
  await prisma.ranking.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar Usuário Administrador
  const passwordHash = await bcrypt.hash('admin123456', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@petrankings.com.br',
      name: 'Administrador PetRankings',
      passwordHash,
      role: 'admin',
    },
  });
  console.log('✓ Administrador criado:', admin.email);

  // 2. Rankings
  const r1 = await prisma.ranking.create({
    data: {
      title: 'Melhores Rações Secas para Cães Adultos',
      slug: 'melhores-racoes-secas-para-caes-adultos',
      species: 'caes',
      productType: 'Ração seca',
      description: 'Comparativo carinhoso e transparente das rações secas mais recomendadas para cães adultos, avaliadas pelo sabor, qualidade dos ingredientes e satisfação de tutores em todo o Brasil.',
      isPublished: true,
      dataUpdatedAt: new Date(),
    },
  });

  const r2 = await prisma.ranking.create({
    data: {
      title: 'Melhores Brinquedos Interativos e Mordedores para Cães',
      slug: 'melhores-brinquedos-interativos-e-mordedores-para-caes',
      species: 'caes',
      productType: 'Brinquedo',
      description: 'Os brinquedos e mordedores mais resistentes e divertidos para gastar energia, estimular a inteligência e deixar o seu cão muito mais feliz.',
      isPublished: true,
      dataUpdatedAt: new Date(),
    },
  });

  const r3 = await prisma.ranking.create({
    data: {
      title: 'Melhores Petiscos e Snacks Funcionais para Cães',
      slug: 'melhores-petiscos-e-snacks-funcionais-para-caes',
      species: 'caes',
      productType: 'Petisco',
      description: 'Snacks deliciosos e saudáveis perfeitos para adestramento, momentos de agrado e cuidado com os dentes do seu cão.',
      isPublished: true,
      dataUpdatedAt: new Date(),
    },
  });

  const r4 = await prisma.ranking.create({
    data: {
      title: 'Melhores Areias Sanitárias e Granulados para Gatos',
      slug: 'melhores-areias-sanitarias-e-granulados-para-gatos',
      species: 'gatos',
      productType: 'Areia',
      description: 'Guia das areias vegetais, minerais e biodegradáveis mais elogiadas pelo controle de odores, formação de torrões firmes e facilidade de limpeza.',
      isPublished: true,
      dataUpdatedAt: new Date(),
    },
  });

  const r5 = await prisma.ranking.create({
    data: {
      title: 'Melhores Rações Secas para Gatos Castrados',
      slug: 'melhores-racoes-secas-para-gatos-castrados',
      species: 'gatos',
      productType: 'Ração seca',
      description: 'As rações mais completas em controle de peso e saúde do trato urinário para manter seu gatinho castrado ativo, saudável e ronronando.',
      isPublished: true,
      dataUpdatedAt: new Date(),
    },
  });

  const r6 = await prisma.ranking.create({
    data: {
      title: 'Melhores Brinquedos e Varinhas para Gatos',
      slug: 'melhores-brinquedos-e-varinhas-para-gatos',
      species: 'gatos',
      productType: 'Brinquedo',
      description: 'Varinhas, túneis e circuitos interativos para despertar o instinto de caçador do seu felino e encher o dia a dia de brincadeiras.',
      isPublished: true,
      dataUpdatedAt: new Date(),
    },
  });

  const r7_draft = await prisma.ranking.create({
    data: {
      title: 'Melhores Arranhadores e Torres Verticais para Gatos',
      slug: 'melhores-arranhadores-e-torres-verticais-para-gatos',
      species: 'gatos',
      productType: 'Arranhador',
      description: 'Em fase de análise: torres e arranhadores de sisal confortáveis para afiar as unhas e proteger os móveis da sua casa.',
      isPublished: false,
      dataUpdatedAt: new Date(),
    },
  });

  console.log('✓ Rankings criados com sucesso.');

  // Função auxiliar de cálculo e criação de produto
  async function createProductWithStores(data: {
    title: string;
    species: string;
    productType: string;
    brand: string;
    description: string;
    imageUrl: string;
    rankings: string[]; // IDs de rankings
    stores: Array<{
      store: string;
      productUrl: string;
      affiliateUrl?: string;
      rating: number;
      reviewCount: number;
    }>;
  }) {
    // Calcular média
    const validRatings = data.stores.map((s) => s.rating).filter((r) => r >= 0 && r <= 5);
    const avg = validRatings.length > 0
      ? Math.round((validRatings.reduce((a, b) => a + b, 0) / validRatings.length) * 100) / 100
      : null;

    const prod = await prisma.product.create({
      data: {
        title: data.title,
        species: data.species,
        productType: data.productType,
        brand: data.brand,
        description: data.description,
        imageUrl: data.imageUrl,
        averageRating: avg,
        ratingUpdatedAt: new Date(),
        stores: {
          create: data.stores.map((s) => ({
            store: s.store,
            productUrl: s.productUrl,
            affiliateUrl: s.affiliateUrl || s.productUrl,
            rating: s.rating,
            reviewCount: s.reviewCount,
          })),
        },
        rankings: {
          create: data.rankings.map((rid) => ({
            rankingId: rid,
          })),
        },
      },
    });

    return prod;
  }

  // --- PRODUTOS PARA CÃES: RAÇÃO SECA ---
  await createProductWithStores({
    title: 'Ração Royal Canin Maxi Adult para Cães Adultos de Porte Grande',
    species: 'caes',
    productType: 'Ração seca',
    brand: 'Royal Canin',
    description: 'Fórmula exclusiva com suporte às articulações e ossos pesados, alta digestibilidade com proteínas de alta qualidade e fibras equilibradas.',
    imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80',
    rankings: [r1.id],
    stores: [
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B07BNX9912', rating: 4.8, reviewCount: 1420 },
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/racao-royal-canin-maxi-adult/p', rating: 4.9, reviewCount: 2100 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/racao-royal-canin-maxi-adult/p', rating: 4.8, reviewCount: 980 },
      { store: 'mercadolivre', productUrl: 'https://produto.mercadolivre.com.br/MLB-royal-canin-maxi', rating: 4.7, reviewCount: 850 },
    ],
  });

  await createProductWithStores({
    title: 'Ração PremieR Formula Cães Adultos Porte Médio Sabor Frango',
    species: 'caes',
    productType: 'Ração seca',
    brand: 'PremieR Pet',
    description: 'Alimento Super Premium balanceado para manutenção da pelagem brilhante, fezes firmes com odor reduzido e suporte à imunidade.',
    imageUrl: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600&auto=format&fit=crop&q=80',
    rankings: [r1.id],
    stores: [
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/racao-premier-formula-caes-adultos/p', rating: 4.8, reviewCount: 3200 },
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B07L5P4912', rating: 4.7, reviewCount: 1850 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/racao-premier-adulto-medio/p', rating: 4.7, reviewCount: 1200 },
      { store: 'shopee', productUrl: 'https://shopee.com.br/racao-premier-medio', rating: 4.6, reviewCount: 620 },
    ],
  });

  await createProductWithStores({
    title: 'Ração Golden Formula Cães Adultos Frango e Arroz',
    species: 'caes',
    productType: 'Ração seca',
    brand: 'Golden',
    description: 'Ração Premium Especial com excelente relação custo-benefício, ingredientes selecionados sem corantes artificiais e saúde do trato digestivo.',
    imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&auto=format&fit=crop&q=80',
    rankings: [r1.id],
    stores: [
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B07P4Q7712', rating: 4.6, reviewCount: 5400 },
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/racao-golden-formula-frango-arroz/p', rating: 4.7, reviewCount: 4800 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/racao-golden-frango/p', rating: 4.6, reviewCount: 3100 },
      { store: 'mercadolivre', productUrl: 'https://produto.mercadolivre.com.br/MLB-golden-formula-frango', rating: 4.6, reviewCount: 2300 },
    ],
  });

  await createProductWithStores({
    title: "Ração Hill's Science Diet Cães Adultos Pedaços Pequenos",
    species: 'caes',
    productType: 'Ração seca',
    brand: "Hill's",
    description: 'Nutrição precisamente balanceada para cães que preferem grãos menores. Rica em antioxidantes clinicamente comprovados e ômega-6.',
    imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=80',
    rankings: [r1.id],
    stores: [
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B07K3V9912', rating: 4.8, reviewCount: 920 },
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/racao-hills-science-diet-pedacos-pequenos/p', rating: 4.9, reviewCount: 1150 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/racao-hills-adulto/p', rating: 4.8, reviewCount: 640 },
    ],
  });

  // --- PRODUTOS PARA CÃES: BRINQUEDOS ---
  await createProductWithStores({
    title: 'Brinquedo Dispenser de Petiscos Kong Classic Vermelho',
    species: 'caes',
    productType: 'Brinquedo',
    brand: 'KONG',
    description: 'O padrão ouro mundial em brinquedos para cães. Borracha natural ultra-resistente com quique imprevisível e compartimento para rechear.',
    imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600&auto=format&fit=crop&q=80',
    rankings: [r2.id],
    stores: [
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B0002AR0I8', rating: 4.9, reviewCount: 8900 },
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/brinquedo-kong-classic/p', rating: 4.9, reviewCount: 4100 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/kong-classic-vermelho/p', rating: 4.8, reviewCount: 2300 },
      { store: 'shopee', productUrl: 'https://shopee.com.br/kong-classic-original', rating: 4.7, reviewCount: 1500 },
    ],
  });

  await createProductWithStores({
    title: 'Mordedor Benebone Wishbone Sabor Bacon para Cães',
    species: 'caes',
    productType: 'Brinquedo',
    brand: 'Benebone',
    description: 'Mordedor ergonômico feito de nylon durável impregnado com bacon de verdade. Desenvolvido para cães com mastigação moderada a intensa.',
    imageUrl: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=600&auto=format&fit=crop&q=80',
    rankings: [r2.id],
    stores: [
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B00CPDWT2M', rating: 4.8, reviewCount: 3400 },
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/mordedor-benebone-wishbone-bacon/p', rating: 4.8, reviewCount: 1900 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/benebone-wishbone-bacon/p', rating: 4.7, reviewCount: 850 },
    ],
  });

  await createProductWithStores({
    title: 'Bola Resistente Chuckit! Ultra Ball Média',
    species: 'caes',
    productType: 'Brinquedo',
    brand: 'Chuckit!',
    description: 'Borracha natural de alta visibilidade e durabilidade com quique elevado e capacidade de flutuar na água. Fácil de limpar.',
    imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&auto=format&fit=crop&q=80',
    rankings: [r2.id],
    stores: [
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B000F4AVPA', rating: 4.8, reviewCount: 2100 },
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/bola-chuckit-ultra-ball/p', rating: 4.8, reviewCount: 1200 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/chuckit-ultra-ball/p', rating: 4.7, reviewCount: 910 },
    ],
  });

  // --- PRODUTOS PARA CÃES: PETISCOS ---
  await createProductWithStores({
    title: 'Petisco Dentalife Cães Adultos Porte Médio',
    species: 'caes',
    productType: 'Petisco',
    brand: 'Purina',
    description: 'Petisco funcional com textura porosa patenteada que limpa até os dentes mais difíceis de alcançar, reduzindo tártaro sem aditivos artificiais.',
    imageUrl: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=600&auto=format&fit=crop&q=80',
    rankings: [r3.id],
    stores: [
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B07F2W8812', rating: 4.8, reviewCount: 6200 },
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/petisco-purina-dentalife-medio/p', rating: 4.8, reviewCount: 3800 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/dentalife-purina-caes/p', rating: 4.7, reviewCount: 1400 },
    ],
  });

  await createProductWithStores({
    title: 'Petisco Pedigree Dentastix Cuidado Oral Diário',
    species: 'caes',
    productType: 'Petisco',
    brand: 'Pedigree',
    description: 'Barra dental com formato em X que ajuda a manter gengivas saudáveis e previne o acúmulo de placa bacteriana quando oferecido diariamente.',
    imageUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=600&auto=format&fit=crop&q=80',
    rankings: [r3.id],
    stores: [
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B0762G1112', rating: 4.6, reviewCount: 12000 },
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/petisco-pedigree-dentastix-medio/p', rating: 4.6, reviewCount: 8900 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/dentastix-pedigree/p', rating: 4.5, reviewCount: 4200 },
    ],
  });

  // --- PRODUTOS PARA GATOS: AREIAS SANITÁRIAS ---
  await createProductWithStores({
    title: 'Areia Sanitária Viva Verde Limpeza Completa Grãos Finos',
    species: 'gatos',
    productType: 'Areia',
    brand: 'Viva Verde',
    description: 'Granulado sanitário 100% natural feito de milho e mandioca. Forma torrão instantâneo e ultra firme, cor clara para monitoramento de urina e zero poeira.',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    rankings: [r4.id],
    stores: [
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/areia-viva-verde-limpeza-completa/p', rating: 4.9, reviewCount: 6800 },
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B07N4T8812', rating: 4.8, reviewCount: 4300 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/areia-viva-verde-fina/p', rating: 4.8, reviewCount: 3100 },
      { store: 'shopee', productUrl: 'https://shopee.com.br/areia-viva-verde-completa', rating: 4.7, reviewCount: 2400 },
    ],
  });

  await createProductWithStores({
    title: 'Areia Higiênica Katbom Grãos Finos 100% Natural Biodegradável',
    species: 'gatos',
    productType: 'Areia',
    brand: 'Katbom',
    description: 'Composto orgânico de origem vegetal. Pode ser descartado no vaso sanitário, neutraliza odores de forma rápida e não gruda nas patinhas.',
    imageUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&auto=format&fit=crop&q=80',
    rankings: [r4.id],
    stores: [
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B07K6Q1112', rating: 4.7, reviewCount: 3900 },
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/areia-katbom-graos-finos/p', rating: 4.8, reviewCount: 4200 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/katbom-natural/p', rating: 4.7, reviewCount: 1800 },
    ],
  });

  await createProductWithStores({
    title: 'Areia Higiênica Pipicat Classic Tradicional',
    species: 'gatos',
    productType: 'Areia',
    brand: 'Pipicat',
    description: 'Areia à base de argila esmectita natural, líder em vendas no Brasil. Alto poder de absorção e excelente custo para casas com múltiplos gatos.',
    imageUrl: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&auto=format&fit=crop&q=80',
    rankings: [r4.id],
    stores: [
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B0762F9912', rating: 4.5, reviewCount: 14500 },
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/areia-pipicat-classic/p', rating: 4.6, reviewCount: 11200 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/pipicat-classic-tradicional/p', rating: 4.5, reviewCount: 6800 },
      { store: 'shopee', productUrl: 'https://shopee.com.br/pipicat-classic-areia', rating: 4.4, reviewCount: 8200 },
    ],
  });

  // --- PRODUTOS PARA GATOS: RAÇÃO SECA ---
  await createProductWithStores({
    title: 'Ração Royal Canin Feline Health Nutrition Sterilised para Gatos Castrados',
    species: 'gatos',
    productType: 'Ração seca',
    brand: 'Royal Canin',
    description: 'Teor calórico rigorosamente moderado para prevenir o ganho de peso pós-castração, equilíbrio mineral que favorece a saúde do sistema urinário e alto teor proteico.',
    imageUrl: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=600&auto=format&fit=crop&q=80',
    rankings: [r5.id],
    stores: [
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/racao-royal-canin-sterilised-gatos/p', rating: 4.9, reviewCount: 4300 },
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B0791N3312', rating: 4.8, reviewCount: 2900 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/royal-canin-gatos-castrados/p', rating: 4.8, reviewCount: 1800 },
    ],
  });

  await createProductWithStores({
    title: 'Ração PremieR Gatos Castrados Adultos Sabor Salmão',
    species: 'gatos',
    productType: 'Ração seca',
    brand: 'PremieR Pet',
    description: 'Alimento Super Premium rico em L-carnitina, calorias reduzidas, controle de bolas de pelos através de fibras especiais e complexo de saúde urinária.',
    imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&auto=format&fit=crop&q=80',
    rankings: [r5.id],
    stores: [
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/racao-premier-gatos-castrados-salmao/p', rating: 4.8, reviewCount: 5100 },
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B07K3B7712', rating: 4.7, reviewCount: 3200 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/premier-gatos-castrados-salmao/p', rating: 4.7, reviewCount: 2100 },
    ],
  });

  await createProductWithStores({
    title: 'Ração Golden Formula Gatos Castrados Sabor Frango',
    species: 'gatos',
    productType: 'Ração seca',
    brand: 'Golden',
    description: 'Ração Premium Especial com minerais balanceados para trato urinário saudável, controle de peso e rica em taurina para visão e coração fortes.',
    imageUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600&auto=format&fit=crop&q=80',
    rankings: [r5.id],
    stores: [
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B07N3K8812', rating: 4.6, reviewCount: 8400 },
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/racao-golden-gatos-castrados-frango/p', rating: 4.7, reviewCount: 7200 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/golden-gatos-castrados/p', rating: 4.6, reviewCount: 4500 },
    ],
  });

  // --- PRODUTOS PARA GATOS: BRINQUEDOS ---
  await createProductWithStores({
    title: 'Varinha com Penas Naturais e Guizo CatPlay',
    species: 'gatos',
    productType: 'Brinquedo',
    brand: 'CatPlay',
    description: 'Haste flexível e resistente de fibra de carbono com fio de aço e isca de penas naturais coloridas. Estimula o salto e o exercício físico diário.',
    imageUrl: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=600&auto=format&fit=crop&q=80',
    rankings: [r6.id],
    stores: [
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B07D3N2212', rating: 4.7, reviewCount: 2100 },
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/varinha-catplay-penas-guizo/p', rating: 4.7, reviewCount: 1800 },
      { store: 'shopee', productUrl: 'https://shopee.com.br/varinha-gato-penas', rating: 4.6, reviewCount: 3200 },
    ],
  });

  await createProductWithStores({
    title: 'Torre de Pistas com Bolinhas Interativas GiGwi',
    species: 'gatos',
    productType: 'Brinquedo',
    brand: 'GiGwi',
    description: 'Brinquedo em 3 níveis com esferas deslizantes que giram em alta velocidade. Mantém o gato entretido sozinho por longos períodos.',
    imageUrl: 'https://images.unsplash.com/photo-1513360309081-38f07627399e?w=600&auto=format&fit=crop&q=80',
    rankings: [r6.id],
    stores: [
      { store: 'amazon', productUrl: 'https://www.amazon.com.br/dp/B07P5R1112', rating: 4.8, reviewCount: 1400 },
      { store: 'petlove', productUrl: 'https://www.petlove.com.br/torre-de-pistas-gigwi/p', rating: 4.8, reviewCount: 980 },
      { store: 'cobasi', productUrl: 'https://www.cobasi.com.br/torre-de-bolinhas-gato/p', rating: 4.7, reviewCount: 620 },
    ],
  });

  // 3. Mensagens de contato iniciais de exemplo para a caixa de entrada
  await prisma.contactMessage.createMany({
    data: [
      {
        name: 'Dra. Mariana Costa',
        email: 'mariana.vet@exemplo.com.br',
        subject: 'Sugestão de inclusão de rações renais para gatos',
        message: 'Olá equipe do PetRankings! Acompanho o site e gostaria de parabenizar pela transparência da metodologia. Sugiro criarem uma categoria de rações coadjuvantes/renais para gatos idosos.',
        status: 'nova',
      },
      {
        name: 'Carlos Eduardo Silveira',
        email: 'carlos.silveira@exemplo.com.br',
        subject: 'Dúvida sobre link da Petlove na areia Viva Verde',
        message: 'Boa tarde! O link de vocês me direcionou para o pacote de 4kg, funcionou perfeitamente. Vocês pretendem incluir também comparação de comedouros automáticos?',
        status: 'lida',
      },
    ],
  });
  // 4. Slots de Publicidade Padrão
  const defaultAdSlots = [
    {
      slotKey: 'topo',
      name: 'Publicidade Topo (Header)',
      description: 'Exibida no topo das páginas logo abaixo do cabeçalho ou após a introdução principal.',
      isActive: false,
      code: '',
    },
    {
      slotKey: 'meio_produtos',
      name: 'Publicidade Meio dos Produtos (In-Feed)',
      description: 'Exibida de forma integrada entre os produtos nas listas de rankings comparativos.',
      isActive: false,
      code: '',
    },
    {
      slotKey: 'rodape',
      name: 'Publicidade Rodapé (Footer)',
      description: 'Exibida na parte inferior das páginas de rankings e institucionais antes do rodapé.',
      isActive: false,
      code: '',
    },
    {
      slotKey: 'lateral_artigo',
      name: 'Publicidade Lateral / Artigos',
      description: 'Exibida em barras laterais ou entre parágrafos de artigos informativos e institucionais.',
      isActive: false,
      code: '',
    },
    {
      slotKey: 'global_head',
      name: 'Script Global AdSense (Head)',
      description: 'Código de script assíncrono principal do Google AdSense (ex: verificação do site / auto ads).',
      isActive: false,
      code: '',
    },
  ];

  for (const slot of defaultAdSlots) {
    await prisma.adSlot.upsert({
      where: { slotKey: slot.slotKey },
      update: {},
      create: slot,
    });
  }
  console.log('✓ Slots de publicidade padrão inicializados.');

  console.log('--- Seed do PetRankings concluído com sucesso! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
