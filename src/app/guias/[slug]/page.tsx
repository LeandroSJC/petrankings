import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getGuideBySlug, getRelatedGuides, getAllGuides } from '@/lib/content/guides';
import {
  Clock,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { SITE_URL } from '@/lib/utils';

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const guides = getAllGuides();
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {
      title: 'Estudo Não Encontrado — PetRankings',
    };
  }

  const canonicalUrl = `${SITE_URL}/guias/${guide.slug}`;

  return {
    title: `${guide.title} — PetRankings`,
    description: guide.summary,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      url: canonicalUrl,
      type: 'article',
      title: guide.title,
      description: guide.summary,
      images: [
        {
          url: guide.coverImageUrl,
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      authors: [guide.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: guide.summary,
      images: [guide.coverImageUrl],
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  // Buscar produtos citados no banco para gerar os cards vivos de dados
  const citedProducts = guide.relatedProductSlugs.length > 0
    ? await prisma.product.findMany({
        where: {
          slug: { in: guide.relatedProductSlugs },
          isPublished: true,
        },
        select: {
          id: true,
          slug: true,
          commercialName: true,
          brand: true,
          classificationTier: true,
          scoreTotal: true,
          frontLabelImageUrl: true,
          antioxidantType: true,
          containsGmo: true,
        },
      })
    : [];

  const relatedGuides = getRelatedGuides(guide.slug, 2);

  // Schema.org JSON-LD para Article e BreadcrumbList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${SITE_URL}/guias/${guide.slug}#article`,
        headline: guide.title,
        description: guide.summary,
        image: guide.coverImageUrl,
        datePublished: guide.publishedAt,
        dateModified: guide.updatedAt,
        author: {
          '@type': 'Organization',
          name: guide.author.name,
          url: SITE_URL,
        },
        publisher: {
          '@type': 'Organization',
          name: 'PetRankings',
          url: SITE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/icon.svg`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/guias/${guide.slug}`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Início',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Estudos & Guias',
            item: `${SITE_URL}/#estudos`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: guide.title,
            item: `${SITE_URL}/guias/${guide.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingBottom: '90px' }}>
        {/* Breadcrumb Superior */}
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
              <Link href="/#estudos" style={{ color: 'var(--text-body)', textDecoration: 'none' }}>
                Estudos & Guias
              </Link>
              <ChevronRight size={13} color="var(--text-subtle)" aria-hidden="true" />
              <span style={{ color: 'var(--brand-forest-700)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                {guide.title}
              </span>
            </nav>
          </div>
        </div>

        {/* Header Editorial do Artigo Compacto */}
        <header
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border-cream)',
            padding: '24px 0 20px 0',
          }}
        >
          <div className="container" style={{ maxWidth: '860px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span
                style={{
                  backgroundColor: 'var(--brand-forest-50)',
                  border: '1px solid var(--brand-forest-200)',
                  color: 'var(--brand-forest-700)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {guide.cluster}
              </span>
              <span
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  border: '1px solid var(--border-cream)',
                  color: 'var(--text-body)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                Foco: {guide.speciesTarget}
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.5rem, 3vw, 2.05rem)',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                marginBottom: '8px',
              }}
            >
              {guide.title}
            </h1>

            <p style={{ fontSize: '0.94rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '14px' }}>
              {guide.subtitle}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                fontSize: '0.82rem',
                color: 'var(--text-body)',
                borderTop: '1px solid var(--border-cream)',
                paddingTop: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <strong style={{ color: 'var(--brand-forest-900)' }}>{guide.author.name}</strong>
                <span style={{ display: 'block', fontSize: '0.76rem', color: '#475569' }}>{guide.author.role}</span>
              </div>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={14} aria-hidden="true" />
                {guide.readingTimeMinutes} min de leitura
              </span>
              <span>•</span>
              <span>Revisão técnica em {new Date(guide.updatedAt + 'T12:00:00Z').toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </header>

        {/* Imagem de Capa do Estudo */}
        <div className="container" style={{ maxWidth: '860px', marginTop: '20px', marginBottom: '24px' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              maxHeight: '440px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={guide.coverImageUrl}
              alt={guide.title}
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '440px',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* Corpo do Artigo e Sumário */}
        <div className="container" style={{ maxWidth: '860px' }}>
          {/* Sumário Rápido de Tópicos */}
          <div
            style={{
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-cream)',
              padding: '20px 24px',
              marginBottom: '36px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <BookOpen size={16} color="var(--brand-forest-700)" aria-hidden="true" />
              <span style={{ fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--brand-forest-900)' }}>
                Tópicos Abordados neste Estudo
              </span>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.90rem' }}>
              {guide.sections.map((section, idx) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    style={{
                      color: 'var(--brand-forest-700)',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {idx + 1}. {section.heading.replace(/^\d+\.\s*/, '')}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Seções de Conteúdo */}
          <div className="editorial-article-body" style={{ fontSize: '1.04rem', lineHeight: 1.8, color: 'var(--text-body)' }}>
            {guide.sections.map((sec) => (
              <section key={sec.id} id={sec.id} style={{ marginBottom: '44px', scrollMarginTop: '100px' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    color: 'var(--brand-forest-900)',
                    lineHeight: 1.3,
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid var(--border-cream-light)',
                  }}
                >
                  {sec.heading}
                </h2>

                {sec.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} style={{ marginBottom: '16px' }}>
                    {p}
                  </p>
                ))}

                {/* Callout de Legislação ou Destaque */}
                {sec.callout && (
                  <div
                    style={{
                      backgroundColor:
                        sec.callout.type === 'norma'
                          ? 'var(--brand-forest-50)'
                          : sec.callout.type === 'atencao'
                          ? 'var(--dog-accent-bg)'
                          : 'var(--cat-accent-bg)',
                      borderLeft: `4px solid ${
                        sec.callout.type === 'norma'
                          ? 'var(--brand-forest-600)'
                          : sec.callout.type === 'atencao'
                          ? 'var(--gold-600)'
                          : 'var(--cat-accent-solid)'
                      }`,
                      padding: '16px 20px',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                      marginTop: '20px',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      {sec.callout.type === 'norma' ? (
                        <ShieldCheck size={18} color="var(--brand-forest-700)" aria-hidden="true" />
                      ) : sec.callout.type === 'atencao' ? (
                        <AlertCircle size={18} color="var(--gold-700)" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 size={18} color="var(--cat-accent-solid)" aria-hidden="true" />
                      )}
                      <strong style={{ fontSize: '0.90rem', color: 'var(--brand-forest-900)' }}>
                        {sec.callout.title}
                      </strong>
                    </div>
                    <p style={{ fontSize: '0.90rem', margin: 0, lineHeight: 1.6, color: 'var(--text-body)' }}>
                      {sec.callout.text}
                    </p>
                    {sec.callout.link && (
                      <div style={{ marginTop: '12px' }}>
                        <Link
                          href={sec.callout.link.url}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--brand-forest-800)',
                            textDecoration: 'underline',
                          }}
                        >
                          <span>{sec.callout.link.text}</span>
                          <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Tabela de Comparação do Artigo */}
                {sec.table && (
                  <div style={{ marginTop: '24px', marginBottom: '24px', overflowX: 'auto' }}>
                    {sec.table.caption && (
                      <span style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        {sec.table.caption}
                      </span>
                    )}
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.88rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-cream)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-muted)', textAlign: 'left' }}>
                          {sec.table.headers.map((h, hIdx) => (
                            <th
                              key={hIdx}
                              style={{
                                padding: '10px 14px',
                                borderBottom: '1px solid var(--border-cream)',
                                color: 'var(--brand-forest-900)',
                                fontWeight: 700,
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sec.table.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            style={{
                              backgroundColor: rIdx % 2 === 0 ? '#ffffff' : 'var(--bg-subtle)',
                              borderBottom: '1px solid var(--border-cream-light)',
                            }}
                          >
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                style={{
                                  padding: '10px 14px',
                                  color: cIdx === 0 ? 'var(--brand-forest-900)' : 'var(--text-body)',
                                  fontWeight: cIdx === 0 ? 600 : 400,
                                }}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}

            {/* Veredito / Conclusão */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-cream)',
                padding: '24px 28px',
                marginTop: '36px',
                marginBottom: '44px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.20rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  marginBottom: '10px',
                }}
              >
                Conclusão do Observatório PetRankings
              </h3>
              <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: 1.65, color: 'var(--text-body)' }}>
                {guide.conclusion}
              </p>
            </div>

            {/* Bloco de Ação / Call-to-Action Editorial */}
            {guide.callToAction && (
              <div
                style={{
                  backgroundColor: 'var(--brand-forest-50)',
                  border: '1.5px solid var(--brand-forest-200)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px 28px',
                  marginBottom: '44px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="var(--brand-forest-700)" aria-hidden="true" />
                  <h4
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'var(--brand-forest-900)',
                      margin: 0,
                    }}
                  >
                    {guide.callToAction.title}
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-body)' }}>
                  {guide.callToAction.text}
                </p>
                <Link
                  href={guide.callToAction.buttonUrl}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'var(--brand-forest-700)',
                    color: '#ffffff',
                    padding: '12px 22px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    marginTop: '6px',
                    transition: 'var(--transition-fast)',
                  }}
                  className="guide-primary-btn"
                >
                  <span>{guide.callToAction.buttonText}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>

          {/* Cards Vivos de Produtos Citados no Banco de Dados */}
          {citedProducts.length > 0 && (
            <div style={{ marginBottom: '48px', borderTop: '2px solid var(--border-cream)', paddingTop: '32px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  marginBottom: '16px',
                }}
              >
                Produtos Analisados Citados neste Estudo
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {citedProducts.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-cream)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px',
                      display: 'flex',
                      gap: '14px',
                      alignItems: 'center',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    {p.frontLabelImageUrl && (
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          position: 'relative',
                          flexShrink: 0,
                          borderRadius: 'var(--radius-xs)',
                          overflow: 'hidden',
                          backgroundColor: 'var(--bg-muted)',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.frontLabelImageUrl}
                          alt={p.commercialName}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        {p.brand}
                      </span>
                      <h4
                        style={{
                          fontSize: '0.90rem',
                          fontWeight: 700,
                          color: 'var(--brand-forest-900)',
                          lineHeight: 1.25,
                          marginBottom: '6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.commercialName}
                      </h4>
                      <Link
                        href={`/produto/${p.slug}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.80rem',
                          color: 'var(--brand-forest-700)',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <span>Ver Ficha Técnica Oficial</span>
                        <ExternalLink size={12} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Perguntas Frequentes do Artigo */}
          {guide.faq.length > 0 && (
            <div style={{ marginBottom: '48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <HelpCircle size={20} color="var(--brand-forest-700)" aria-hidden="true" />
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--brand-forest-900)',
                  }}
                >
                  Perguntas Frequentes
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {guide.faq.map((item, fIdx) => (
                  <div
                    key={fIdx}
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-cream)',
                      padding: '16px 20px',
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                      {item.q}
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer Veterinário Obrigatório */}
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-md)',
              padding: '20px 24px',
              marginBottom: '48px',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
            }}
          >
            <ShieldAlert size={22} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
            <div>
              <strong style={{ fontSize: '0.86rem', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
                Aviso Editorial e Isenção Veterinária
              </strong>
              <p style={{ fontSize: '0.84rem', color: '#78350f', lineHeight: 1.55, margin: 0 }}>
                O PetRankings é um serviço editorial independente de comparação técnica e análise documental baseado nos dados oficiais disponibilizados pelos fabricantes e nos manuais da ABINPET e do MAPA. Este estudo tem finalidade exclusivamente educativa e informativa, não substituindo a consulta, o diagnóstico ou a prescrição individualizada de um médico veterinário ou zootecnista.
              </p>
            </div>
          </div>

          {/* Continue Lendo */}
          {relatedGuides.length > 0 && (
            <div style={{ borderTop: '2px solid var(--border-cream)', paddingTop: '32px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  marginBottom: '18px',
                }}
              >
                Outros Estudos Recomendados
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {relatedGuides.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/guias/${rel.slug}`}
                    style={{
                      display: 'block',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-cream)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '18px',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'var(--transition)',
                    }}
                    className="related-guide-box"
                  >
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--brand-forest-700)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      {rel.cluster}
                    </span>
                    <strong style={{ fontSize: '0.96rem', color: 'var(--brand-forest-900)', lineHeight: 1.35, display: 'block', marginBottom: '8px' }}>
                      {rel.title}
                    </strong>
                    <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>
                      {rel.readingTimeMinutes} min de leitura →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
