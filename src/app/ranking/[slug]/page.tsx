import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Award, ShieldCheck, Sparkles } from 'lucide-react';
import prisma from '@/lib/prisma';
import { sortRankingProducts } from '@/lib/ranking-engine';
import { SITE_URL } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import AdPlaceholder from '@/components/AdPlaceholder';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ranking = await prisma.ranking.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!ranking || !ranking.isPublished) {
    return {
      title: 'Ranking não encontrado',
      description: 'O ranking solicitado não foi encontrado ou ainda não foi publicado no PetRankings.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const siteUrl = SITE_URL;
  const canonicalUrl = `${siteUrl}/ranking/${ranking.slug}`;
  const speciesLabel = ranking.species === 'caes' ? 'cães' : 'gatos';
  const productCount = ranking.products.length;

  const title = `${ranking.title}`;
  const description =
    ranking.description ||
    `Confira o ranking dos ${productCount > 0 ? productCount : ''} melhores produtos de ${ranking.productType} para ${speciesLabel}. Notas calculadas com base nas principais lojas do Brasil.`;

  // Obter imagem do primeiro produto para usar como OG Image se disponível
  const topProductWithImage = ranking.products.find((p) => p.product.imageUrl);
  const ogImageUrl = topProductWithImage?.product.imageUrl || `${siteUrl}/og-ranking.png`;

  const lastUpdated = ranking.dataUpdatedAt || ranking.updatedAt;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | PetRankings`,
      description,
      url: canonicalUrl,
      siteName: 'PetRankings',
      locale: 'pt_BR',
      type: 'article',
      publishedTime: ranking.createdAt.toISOString(),
      modifiedTime: lastUpdated.toISOString(),
      section: ranking.productType,
      tags: [
        ranking.species === 'caes' ? 'Cães' : 'Gatos',
        ranking.productType,
        'Ranking Pet',
        'Avaliações Pet',
        'Melhores Produtos Pet',
      ],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${ranking.title} - PetRankings`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | PetRankings`,
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function RankingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const ranking = await prisma.ranking.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          product: {
            include: {
              stores: true,
            },
          },
        },
      },
    },
  });

  if (!ranking || !ranking.isPublished) {
    notFound();
  }

  // Ordenar dinamicamente os produtos de acordo com a Seção 5.2
  const rawProducts = ranking.products.map((rp) => rp.product);
  const sortedProducts = sortRankingProducts(rawProducts);

  const siteUrl = SITE_URL;
  const canonicalUrl = `${siteUrl}/ranking/${ranking.slug}`;

  // Structured Data: BreadcrumbList (Schema.org)
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Início',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: ranking.species === 'caes' ? 'Cães' : 'Gatos',
        item: `${siteUrl}/?species=${ranking.species}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: ranking.productType,
        item: `${siteUrl}/?type=${encodeURIComponent(ranking.productType)}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: ranking.title,
        item: canonicalUrl,
      },
    ],
  };

  // Structured Data: ItemList (Schema.org)
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: ranking.title,
    description:
      ranking.description ||
      `Classificação editorial dos melhores produtos de ${ranking.productType} para ${ranking.species === 'caes' ? 'cães' : 'gatos'}.`,
    url: canonicalUrl,
    numberOfItems: sortedProducts.length,
    itemListElement: sortedProducts.map((p, idx) => {
      const validRatings = p.stores
        .map((s) => s.rating)
        .filter((r): r is number => r !== null && r !== undefined && r >= 0 && r <= 5);
      const totalReviews = p.stores.reduce((acc, s) => acc + (s.reviewCount || 0), 0);

      const productSchema: Record<string, unknown> = {
        '@type': 'Product',
        name: p.title,
        description: p.description || p.title,
        ...(p.imageUrl ? { image: p.imageUrl } : {}),
        ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
      };

      if (p.averageRating !== null && p.averageRating > 0) {
        productSchema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: p.averageRating.toFixed(2),
          bestRating: '5',
          worstRating: '1',
          ratingCount: totalReviews > 0 ? totalReviews : validRatings.length || 1,
        };
      }

      return {
        '@type': 'ListItem',
        position: idx + 1,
        item: productSchema,
      };
    }),
  };

  return (
    <div style={{ paddingBottom: '72px' }}>
      {/* Dados Estruturados JSON-LD para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      {/* Header do Ranking */}
      <section
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1.5px solid var(--border-cream)',
          padding: '52px 0 40px 0',
          backgroundImage:
            'radial-gradient(ellipse at 85% 15%, rgba(212, 175, 55, 0.08) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(15, 54, 35, 0.05) 0%, transparent 55%)',
        }}
      >
        <div className="container">
          {/* Breadcrumbs Acessíveis */}
          <nav
            aria-label="Trilha de navegação (Breadcrumbs)"
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '0.88rem',
              color: 'var(--text-muted)',
              marginBottom: '22px',
            }}
          >
            <Link
              href="/"
              style={{
                color: 'var(--brand-forest-800)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 6px',
                borderRadius: '4px',
              }}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Início & Rankings</span>
            </Link>
            <span aria-hidden="true">/</span>
            <span>{ranking.species === 'caes' ? '🐕 Cães' : '🐈 Gatos'}</span>
            <span aria-hidden="true">/</span>
            <span style={{ color: 'var(--brand-forest-900)', fontWeight: 800 }}>{ranking.productType}</span>
          </nav>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
            <span className={`tag-pill ${ranking.species === 'caes' ? 'tag-caes' : 'tag-gatos'}`}>
              {ranking.species === 'caes' ? '🐕 Cães' : '🐈 Gatos'}
            </span>
            <span className="tag-pill tag-type">{ranking.productType}</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 3.8vw, 3.1rem)',
              lineHeight: 1.18,
              marginBottom: '18px',
              color: 'var(--brand-forest-900)',
            }}
          >
            {ranking.title}
          </h1>

          {ranking.description && (
            <p
              style={{
                fontSize: '1.1rem',
                color: 'var(--text-body)',
                lineHeight: 1.68,
                maxWidth: '880px',
                marginBottom: '8px',
              }}
            >
              {ranking.description}
            </p>
          )}
        </div>
      </section>

      {/* Espaço Publicitário Reservado Topo do Ranking */}
      <div className="container" style={{ marginTop: '24px' }}>
        <AdPlaceholder label="Espaço Publicitário Reservado — Ranking Topo" />
      </div>

      {/* Lista de Produtos Ordenada */}
      <section className="container" aria-label="Lista ordenada de produtos avaliados" style={{ marginTop: '28px' }}>
        {sortedProducts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {sortedProducts.map((product, index) => (
              <React.Fragment key={product.id}>
                <ProductCard
                  rank={index + 1}
                  product={product}
                  rankingTitle={ranking.title}
                />
                {index === 2 && sortedProducts.length >= 5 && (
                  <div style={{ margin: '8px 0' }}>
                    <AdPlaceholder
                      label="Publicidade — Espaço Reservado In-Feed"
                      slotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED}
                      minHeight="120px"
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px dashed var(--border-cream)',
              borderRadius: 'var(--radius-lg)',
              padding: '56px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <Award size={48} color="var(--gold-600)" aria-hidden="true" />
            <h2 style={{ fontSize: '1.3rem', color: 'var(--brand-forest-900)' }}>
              Estamos preparando este ranking com muito carinho!
            </h2>
            <p style={{ color: 'var(--text-body)', fontSize: '0.96rem', maxWidth: '440px' }}>
              Nossa equipe está reunindo as avaliações dos melhores produtos desta categoria. Em breve o comparativo completo estará no ar.
            </p>
            <Link
              href="/"
              style={{
                backgroundColor: 'var(--brand-forest-800)',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.94rem',
                fontWeight: 700,
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Ver Outros Rankings 🐾
            </Link>
          </div>
        )}
      </section>

      {/* Espaço Publicitário Reservado Rodapé do Ranking */}
      <div className="container" style={{ marginTop: '36px' }}>
        <AdPlaceholder label="Espaço Publicitário Reservado — Ranking Rodapé" />
      </div>
    </div>
  );
}
