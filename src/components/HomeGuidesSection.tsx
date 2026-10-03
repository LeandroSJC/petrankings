'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { GuideItem } from '@/lib/content/guides';

interface HomeGuidesSectionProps {
  allGuides: GuideItem[];
  featuredSlug?: string;
}

type SpeciesFilter = 'TODOS' | 'CAES' | 'GATOS' | 'AMBOS';

const ITEMS_PER_PAGE = 6;

export default function HomeGuidesSection({
  allGuides,
  featuredSlug,
}: HomeGuidesSectionProps) {
  const [selectedFilter, setSelectedFilter] = useState<SpeciesFilter>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);

  // Ordenação decrescente por data de publicação (mais recentes primeiro)
  const sortedGuides = [...allGuides].sort((a, b) => {
    const timeB = new Date(b.publishedAt + 'T12:00:00Z').getTime();
    const timeA = new Date(a.publishedAt + 'T12:00:00Z').getTime();
    if (timeB !== timeA) return timeB - timeA;
    return new Date(b.updatedAt + 'T12:00:00Z').getTime() - new Date(a.updatedAt + 'T12:00:00Z').getTime();
  });

  // Filtragem dos estudos por espécie
  const filteredGuides = sortedGuides.filter((guide) => {
    if (selectedFilter === 'TODOS') {
      // No modo "Todos", exibe os estudos secundários (o destaque já está no hero acima)
      return guide.slug !== featuredSlug;
    }
    if (selectedFilter === 'CAES') {
      return guide.speciesTarget === 'Cães' || guide.speciesTarget === 'Cães e Gatos';
    }
    if (selectedFilter === 'GATOS') {
      return guide.speciesTarget === 'Gatos' || guide.speciesTarget === 'Cães e Gatos';
    }
    if (selectedFilter === 'AMBOS') {
      return guide.speciesTarget === 'Cães e Gatos';
    }
    return true;
  });

  const totalPages = Math.ceil(filteredGuides.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedGuides = filteredGuides.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const scrollToAnchor = () => {
    if (typeof window !== 'undefined') {
      const anchor = document.getElementById('destaque-da-semana');
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        const fallback = document.getElementById('estudos');
        if (fallback) {
          fallback.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage) return;
    setCurrentPage(newPage);
    scrollToAnchor();
  };

  const handleFilterChange = (filter: SpeciesFilter) => {
    setSelectedFilter(filter);
    setCurrentPage(1);
  };

  const getSpeciesBadge = (target: GuideItem['speciesTarget']) => {
    if (target === 'Cães') return '🐶 Cães';
    if (target === 'Gatos') return '🐱 Gatos';
    return '🐾 Cães e Gatos';
  };

  // Contagens para os filtros
  const counts = {
    todos: allGuides.filter((g) => g.slug !== featuredSlug).length,
    caes: allGuides.filter((g) => g.speciesTarget === 'Cães' || g.speciesTarget === 'Cães e Gatos').length,
    gatos: allGuides.filter((g) => g.speciesTarget === 'Gatos' || g.speciesTarget === 'Cães e Gatos').length,
    ambos: allGuides.filter((g) => g.speciesTarget === 'Cães e Gatos').length,
  };

  return (
    <section id="estudos" style={{ padding: '20px 0 60px 0', scrollMarginTop: '90px' }}>
      <div className="container">
        {/* Cabeçalho da Seção com Filtros por Espécie */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '16px',
            borderBottom: '1px solid var(--border-cream)',
            paddingBottom: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <BookOpen size={18} color="var(--brand-forest-700)" aria-hidden="true" />
              <span
                style={{
                  fontSize: '0.80rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--brand-forest-700)',
                }}
              >
                Pesquisa & Curadoria Técnica
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.25rem, 2.5vw, 1.55rem)',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Estudos Técnicos e Análises de Rótulos
            </h2>
          </div>

          {/* Abas Interativas de Filtro por Espécie */}
          <div
            role="tablist"
            aria-label="Filtrar estudos por espécie"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-subtle)',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-cream)',
              gap: '4px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedFilter === 'TODOS'}
              onClick={() => handleFilterChange('TODOS')}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                backgroundColor: selectedFilter === 'TODOS' ? 'var(--brand-forest-700)' : 'transparent',
                color: selectedFilter === 'TODOS' ? '#ffffff' : 'var(--text-body)',
              }}
            >
              Todos ({counts.todos})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={selectedFilter === 'CAES'}
              onClick={() => handleFilterChange('CAES')}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                backgroundColor: selectedFilter === 'CAES' ? 'var(--brand-forest-700)' : 'transparent',
                color: selectedFilter === 'CAES' ? '#ffffff' : 'var(--text-body)',
              }}
            >
              🐶 Cães ({counts.caes})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={selectedFilter === 'GATOS'}
              onClick={() => handleFilterChange('GATOS')}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                backgroundColor: selectedFilter === 'GATOS' ? 'var(--brand-forest-700)' : 'transparent',
                color: selectedFilter === 'GATOS' ? '#ffffff' : 'var(--text-body)',
              }}
            >
              🐱 Gatos ({counts.gatos})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={selectedFilter === 'AMBOS'}
              onClick={() => handleFilterChange('AMBOS')}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                backgroundColor: selectedFilter === 'AMBOS' ? 'var(--brand-forest-700)' : 'transparent',
                color: selectedFilter === 'AMBOS' ? '#ffffff' : 'var(--text-body)',
              }}
            >
              🐾 Ambos ({counts.ambos})
            </button>
          </div>
        </div>

        {/* Grid de Cards dos Estudos */}
        {paginatedGuides.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {paginatedGuides.map((guide) => (
              <article
                key={guide.slug}
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-cream)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'var(--transition)',
                }}
                className="guide-grid-card"
              >
                <div style={{ position: 'relative', height: '200px', backgroundColor: 'var(--bg-muted)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={guide.coverImageUrl}
                    alt={guide.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.88)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.70rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {guide.cluster}
                  </div>
                </div>

                <div style={{ padding: '24px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      marginBottom: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Clock size={13} aria-hidden="true" />
                    <span>{guide.readingTimeMinutes} min</span>
                    <span>•</span>
                    <span style={{ fontWeight: 600, color: 'var(--brand-forest-800)' }}>
                      {getSpeciesBadge(guide.speciesTarget)}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(guide.publishedAt + 'T12:00:00Z').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.20rem',
                      fontWeight: 800,
                      color: 'var(--brand-forest-900)',
                      lineHeight: 1.3,
                      marginBottom: '10px',
                    }}
                  >
                    <Link href={`/guias/${guide.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {guide.title}
                    </Link>
                  </h3>

                  <p
                    style={{
                      fontSize: '0.90rem',
                      color: 'var(--text-body)',
                      lineHeight: 1.55,
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
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--brand-forest-700)',
                        textDecoration: 'none',
                      }}
                    >
                      <span>Acessar estudo completo</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-cream)',
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
            }}
          >
            Nenhum estudo encontrado para o filtro selecionado.
          </div>
        )}

        {/* Paginação Limpa e Acessível (ancora sempre em Destaque da Semana) */}
        {totalPages > 1 && (
          <nav
            aria-label="Paginação dos estudos"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '36px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-cream)',
                backgroundColor: currentPage === 1 ? 'transparent' : '#ffffff',
                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--brand-forest-800)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                opacity: currentPage === 1 ? 0.5 : 1,
                transition: 'var(--transition-fast)',
              }}
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  aria-current={currentPage === pageNum ? 'page' : undefined}
                  style={{
                    minWidth: '36px',
                    height: '36px',
                    padding: '0 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: currentPage === pageNum ? 'var(--brand-forest-700)' : 'var(--border-cream)',
                    backgroundColor: currentPage === pageNum ? 'var(--brand-forest-700)' : '#ffffff',
                    color: currentPage === pageNum ? '#ffffff' : 'var(--brand-forest-800)',
                    cursor: currentPage === pageNum ? 'default' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'var(--transition-fast)',
                  }}
                  aria-label={`Ir para a página ${pageNum}`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-cream)',
                backgroundColor: currentPage === totalPages ? 'transparent' : '#ffffff',
                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--brand-forest-800)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                opacity: currentPage === totalPages ? 0.5 : 1,
                transition: 'var(--transition-fast)',
              }}
              aria-label="Próxima página"
            >
              <span>Próxima</span>
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}
