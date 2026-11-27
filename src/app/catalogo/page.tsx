import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import HomeAuditView, { ProductItemData } from '@/components/HomeAuditView';
import { Database, ChevronRight } from 'lucide-react';
import { SITE_URL } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Catálogo Geral de Rações Analisadas — PetRankings',
  description:
    'Consulte a análise nutricional em Matéria Seca (MS), ingredientes oficiais e índice de conformidade ABINPET do catálogo oficial de alimentos para cães e gatos.',
  alternates: {
    canonical: `${SITE_URL}/catalogo`,
  },
  openGraph: {
    url: `${SITE_URL}/catalogo`,
    title: 'Catálogo Geral de Rações Analisadas — PetRankings',
    description:
      'Filtre e compare alimentos para cães e gatos com base nos sites oficiais dos fabricantes e normas da ABINPET e MAPA.',
  },
};

export const revalidate = 60;

export default async function CatalogoPage() {
  let rawProducts: any[] = [];
  try {
    rawProducts = await prisma.product.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        slug: true,
        commercialName: true,
        brand: true,
        legalCategory: true,
        species: true,
        lifeStage: true,
        breedSize: true,
        foodType: true,
        coadjuvanteCondition: true,
        frontLabelImageUrl: true,
        moistureMaxPct: true,
        crudeProteinMinPct: true,
        etherExtractMinPct: true,
        crudeFiberMaxPct: true,
        mineralMatterMaxPct: true,
        calciumMinPct: true,
        phosphorusMinPct: true,
        meatClaimType: true,
        containsGmo: true,
        antioxidantType: true,
        topIngredients: true,
        scoreTotal: true,
        classificationTier: true,
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
  } catch (error) {
    console.error('Erro ao buscar produtos para o catálogo:', error);
  }

  const products: ProductItemData[] = rawProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    commercialName: p.commercialName,
    brand: p.brand,
    legalCategory: p.legalCategory,
    species: p.species,
    lifeStage: p.lifeStage,
    breedSize: p.breedSize,
    foodType: p.foodType,
    coadjuvanteCondition: p.coadjuvanteCondition,
    frontLabelImageUrl: p.frontLabelImageUrl,
    moistureMaxPct: p.moistureMaxPct,
    crudeProteinMinPct: p.crudeProteinMinPct,
    etherExtractMinPct: p.etherExtractMinPct,
    crudeFiberMaxPct: p.crudeFiberMaxPct,
    mineralMatterMaxPct: p.mineralMatterMaxPct,
    calciumMinPct: p.calciumMinPct,
    phosphorusMinPct: p.phosphorusMinPct,
    meatClaimType: p.meatClaimType,
    containsGmo: p.containsGmo,
    antioxidantType: p.antioxidantType,
    topIngredients: p.topIngredients,
    scoreTotal: p.scoreTotal,
    classificationTier: p.classificationTier,
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

      {/* Hero Utilitário Padronizado */}
      <section
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-cream)',
          padding: '24px 0 20px 0',
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
                fontSize: 'clamp(1.5rem, 2.8vw, 1.95rem)',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                marginBottom: '8px',
              }}
            >
              Catálogo Geral de Alimentos para Cães e Gatos
            </h1>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', lineHeight: 1.55, margin: 0 }}>
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
