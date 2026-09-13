import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calcularScoreAnaliseRotulo } from '@/lib/audit-engine';

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

    const body = await req.json();

    // Se for alimento completo, calcula determinístico
    const isCoadjuvante = body.legalCategory === 'ALIMENTO_COADJUVANTE';

    const audit = calcularScoreAnaliseRotulo(
      body.species,
      body.lifeStage,
      {
        umidadeMaxPct: parseFloat(body.moistureMaxPct) || 10,
        proteinaBrutaMinPct: parseFloat(body.crudeProteinMinPct) || 0,
        extratoEtereoMinPct: parseFloat(body.etherExtractMinPct) || 0,
        materiaFibrosaMaxPct: parseFloat(body.crudeFiberMaxPct) || 0,
        materiaMineralMaxPct: parseFloat(body.mineralMatterMaxPct) || 0,
        calcioMinPct: parseFloat(body.calciumMinPct) || 0,
        calcioMaxPct: body.calciumMaxPct ? parseFloat(body.calciumMaxPct) : null,
        fosforoMinPct: parseFloat(body.phosphorusMinPct) || 0,
        sodioMinPct: body.sodiumMinPct ? parseFloat(body.sodiumMinPct) : null,
        omega3MinPct: body.omega3MinPct ? parseFloat(body.omega3MinPct) : null,
      },
      {
        topIngredientes: Array.isArray(body.topIngredients)
          ? body.topIngredients
          : (body.topIngredients || '').split(',').map((s: string) => s.trim()),
        antioxidanteTipo: body.antioxidantType || 'NATURAL',
        omega3OuPrebioticosGarantidos: body.omega3OuPrebioticosGarantidos ?? true,
        claimCarneTipo: body.meatClaimType || 'NENHUM',
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

    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const product = await prisma.product.create({
      data: {
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

        moistureMaxPct: parseFloat(body.moistureMaxPct) || 10,
        crudeProteinMinPct: parseFloat(body.crudeProteinMinPct) || 0,
        etherExtractMinPct: parseFloat(body.etherExtractMinPct) || 0,
        crudeFiberMaxPct: parseFloat(body.crudeFiberMaxPct) || 0,
        mineralMatterMaxPct: parseFloat(body.mineralMatterMaxPct) || 0,
        calciumMinPct: parseFloat(body.calciumMinPct) || 0,
        calciumMaxPct: body.calciumMaxPct ? parseFloat(body.calciumMaxPct) : null,
        phosphorusMinPct: parseFloat(body.phosphorusMinPct) || 0,
        sodiumMinPct: body.sodiumMinPct ? parseFloat(body.sodiumMinPct) : null,
        omega3MinPct: body.omega3MinPct ? parseFloat(body.omega3MinPct) : null,

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

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Erro ao cadastrar produto analisado:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar produto analisado' }, { status: 500 });
  }
}
