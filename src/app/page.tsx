import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Clock,
  Database,
  Award,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { getAllGuides, getFeaturedGuide } from '@/lib/content/guides';
import HomeHeroSearch from '@/components/HomeHeroSearch';
import HomeGuidesSection from '@/components/HomeGuidesSection';
import FaqAccordion from '@/components/FaqAccordion';
import { SITE_URL } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'PetRankings — Observatório Independente de Nutrição Pet no Brasil',
  description:
    'Estudos técnicos comparativos, duelos de marcas, análises bromatológicas em Matéria Seca (MS) e catálogo de fichas técnicas oficiais de alimentos para cães e gatos.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    url: '/',
    title: 'PetRankings — Observatório Independente de Nutrição Pet no Brasil',
    description:
      'Compare a qualidade real da ração do seu pet com análises em Matéria Seca (MS) baseadas nos sites oficiais dos fabricantes e normas da ABINPET.',
  },
};

export const revalidate = 60;

export default async function HomePage() {
  // Estatísticas agregadas ao vivo do banco de dados oficial
  let totalProducts = 0;
  let naturalAntioxidantsCount = 0;
  let nonGmoCount = 0;
  let coadjuvantesCount = 0;

  try {
    const counts = await Promise.all([
      prisma.product.count({ where: { isPublished: true } }),
      prisma.product.count({ where: { isPublished: true, antioxidantType: 'NATURAL' } }),
      prisma.product.count({ where: { isPublished: true, containsGmo: false } }),
      prisma.product.count({ where: { isPublished: true, legalCategory: 'ALIMENTO_COADJUVANTE' } }),
    ]);
    totalProducts = counts[0];
    naturalAntioxidantsCount = counts[1];
    nonGmoCount = counts[2];
    coadjuvantesCount = counts[3];
  } catch (error) {
    console.error('Erro ao buscar contagens para a home:', error);
  }

  const allGuides = getAllGuides();
  const featuredGuide = getFeaturedGuide();

  // FAQ Institucional e Metodológica
  const faqs = [
    {
      q: 'Como funciona a Avaliação Nutricional do PetRankings?',
      a: 'É uma metodologia técnica e determinística que avalia as informações nutricionais divulgadas nos sites oficiais dos fabricantes de alimentos para cães e gatos sob 4 pilares: adequação nutricional em Matéria Seca (MS), equilíbrio Cálcio:Fósforo (Ca:P), nobreza dos primeiros ingredientes declarados e transparência com aditivos e conservantes naturais.',
    },
    {
      q: 'Por que os cálculos são feitos na Matéria Seca (MS) e não na Matéria Natural (MN)?',
      a: 'A umidade dilui as porcentagens dos nutrientes informadas nas embalagens e nas páginas dos produtos. Ao converter os níveis de garantia para Matéria Seca (eliminando a água), é possível confrontar cientificamente os teores reais com as tabelas de exigências mínimas da 11ª Edição do Manual Pet Food Brasil (ABINPET).',
    },
    {
      q: 'Como são tratados os alimentos coadjuvantes (prescrição veterinária)?',
      a: 'Alimentos com indicação terapêutica (como dietas renais, urinárias, gastrointestinais e de obesidade) possuem formulações intencionalmente modificadas para fins clínicos e NUNCA competem com alimentos de manutenção sadia. Eles possuem catálogo isolado sem ranking comparativo.',
    },
    {
      q: 'O portal realiza testes em laboratório ou exige envio de embalagens físicas?',
      a: 'Não. O portal realiza estritamente o confronto técnico e documental das garantias e composições declaradas publicamente pelos próprios fabricantes nos sites oficiais de suas marcas. Cada produto catalogado possui registro de custódia documental com a URL da página oficial do fabricante e o comprovante da ficha técnica oficial arquivado, com pleno amparo nos Arts. 30 e 31 do Código de Defesa do Consumidor e parâmetros científicos da ABINPET/MAPA.',
    },
    {
      q: 'Como fabricantes podem retificar ou atualizar dados cadastrados?',
      a: 'Fabricantes possuem canal institucional prioritário (Right of Reply) com prazo de atendimento de até 5 dias úteis para comunicação de novos links de produtos, atualização de composições declaradas ou notificação de reformulação de fórmulas.',
    },
  ];

  // Schema.org estruturado para Home Page (WebSite + FAQPage)
  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'PetRankings',
        url: SITE_URL,
        description: 'Observatório Independente de Nutrição Pet no Brasil.',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/catalogo?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <div style={{ backgroundColor: '#ffffff' }}>
      {/* 1. HERO EDITORIAL COM CONCIERGE DE BUSCA COMPACTO */}
      <section
        style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          borderBottom: '1px solid var(--border-cream)',
          padding: '36px 0 28px 0',
          position: 'relative',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--brand-forest-50)',
                border: '1px solid var(--brand-forest-200)',
                color: 'var(--brand-forest-700)',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              <Sparkles size={14} aria-hidden="true" color="var(--gold-600)" />
              <span>Observatório Independente de Nutrição Pet</span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.75rem, 3.2vw, 2.45rem)',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                lineHeight: 1.18,
                letterSpacing: '-0.025em',
                marginBottom: '10px',
              }}
            >
              O que realmente está dentro do pacote de ração do seu pet?
            </h1>

            <p
              style={{
                fontSize: 'clamp(0.92rem, 1.6vw, 1.05rem)',
                color: 'var(--text-body)',
                lineHeight: 1.5,
                maxWidth: '720px',
                margin: '0 auto 20px auto',
              }}
            >
              Estudos comparativos, duelos de marcas e análises em Matéria Seca (MS) fundamentadas nos dados do MAPA e na <strong>11ª Edição do Manual ABINPET</strong>.
            </p>

            {/* Barra de Busca Concierge Central */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <HomeHeroSearch />
            </div>
          </div>
        </div>
      </section>

      {/* 2. ESTUDO DE CAPA COMPACTO (HERO FEATURE STORY) */}
      <section
        id="destaque-da-semana"
        style={{ padding: '32px 0 24px 0', scrollMarginTop: '90px' }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: 'var(--gold-50)',
                  border: '1px solid var(--gold-200)',
                  color: 'var(--gold-700)',
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <Award size={13} color="var(--gold-700)" aria-hidden="true" />
                Destaque da Semana
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.20rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  margin: 0,
                }}
              >
                Estudo em destaque
              </h2>
            </div>
            <a
              href="#estudos"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: 'var(--brand-forest-700)',
                textDecoration: 'none',
              }}
            >
              <span>Ver todos os estudos</span>
              <ChevronRight size={15} aria-hidden="true" />
            </a>
          </div>

          {featuredGuide && (
            <article
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-cream)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                transition: 'var(--transition)',
              }}
              className="featured-guide-card"
            >
              <div
                style={{
                  position: 'relative',
                  minHeight: '260px',
                  height: '100%',
                  backgroundColor: 'var(--bg-muted)',
                  overflow: 'hidden',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredGuide.coverImageUrl}
                  alt={featuredGuide.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {featuredGuide.cluster}
                </div>
              </div>

              <div
                style={{
                  padding: '24px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={13} />
                    {featuredGuide.readingTimeMinutes} min de leitura
                  </span>
                  <span>•</span>
                  <span>Alvo: {featuredGuide.speciesTarget}</span>
                  <span>•</span>
                  <span>
                    {new Date(featuredGuide.publishedAt + 'T12:00:00Z').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>{featuredGuide.author.name}</span>
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(1.20rem, 2.2vw, 1.55rem)',
                    fontWeight: 800,
                    color: 'var(--brand-forest-900)',
                    lineHeight: 1.25,
                    marginBottom: '8px',
                  }}
                >
                  <Link href={`/guias/${featuredGuide.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {featuredGuide.title}
                  </Link>
                </h3>

                <p
                  style={{
                    fontSize: '0.90rem',
                    color: 'var(--text-body)',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                  }}
                >
                  {featuredGuide.summary}
                </p>

                <div>
                  <Link
                    href={`/guias/${featuredGuide.slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'var(--brand-forest-700)',
                      color: '#ffffff',
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'var(--transition-fast)',
                    }}
                    className="guide-primary-btn"
                  >
                    <span>Ler estudo completo</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </article>
          )}
        </div>
      </section>

      {/* 3. TRILHA DE ESTUDOS COM FILTROS DE ESPÉCIE & PAGINAÇÃO */}
      <HomeGuidesSection allGuides={allGuides} featuredSlug={featuredGuide?.slug} />

      {/* 4. OBSERVATÓRIO EM NÚMEROS (DATA HIGHLIGHTS) */}
      <section
        style={{
          backgroundColor: 'var(--brand-forest-900)',
          color: '#ffffff',
          padding: '60px 0',
          position: 'relative',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 44px auto' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--brand-forest-400)',
                fontSize: '0.78rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '10px',
              }}
            >
              <TrendingUp size={16} />
              <span>Transparência da Indústria</span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.75rem, 3.2vw, 2.35rem)',
                fontWeight: 800,
                color: '#ffffff',
                marginBottom: '12px',
              }}
            >
              O mercado pet brasileiro em dados concretos
            </h2>
            <p style={{ fontSize: '0.98rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              Dados agregados de rotulagem oficial custodiados pelo PetRankings e confrontados com os atos do MAPA e da ABINPET.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'var(--brand-forest-300)',
                  lineHeight: 1,
                  marginBottom: '8px',
                }}
              >
                {totalProducts}
              </span>
              <strong style={{ display: 'block', fontSize: '0.94rem', color: '#ffffff', marginBottom: '6px' }}>
                Alimentos Avaliados
              </strong>
              <span style={{ fontSize: '0.80rem', color: '#94a3b8', lineHeight: 1.4 }}>
                100% dos dados coletados dos canais e fichas técnicas oficiais.
              </span>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'var(--brand-forest-300)',
                  lineHeight: 1,
                  marginBottom: '8px',
                }}
              >
                {totalProducts > 0 ? `${Math.round((naturalAntioxidantsCount / totalProducts) * 100)}%` : '0%'}
              </span>
              <strong style={{ display: 'block', fontSize: '0.94rem', color: '#ffffff', marginBottom: '6px' }}>
                Conservação Natural
              </strong>
              <span style={{ fontSize: '0.80rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Rações que utilizam tocoferóis e extrato de alecrim em vez de BHT/BHA.
              </span>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'var(--brand-forest-300)',
                  lineHeight: 1,
                  marginBottom: '8px',
                }}
              >
                {totalProducts > 0 ? `${Math.round((nonGmoCount / totalProducts) * 100)}%` : '0%'}
              </span>
              <strong style={{ display: 'block', fontSize: '0.94rem', color: '#ffffff', marginBottom: '6px' }}>
                Livre de Transgênicos
              </strong>
              <span style={{ fontSize: '0.80rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Fórmulas sem derivados de milho ou soja geneticamente modificados.
              </span>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'var(--brand-forest-300)',
                  lineHeight: 1,
                  marginBottom: '8px',
                }}
              >
                100%
              </span>
              <strong style={{ display: 'block', fontSize: '0.94rem', color: '#ffffff', marginBottom: '6px' }}>
                Base Seca (MS)
              </strong>
              <span style={{ fontSize: '0.80rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Todos os nutrientes são recalculados para eliminar a distorção da água.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BANNER / CHAMADA DE AÇÃO PARA O CATÁLOGO GERAL */}
      <section style={{ padding: '60px 0', backgroundColor: 'var(--bg-subtle)' }}>
        <div className="container">
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-cream)',
              padding: '40px 36px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ maxWidth: '640px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--brand-forest-700)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '8px',
                }}
              >
                <Database size={16} />
                <span>Banco de Dados Completo</span>
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  lineHeight: 1.25,
                  marginBottom: '10px',
                }}
              >
                Deseja consultar a ficha técnica de todas as rações do mercado?
              </h2>
              <p style={{ fontSize: '0.96rem', color: 'var(--text-body)', lineHeight: 1.6, margin: 0 }}>
                Acesse nossa ferramenta dedicada de catálogo com busca facetada por espécie, porte, fase de vida, índices de proteína na Matéria Seca, conservantes e preços nas principais lojas.
              </p>
            </div>

            <div>
              <Link
                href="/catalogo"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--brand-forest-700)',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-emerald)',
                }}
              >
                <span>Acessar o Catálogo de Fichas Técnicas</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. OS 4 PILARES DA METODOLOGIA */}
      <section style={{ padding: '60px 0', borderTop: '1px solid var(--border-cream)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 40px auto' }}>
            <span
              style={{
                fontSize: '0.80rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--brand-forest-700)',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Avaliação Baseada no Manual ABINPET
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.95rem',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                marginBottom: '12px',
              }}
            >
              Os 4 pilares da avaliação nutricional PetRankings
            </h2>
            <p style={{ fontSize: '0.98rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
              Nosso motor matemático analisa cada produto sob 4 eixos objetivos, eliminando opiniões subjetivas ou influência de patrocínios comerciais.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-cream)',
                padding: '24px 20px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--brand-forest-100)',
                  color: 'var(--brand-forest-800)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: '1.10rem', fontWeight: 800, color: 'var(--brand-forest-900)', marginBottom: '8px' }}>
                Matéria Seca (MS)
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: 1.55, margin: 0 }}>
                Neutralização da água para apurar os teores reais de Proteína Bruta e Extrato Etéreo confrontados com a 11ª Edição da ABINPET.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-cream)',
                padding: '24px 20px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--brand-forest-100)',
                  color: 'var(--brand-forest-800)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: '1.10rem', fontWeight: 800, color: 'var(--brand-forest-900)', marginBottom: '8px' }}>
                Balanço Cálcio:Fósforo
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: 1.55, margin: 0 }}>
                Avaliação da proporção mineral (faixa ideal de 1,0:1 a 2,0:1) para proteger a saúde óssea e o trato urinário.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-cream)',
                padding: '24px 20px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--brand-forest-100)',
                  color: 'var(--brand-forest-800)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: '1.10rem', fontWeight: 800, color: 'var(--brand-forest-900)', marginBottom: '8px' }}>
                Nobreza de Ingredientes
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: 1.55, margin: 0 }}>
                Inspeção da ordem decrescente dos primeiros 5 ingredientes (IN MAPA 22/2009) priorizando fontes proteicas de alta digestibilidade.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-cream)',
                padding: '24px 20px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--brand-forest-100)',
                  color: 'var(--brand-forest-800)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                }}
              >
                4
              </div>
              <h3 style={{ fontSize: '1.10rem', fontWeight: 800, color: 'var(--brand-forest-900)', marginBottom: '8px' }}>
                Conservantes e Aditivos
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: 1.55, margin: 0 }}>
                Análise de aditivos tecnológicos (IN MAPA 110/2020), pontuando a eliminação de conservantes sintéticos (BHT/BHA) e ausência de OGM.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ INSTITUCIONAL */}
      <section style={{ padding: '60px 0', backgroundColor: 'var(--bg-subtle)' }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--brand-forest-700)',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Dúvidas Técnicas & Metodologia
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.85rem',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                marginBottom: '10px',
              }}
            >
              Perguntas frequentes sobre a avaliação técnica
            </h2>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)' }}>
              Esclarecimentos sobre nossa metodologia documental, normas do MAPA e conformidade com o Código de Defesa do Consumidor.
            </p>
          </div>

          <FaqAccordion faqs={faqs} />
        </div>
      </section>
    </div>
  </>
);
}
