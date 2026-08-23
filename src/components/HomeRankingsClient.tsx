'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Award, ArrowUpRight } from 'lucide-react';
import FilterBar from '@/components/FilterBar';
import { formatDate } from '@/lib/utils';

export interface RankingItem {
  id: string;
  slug: string;
  title: string;
  species: string;
  productType: string;
  description?: string | null;
  dataUpdatedAt?: Date | string | null;
  _count?: {
    products: number;
  };
}

export default function HomeRankingsClient({
  initialRankings,
}: {
  initialRankings: RankingItem[];
}) {
  const [selectedSpecies, setSelectedSpecies] = useState('todos');
  const [selectedType, setSelectedType] = useState('todos');

  // Extrair tipos disponíveis baseados na espécie selecionada
  const availableTypes = useMemo(() => {
    const relevant =
      selectedSpecies === 'todos'
        ? initialRankings
        : initialRankings.filter((r) => r.species === selectedSpecies);
    const types = Array.from(new Set(relevant.map((r) => r.productType))).filter(Boolean);
    return types;
  }, [initialRankings, selectedSpecies]);

  // Filtrar rankings
  const filteredRankings = useMemo(() => {
    return initialRankings.filter((r) => {
      if (selectedSpecies !== 'todos' && r.species !== selectedSpecies) return false;
      if (selectedType !== 'todos' && r.productType !== selectedType) return false;
      return true;
    });
  }, [initialRankings, selectedSpecies, selectedType]);

  return (
    <>
      {/* Barra de Filtros */}
      <FilterBar
        selectedSpecies={selectedSpecies}
        onSelectSpecies={setSelectedSpecies}
        selectedType={selectedType}
        onSelectType={setSelectedType}
        availableTypes={availableTypes}
      />

      {/* Grade de Rankings */}
      <div style={{ marginTop: '36px' }}>
        {filteredRankings.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '26px',
            }}
          >
            {filteredRankings.map((ranking) => {
              const isDog = ranking.species === 'caes';
              const productCount = ranking._count?.products || 4;
              return (
                <article
                  key={ranking.id}
                  style={{
                    backgroundColor: '#ffffff',
                    backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #faf8f4 100%)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1.5px solid #dfd7c7',
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 18px rgba(8, 33, 21, 0.06)',
                    transition: 'var(--transition)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  className="ranking-card"
                >
                  {/* Faixa decorativa superior com cor da espécie */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      backgroundColor: isDog ? '#b45309' : '#4338ca',
                    }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '4px' }}>
                    {/* Tags e Quantidade de Produtos */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <span
                          className={`tag-pill ${isDog ? 'tag-caes' : 'tag-gatos'}`}
                        >
                          {isDog ? '🐕 Cães' : '🐈 Gatos'}
                        </span>
                        <span className="tag-pill tag-type">{ranking.productType}</span>
                      </div>

                      <span
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          color: 'var(--brand-forest-800)',
                          backgroundColor: 'rgba(8, 33, 21, 0.05)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          border: '1px solid var(--border-cream)',
                        }}
                      >
                        {productCount} opções no pódio
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.35rem', lineHeight: 1.3, marginTop: '4px' }}>
                      <Link
                        href={`/ranking/${ranking.slug}`}
                        style={{ color: 'var(--brand-forest-900)', textDecoration: 'none' }}
                      >
                        {ranking.title}
                      </Link>
                    </h3>

                    {ranking.description && (
                      <p style={{ fontSize: '0.96rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
                        {ranking.description}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      borderTop: '1.5px solid #eae3d6',
                      paddingTop: '18px',
                      marginTop: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span>Revisado em: </span>
                      <strong style={{ color: 'var(--brand-forest-900)' }}>
                        {formatDate(ranking.dataUpdatedAt)}
                      </strong>
                    </div>

                    <Link
                      href={`/ranking/${ranking.slug}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        backgroundColor: '#082115',
                        padding: '10px 18px',
                        borderRadius: 'var(--radius-full)',
                        transition: 'var(--transition-fast)',
                        border: '1.5px solid #174e35',
                        boxShadow: '0 2px 8px rgba(8, 33, 21, 0.2)',
                        minHeight: '40px',
                        textDecoration: 'none',
                      }}
                      className="ranking-cta-btn"
                      aria-label={`Ver comparativo completo: ${ranking.title}`}
                    >
                      <span>Ver Ranking 🐾</span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Estado Vazio */
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
            <h3 style={{ fontSize: '1.3rem', color: 'var(--brand-forest-900)' }}>
              Nenhum ranking encontrado para esta seleção
            </h3>
            <p style={{ color: 'var(--text-body)', fontSize: '0.96rem', maxWidth: '440px' }}>
              Tente selecionar outra espécie ou categoria para visualizar os rankings publicados.
            </p>
            <button
              onClick={() => {
                setSelectedSpecies('todos');
                setSelectedType('todos');
              }}
              style={{
                backgroundColor: 'var(--brand-forest-800)',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.94rem',
                fontWeight: 700,
                minHeight: '44px',
              }}
            >
              Ver Todos os Rankings
            </button>
          </div>
        )}
      </div>
    </>
  );
}
