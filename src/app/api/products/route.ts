import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calcularScoreAnaliseRotulo } from '@/lib/audit-engine';
import { productInputSchema } from '@/lib/schemas/product';
import { stripWeightFromTitle } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const species = searchParams.get('species');
    const legalCategory = searchParams.get('legalCategory');
    const classificationTier = searchParams.get('tier');
    const q = searchParams.get('q')?.trim();

    const where: any = {};

    if (species && species !== 'todos') {
      where.species = species;
    }

    if (legalCategory && legalCategory !== 'todos') {
      where.legalCategory = legalCategory;
    }

    if (classificationTier && classificationTier !== 'todos') {
      where.classificationTier = classificationTier;
    }

    if (q) {
      where.OR = [
        { commercialName: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { analyzedBatch: { contains: q, mode: 'insensitive' } },
        { manufacturerLegalName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        affiliateLinks: true,
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Erro ao listar produtos no admin:', error);
    return NextResponse.json({ error: 'Erro ao listar produtos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'curador')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    const parsed = productInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Dados do produto inválidos.';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const body = parsed.data;
    body.commercialName = stripWeightFromTitle(body.commercialName);

    // Se for alimento completo, calcula determinístico
    const isCoadjuvante = body.legalCategory === 'ALIMENTO_COADJUVANTE';

    const audit = calcularScoreAnaliseRotulo(
      body.species,
      body.lifeStage,
      {
        umidadeMaxPct: body.moistureMaxPct ?? 10,
        proteinaBrutaMinPct: body.crudeProteinMinPct ?? 0,
        extratoEtereoMinPct: body.etherExtractMinPct ?? 0,
        materiaFibrosaMaxPct: body.crudeFiberMaxPct ?? 0,
        materiaMineralMaxPct: body.mineralMatterMaxPct ?? 0,
        calcioMinPct: body.calciumMinPct ?? 0,
        calcioMaxPct: body.calciumMaxPct ?? null,
        fosforoMinPct: body.phosphorusMinPct ?? 0,
        sodioMinPct: body.sodiumMinPct ?? null,
        omega3MinPct: body.omega3MinPct ?? null,
      },
      {
        topIngredientes: Array.isArray(body.topIngredients)
          ? body.topIngredients
          : (body.topIngredients || '').split(',').map((s: string) => s.trim()),
        antioxidanteTipo: body.antioxidantType || 'NATURAL',
        omega3OuPrebioticosGarantidos: body.omega3OuPrebioticosGarantidos ?? true,
        claimCarneTipo: (body.meatClaimType as any) || 'NENHUM',
        claimCarneAdequado: body.claimCarneAdequado ?? true,
      }
    );

    // Gerar slug amigável único
    let slug = body.slug?.trim() || body.commercialName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Verificar se já existe produto cadastrado com este slug ou nome comercial
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { slug },
          { commercialName: { equals: body.commercialName.trim(), mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        commercialName: true,
        brand: true,
        slug: true,
      },
    });

    if (existingProduct && !body.forceDuplicate) {
      return NextResponse.json(
        {
          error: `Já existe um produto cadastrado com este nome comercial ou slug: "${existingProduct.commercialName}".`,
          duplicateProduct: existingProduct,
        },
        { status: 409 }
      );
    }

    if (existingProduct && body.forceDuplicate) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const product = await prisma.product.create({
      data: {
        id: body.id ? String(body.id).trim() : undefined,
        slug,
        commercialName: body.commercialName,
        brand: body.brand,
        manufacturerLegalName: body.manufacturerLegalName || '',
        legalCategory: body.legalCategory || 'ALIMENTO_COMPLETO',
        species: body.species,
        lifeStage: body.lifeStage,
        breedSize: body.breedSize || 'TODOS',
        foodType: body.foodType || 'SECO',
        coadjuvanteCondition: isCoadjuvante ? body.coadjuvanteCondition : null,
        sourceUrl: body.sourceUrl || '',
        sourceArchiveUrl: body.sourceArchiveUrl || null,
        sourceDocumentUrl: body.sourceDocumentUrl || null,
        analyzedBatch: body.analyzedBatch || null,
        labelCollectionDate: new Date(body.labelCollectionDate || Date.now()),
        frontLabelImageUrl: body.frontLabelImageUrl || null,
        backLabelImageUrl: body.backLabelImageUrl || null,
        curatorResponsible: session.name || session.email,

        moistureMaxPct: body.moistureMaxPct ?? 10,
        crudeProteinMinPct: body.crudeProteinMinPct ?? 0,
        etherExtractMinPct: body.etherExtractMinPct ?? 0,
        crudeFiberMaxPct: body.crudeFiberMaxPct ?? 0,
        mineralMatterMaxPct: body.mineralMatterMaxPct ?? 0,
        calciumMinPct: body.calciumMinPct ?? 0,
        calciumMaxPct: body.calciumMaxPct ?? null,
        phosphorusMinPct: body.phosphorusMinPct ?? 0,
        sodiumMinPct: body.sodiumMinPct ?? null,
        omega3MinPct: body.omega3MinPct ?? null,

        meatClaimType: body.meatClaimType || 'NENHUM',
        containsGmo: Boolean(body.containsGmo),
        gmoIngredients: body.gmoIngredients || null,
        antioxidantType: body.antioxidantType || 'NATURAL',
        topIngredients: typeof body.topIngredients === 'string' ? body.topIngredients : JSON.stringify(body.topIngredients),
        editorialOpinion: body.editorialOpinion || audit.parecerSugerido,

        scoreTotal: isCoadjuvante ? null : audit.scoreTotal,
        classificationTier: isCoadjuvante ? 'COADJUVANTE' : audit.classificacaoFaixa,
        scoreBreakdown: isCoadjuvante ? null : (audit.extratoPontos as any),
        calculatedAt: new Date(),
        isPublished: body.isPublished ?? true,
      },
    });

    // Vincula lojas e links do produto se informados
    const validLinks = Array.isArray(body.affiliateLinks)
      ? body.affiliateLinks.filter((l: any) => l && l.store?.trim() && l.productUrl?.trim())
      : [];

    if (validLinks.length > 0) {
      await prisma.affiliateLink.createMany({
        data: validLinks.map((l: any) => ({
          productId: product.id,
          store: l.store.trim(),
          productUrl: l.productUrl.trim(),
          affiliateUrl: l.affiliateUrl?.trim() || l.productUrl.trim(),
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Erro ao cadastrar produto analisado:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar produto analisado' }, { status: 500 });
  }
}
