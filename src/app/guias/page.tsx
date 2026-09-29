import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getAllGuides, getFeaturedGuide } from '@/lib/content/guides';
import {
  BookOpen,
  Clock,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Database,
  ShieldCheck,
  Tag,
  CheckCircle2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Estudos & Guias de Nutrição Pet — PetRankings',
  description:
    'Análises bromatológicas aprofundadas, duelos técnicos de marcas, investigações de conservantes e guias de rotulagem fundamentados nos dados oficiais do MAPA e ABINPET.',
  alternates: {
    canonical: '/guias',
  },
  openGraph: {
    url: '/guias',
    title: 'Estudos & Guias de Nutrição Pet — PetRankings',
    description:
      'Comparações técnicas sem sensacionalismo: saiba o que realmente está dentro do pacote da ração do seu cão ou gato.',
  },
};

export default function GuiasHubPage() {
  const allGuides = getAllGuides();
  const featuredGuide = getFeaturedGuide();
  const regularGuides = allGuides.filter((g) => g.slug !== featuredGuide.slug);

  return (
    <div style={{ backgroundColor: 'var(--bg-subtle)', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* Breadcrumb */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-cream)',
          padding: '14px 0',
        }}
      >
        <div className="container">
          <nav aria-label="Navegação estrutural" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
            <Link href="/" style={{ color: 'var(--text-body)', textDecoration: 'none' }}>
              Início
            </Link>
            <ChevronRight size={14} color="var(--text-subtle)" aria-hidden="true" />
            <span style={{ color: 'var(--brand-forest-700)', fontWeight: 700 }}>
              Estudos & Guias Técnicos
            </span>
          </nav>
        </div>
      </div>

      {/* Hero do Hub Padronizado */}
      <section
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-cream)',
          padding: '36px 0 32px 0',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '840px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--brand-forest-50)',
                border: '1px solid var(--brand-forest-200)',
                color: 'var(--brand-forest-700)',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '14px',
              }}
            >
              <BookOpen size={14} aria-hidden="true" />
              <span>Observatório Editorial de Pet Food</span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                letterSpacing: '-0.025em',
                lineHeight: 1.18,
                marginBottom: '12px',
              }}
            >
              Estudos, Duelos & Guias de Nutrição Pet
            </h1>

            <p style={{ fontSize: '1rem', color: 'var(--text-body)', lineHeight: 1.6, marginBottom: '20px' }}>
              Análises orientadas a dados primários, comparativos entre marcas populares e desmistificação das letras miúdas dos rótulos. Todas as matérias são fundamentadas nos relatórios oficiais do Ministério da Agricultura (MAPA) e no Manual Pet Food Brasil (ABINPET 11ª Edição).
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.875rem', color: 'var(--text-body)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="var(--brand-forest-700)" aria-hidden="true" />
                Zero dados inventados ou estimativas
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="var(--brand-forest-700)" aria-hidden="true" />
                Cálculos bromatológicos em Matéria Seca (MS)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="var(--brand-forest-700)" aria-hidden="true" />
                Independência editorial estrita
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <div className="container" style={{ marginTop: '40px' }}>
        {/* Estudo de Capa (Destaque Principal) */}
        {featuredGuide && (
          <section style={{ marginBottom: '48px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <Sparkles size={18} color="var(--gold-600)" aria-hidden="true" />
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--brand-forest-900)',
                }}
              >
                Estudo em Destaque
              </h2>
            </div>

            <article
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-cream)',
                boxShadow: 'var(--shadow-md)',
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                transition: 'var(--transition)',
              }}
              className="featured-guide-card"
            >
              {/* Imagem do Estudo de Capa */}
              <div
                style={{
                  position: 'relative',
                  minHeight: '280px',
                  backgroundColor: 'var(--bg-muted)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredGuide.coverImageUrl}
                  alt={featuredGuide.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {featuredGuide.cluster}
                </div>
              </div>

              {/* Informações Editoriais */}
              <div
                style={{
                  padding: '36px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    fontSize: '0.875rem',
                    color: 'var(--text-body)',
                    marginBottom: '14px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={16} aria-hidden="true" />
                    {featuredGuide.readingTimeMinutes} min de leitura
                  </span>
                  <span>•</span>
                  <span>Alvo: {featuredGuide.speciesTarget}</span>
                  <span>•</span>
                  <span>Atualizado em {new Date(featuredGuide.updatedAt).toLocaleDateString('pt-BR')}</span>
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(1.35rem, 2.5vw, 1.75rem)',
                    fontWeight: 800,
                    color: 'var(--brand-forest-900)',
                    lineHeight: 1.25,
                    marginBottom: '12px',
                  }}
                >
                  <Link
                    href={`/guias/${featuredGuide.slug}`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {featuredGuide.title}
                  </Link>
                </h3>

                <p
                  style={{
                    fontSize: '0.96rem',
                    color: 'var(--text-body)',
                    lineHeight: 1.6,
                    marginBottom: '24px',
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
                      padding: '12px 22px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'var(--transition-fast)',
                    }}
                    className="guide-primary-btn"
                  >
                    <span>Ler estudo completo</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          </section>
        )}

        {/* Grade de Todos os Guias & Estudos */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
              }}
            >
              Todos os Guias & Comparações
            </h2>
            <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              {allGuides.length} estudos publicados
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '24px',
            }}
          >
            {allGuides.map((guide) => (
              <article
                key={guide.slug}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-cream)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'var(--transition)',
                }}
                className="guide-grid-card"
              >
                {/* Imagem do Card */}
                <div style={{ position: 'relative', height: '190px', backgroundColor: 'var(--bg-muted)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={guide.coverImageUrl}
                    alt={guide.title}
                    style={{
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
                      backgroundColor: 'rgba(15, 23, 42, 0.88)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {guide.cluster}
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div style={{ padding: '24px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      color: 'var(--text-body)',
                      marginBottom: '10px',
                    }}
                  >
                    <Clock size={14} aria-hidden="true" />
                    <span>{guide.readingTimeMinutes} min</span>
                    <span>•</span>
                    <span>{guide.speciesTarget}</span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.18rem',
                      fontWeight: 800,
                      color: 'var(--brand-forest-900)',
                      lineHeight: 1.35,
                      marginBottom: '10px',
                    }}
                  >
                    <Link
                      href={`/guias/${guide.slug}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {guide.title}
                    </Link>
                  </h3>

                  <p
                    style={{
                      fontSize: '0.94rem',
                      color: 'var(--text-body)',
                      lineHeight: 1.6,
                      marginBottom: '20px',
                      flex: 1,
                    }}
                  >
                    {guide.summary}
                  </p>

                  <div style={{ borderTop: '1px solid var(--border-cream)', paddingTop: '14px', marginTop: 'auto' }}>
                    <Link
                      href={`/guias/${guide.slug}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: 'var(--brand-forest-700)',
                        textDecoration: 'none',
                      }}
                    >
                      <span>Acessar estudo completo</span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Banner de Conexão com o Catálogo Técnico */}
        <section
          style={{
            backgroundColor: 'var(--brand-forest-900)',
            color: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '36px 32px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--brand-forest-300)',
                fontSize: '0.80rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
              }}
            >
              <Database size={16} aria-hidden="true" />
              <span>Base Oficial de Fichas Técnicas</span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#ffffff',
                marginBottom: '10px',
              }}
            >
              Deseja analisar uma ração específica do mercado?
            </h2>
            <p style={{ fontSize: '0.94rem', color: '#cbd5e1', lineHeight: 1.55 }}>
              Consulte nosso catálogo completo com mais de 900 produtos cadastrados. Filtre por espécie, fase de vida, tipo de alimento e compare níveis de garantia oficiais na Matéria Seca.
            </p>
          </div>

          <div>
            <Link
              href="/catalogo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--brand-forest-600)',
                color: '#ffffff',
                padding: '14px 24px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.94rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              }}
            >
              <span>Explorar Catálogo de Rações</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
