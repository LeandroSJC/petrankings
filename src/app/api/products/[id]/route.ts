import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calcularScoreAnaliseRotulo } from '@/lib/audit-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        affiliateLinks: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'curador')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

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

    const product = await prisma.product.update({
      where: { id },
      data: {
        commercialName: body.commercialName,
        brand: body.brand,
        manufacturerLegalName: body.manufacturerLegalName !== undefined ? body.manufacturerLegalName : undefined,
        legalCategory: body.legalCategory || 'ALIMENTO_COMPLETO',
        species: body.species,
        lifeStage: body.lifeStage,
        breedSize: body.breedSize || 'TODOS',
        foodType: body.foodType || 'SECO',
        coadjuvanteCondition: isCoadjuvante ? body.coadjuvanteCondition : null,
        sourceUrl: body.sourceUrl !== undefined ? body.sourceUrl : undefined,
        sourceArchiveUrl: body.sourceArchiveUrl !== undefined ? body.sourceArchiveUrl : undefined,
        sourceDocumentUrl: body.sourceDocumentUrl !== undefined ? body.sourceDocumentUrl : undefined,
        analyzedBatch: body.analyzedBatch || null,
        labelCollectionDate: body.labelCollectionDate ? new Date(body.labelCollectionDate) : undefined,
        frontLabelImageUrl: body.frontLabelImageUrl || null,
        backLabelImageUrl: body.backLabelImageUrl || null,

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

    // Sincroniza lojas e links de compra se enviados no corpo
    if (body.affiliateLinks !== undefined) {
      await prisma.affiliateLink.deleteMany({
        where: { productId: id },
      });

      const validLinks = Array.isArray(body.affiliateLinks)
        ? body.affiliateLinks.filter((l: any) => l && l.store?.trim() && l.productUrl?.trim())
        : [];

      if (validLinks.length > 0) {
        await prisma.affiliateLink.createMany({
          data: validLinks.map((l: any) => ({
            productId: id,
            store: l.store.trim(),
            productUrl: l.productUrl.trim(),
            affiliateUrl: l.affiliateUrl?.trim() || l.productUrl.trim(),
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Produto removido com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 });
  }
}
