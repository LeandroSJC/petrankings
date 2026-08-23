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
            {filteredRankings.map((ranking) => (
              <article
                key={ranking.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--border-cream)',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'var(--transition)',
                }}
                className="ranking-card"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span
                      className={`tag-pill ${
                        ranking.species === 'caes' ? 'tag-caes' : 'tag-gatos'
                      }`}
                    >
                      {ranking.species === 'caes' ? '🐕 Cães' : '🐈 Gatos'}
                    </span>
                    <span className="tag-pill tag-type">{ranking.productType}</span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', lineHeight: 1.3 }}>
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
                    borderTop: '1px solid var(--border-cream-light)',
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
                      color: 'var(--brand-forest-900)',
                      backgroundColor: 'var(--brand-forest-50)',
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-full)',
                      transition: 'var(--transition-fast)',
                      border: '1.5px solid var(--brand-forest-200)',
                      minHeight: '40px',
                    }}
                    className="ranking-cta-btn"
                    aria-label={`Ver comparativo completo: ${ranking.title}`}
                  >
                    <span>Ver Ranking 🐾</span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
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
