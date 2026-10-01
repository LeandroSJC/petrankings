import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import HomeAuditView, { ProductItemData } from '@/components/HomeAuditView';
import { Database, ShieldCheck, ChevronRight, SlidersHorizontal, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Catálogo Geral de Rações Analisadas — PetRankings',
  description:
    'Consulte a análise nutricional em Matéria Seca (MS), ingredientes oficiais e índice de conformidade ABINPET de mais de 900 alimentos para cães e gatos.',
  alternates: {
    canonical: '/catalogo',
  },
  openGraph: {
    url: '/catalogo',
    title: 'Catálogo Geral de Rações Analisadas — PetRankings',
    description:
      'Filtre e compare alimentos para cães e gatos com base nos sites oficiais dos fabricantes e normas da ABINPET e MAPA.',
  },
};

export const revalidate = 60;

export default async function CatalogoPage() {
  const rawProducts = await prisma.product.findMany({
    where: { isPublished: true },
    include: {
      affiliateLinks: {
        select: {
          store: true,
          productUrl: true,
          affiliateUrl: true,
        },
      },
    },
    orderBy: [
      { scoreTotal: 'desc' },
      { commercialName: 'asc' },
    ],
  });

  const products: ProductItemData[] = rawProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    commercialName: p.commercialName,
    brand: p.brand,
    manufacturerLegalName: p.manufacturerLegalName,
    legalCategory: p.legalCategory,
    species: p.species,
    lifeStage: p.lifeStage,
    breedSize: p.breedSize,
    foodType: p.foodType,
    coadjuvanteCondition: p.coadjuvanteCondition,
    sourceUrl: p.sourceUrl,
    sourceArchiveUrl: p.sourceArchiveUrl,
    sourceDocumentUrl: p.sourceDocumentUrl,
    analyzedBatch: p.analyzedBatch,
    labelCollectionDate: p.labelCollectionDate,
    frontLabelImageUrl: p.frontLabelImageUrl,
    backLabelImageUrl: p.backLabelImageUrl,
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
    meatClaimType: p.meatClaimType,
    containsGmo: p.containsGmo,
    gmoIngredients: p.gmoIngredients,
    antioxidantType: p.antioxidantType,
    topIngredients: p.topIngredients,
    editorialOpinion: p.editorialOpinion,
    scoreTotal: p.scoreTotal,
    classificationTier: p.classificationTier,
    scoreBreakdown: p.scoreBreakdown,
    affiliateLinks: p.affiliateLinks,
  }));

  return (
    <div style={{ backgroundColor: 'var(--bg-subtle)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Barra Superior de Breadcrumbs Compacta */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-cream)',
          padding: '10px 0',
        }}
      >
        <div className="container">
          <nav aria-label="Navegação estrutural" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
            <Link href="/" style={{ color: 'var(--text-body)', textDecoration: 'none' }}>
              Início
            </Link>
            <ChevronRight size={13} color="var(--text-subtle)" aria-hidden="true" />
            <span style={{ color: 'var(--brand-forest-700)', fontWeight: 700 }}>
              Catálogo de Fichas Técnicas
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Utilitário Compacto */}
      <section
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-cream)',
          padding: '20px 0 16px 0',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '860px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--brand-forest-50)',
                border: '1px solid var(--brand-forest-200)',
                color: 'var(--brand-forest-700)',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              <Database size={13} aria-hidden="true" />
              <span>Base Oficial de Dados Custodiados</span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.45rem, 2.8vw, 1.85rem)',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: '6px',
              }}
            >
              Catálogo Geral de Alimentos para Cães e Gatos
            </h1>

            <p style={{ fontSize: '0.90rem', color: 'var(--text-body)', lineHeight: 1.5, margin: 0 }}>
              Análise nutricional de <strong>{products.length} produtos oficiais</strong> em Matéria Seca (MS), confrontados com os padrões da 11ª Edição do Manual ABINPET. Filtre por espécie, fase de vida e conservantes abaixo.
            </p>
          </div>
        </div>
      </section>

      {/* Área da Tabela e Filtros */}
      <section style={{ marginTop: '16px' }}>
        <div className="container">
          <HomeAuditView initialProducts={products} />
        </div>
      </section>
    </div>
  );
}
