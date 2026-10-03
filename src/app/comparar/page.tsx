import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, ChevronRight } from 'lucide-react';
import prisma from '@/lib/prisma';
import ComparatorView from '@/components/comparator/ComparatorView';
import { formatProductForComparison, ComparedProduct } from '@/lib/comparator';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string; p2?: string; p3?: string }>;
}): Promise<Metadata> {
  const { p1, p2, p3 } = await searchParams;
  const slugs = [p1, p2, p3].filter((s): s is string => Boolean(s?.trim()));

  if (slugs.length >= 2) {
    const products = await prisma.product.findMany({
      where: { slug: { in: slugs }, isPublished: true },
      select: { commercialName: true, slug: true },
    });

    const ordered = slugs.map((s) => products.find((p) => p.slug === s)).filter(Boolean);

    if (ordered.length >= 2) {
      const name1 = ordered[0]?.commercialName;
      const name2 = ordered[1]?.commercialName;
      return {
        title: `${name1} vs ${name2} — Comparativo Nutricional e Ingredientes | PetRankings`,
        description: `Confronto bromatológico em Matéria Seca (MS), teores de proteína, gordura, cinzas minerais, antioxidantes e ingredientes entre ${name1} e ${name2}.`,
        alternates: {
          canonical: `https://petrankings.com.br/comparar?p1=${slugs[0]}&p2=${slugs[1]}`,
        },
      };
    }
  } else if (slugs.length === 1) {
    const product = await prisma.product.findUnique({
      where: { slug: slugs[0], isPublished: true },
      select: { commercialName: true },
    });
    if (product) {
      return {
        title: `Comparar ${product.commercialName} com Outras Rações | PetRankings`,
        description: `Selecione outro alimento para confrontar níveis de garantia em Matéria Seca, aditivos e composição de ${product.commercialName}.`,
        alternates: {
          canonical: `https://petrankings.com.br/comparar?p1=${slugs[0]}`,
        },
      };
    }
  }

  return {
    title: 'Comparador de Rações: Confronto Nutricional em Matéria Seca | PetRankings',
    description:
      'Compare até três rações para cães e gatos lado a lado. Análise bromatológica independente em Matéria Seca (MS), antioxidantes naturais, transgênicos e ordem dos ingredientes.',
    alternates: {
      canonical: 'https://petrankings.com.br/comparar',
    },
  };
}

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{ p1?: string; p2?: string; p3?: string }>;
}) {
  const { p1, p2, p3 } = await searchParams;
  const slugs = [p1, p2, p3].filter((s): s is string => Boolean(s?.trim()));

  let formattedProducts: ComparedProduct[] = [];

  if (slugs.length > 0) {
    const rawProducts = await prisma.product.findMany({
      where: {
        slug: { in: slugs },
        isPublished: true,
      },
      include: {
        affiliateLinks: true,
      },
    });

    // Preserva rigorosamente a ordem indicada pelos parâmetros p1, p2, p3
    formattedProducts = slugs
      .map((s) => rawProducts.find((p) => p.slug === s))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map(formatProductForComparison);
  }

  // Schema estruturado JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: 'https://petrankings.com.br',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Comparador de Rações',
        item: 'https://petrankings.com.br/comparar',
      },
    ],
  };

  return (
    <main style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', paddingTop: '20px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="container">
        {/* Navegação Breadcrumb */}
        <nav
          aria-label="Trilha de Navegação"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.80rem',
            color: 'var(--text-muted)',
            marginBottom: '16px',
          }}
        >
          <Link href="/" style={{ color: 'var(--text-body)', textDecoration: 'none' }}>
            Início
          </Link>
          <ChevronRight size={13} color="var(--text-subtle)" aria-hidden="true" />
          <Link href="/catalogo" style={{ color: 'var(--text-body)', textDecoration: 'none' }}>
            Catálogo
          </Link>
          <ChevronRight size={13} color="var(--text-subtle)" aria-hidden="true" />
          <span style={{ color: 'var(--brand-forest-700)', fontWeight: 700 }}>
            Comparador Lado a Lado
          </span>
        </nav>

        {/* HERO KIT PADRONIZADO (3 CAMADAS - INVARIANTE 13) */}
        <header style={{ marginBottom: '24px' }}>
          {/* Camada 1: Eyebrow Badge com Ícone Temático */}
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
            <Scale size={13} aria-hidden="true" />
            <span>Ferramenta de Confronto Bromatológico</span>
          </div>

          {/* Camada 2: H1 em Sentence Case */}
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
            Comparador de rações: Confronto nutricional em Matéria Seca
          </h1>

          {/* Camada 3: Lead Técnico */}
          <p
            style={{
              fontSize: '0.90rem',
              color: 'var(--text-body)',
              lineHeight: 1.5,
              margin: 0,
              maxWidth: '840px',
            }}
          >
            Compare até três alimentos para cães e gatos lado a lado. Analise a densidade real dos nutrientes desconsiderando a água (MS), a presença de antioxidantes naturais, grãos transgênicos e a ordem oficial dos ingredientes.
          </p>
        </header>

        {/* COMPONENTE INTERATIVO DO COMPARADOR */}
        <ComparatorView initialProducts={formattedProducts} />
      </div>
    </main>
  );
}
