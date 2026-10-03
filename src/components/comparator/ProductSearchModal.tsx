'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Search, X, PawPrint, Camera, Check, Sparkles, AlertCircle } from 'lucide-react';

interface SearchResultItem {
  id: string;
  slug: string;
  commercialName: string;
  brand: string;
  species: string;
  lifeStage: string;
  foodType?: string;
  scoreTotal: number | null;
  classificationTier: string;
  frontLabelImageUrl: string | null;
  legalCategory: string;
  coadjuvanteCondition?: string | null;
}

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (productSlug: string) => void;
  slotIndex: number;
  selectedSlugs: string[];
  initialSpeciesFilter?: 'ALL' | 'CAO' | 'GATO';
}

export default function ProductSearchModal({
  isOpen,
  onClose,
  onSelectProduct,
  slotIndex,
  selectedSlugs,
  initialSpeciesFilter = 'ALL',
}: ProductSearchModalProps) {
  const [query, setQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<'ALL' | 'CAO' | 'GATO'>(initialSpeciesFilter);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setHasSearched(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Tecla Escape para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bloqueio de scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Busca debounced
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const speciesParam = speciesFilter !== 'ALL' ? `&species=${speciesFilter}` : '';
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}${speciesParam}&limit=12`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.products || []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Erro na busca do comparador:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
        setHasSearched(true);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query, speciesFilter, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(2, 6, 23, 0.65)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-cream-dark)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Cabeçalho do Modal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid var(--border-cream)',
            backgroundColor: 'var(--bg-subtle)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.70rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--brand-forest-700)',
                display: 'block',
              }}
            >
              Slot {slotIndex + 1} de Comparação
            </span>
            <h2
              id="search-modal-title"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.20rem',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                margin: 0,
              }}
            >
              Selecione o alimento
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar busca"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-muted)',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-cream)',
              transition: 'var(--transition-fast)',
            }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Campo de Entrada e Filtros de Espécie */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-cream)' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o nome da ração ou marca (ex: PremieR, Golden, Royal Canin)..."
              aria-label="Pesquisar alimento por nome ou marca"
              style={{
                width: '100%',
                padding: '12px 40px 12px 42px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-cream-dark)',
                backgroundColor: 'var(--bg-main)',
                fontSize: '0.94rem',
                color: 'var(--text-main)',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Limpar texto"
                style={{
                  position: 'absolute',
                  right: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filtros Rápidos de Espécie */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Filtrar:
            </span>
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'CAO', label: '🐕 Cães' },
              { id: 'GATO', label: '🐈 Gatos' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSpeciesFilter(tab.id as any)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: speciesFilter === tab.id ? 700 : 500,
                  backgroundColor: speciesFilter === tab.id ? 'var(--brand-forest-700)' : 'var(--bg-muted)',
                  color: speciesFilter === tab.id ? '#ffffff' : 'var(--text-body)',
                  border: '1px solid',
                  borderColor: speciesFilter === tab.id ? 'var(--brand-forest-700)' : 'var(--border-cream)',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Resultados com Scroll */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 18px',
            minHeight: '260px',
            maxHeight: '440px',
          }}
        >
          {isLoading && (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div
                style={{
                  display: 'inline-block',
                  width: '24px',
                  height: '24px',
                  border: '3px solid var(--border-cream)',
                  borderTopColor: 'var(--brand-forest-600)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '10px',
                }}
              />
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Consultando catálogo oficial...</p>
            </div>
          )}

          {!isLoading && query.trim().length < 2 && (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <PawPrint size={36} color="var(--brand-forest-300)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.90rem', fontWeight: 600, color: 'var(--brand-forest-900)', margin: '0 0 4px' }}>
                Pesquise entre mais de 1.080 produtos cadastrados
              </p>
              <p style={{ fontSize: '0.80rem', margin: 0 }}>
                Digite ao menos 2 caracteres para visualizar as opções em tempo real.
              </p>
            </div>
          )}

          {!isLoading && hasSearched && results.length === 0 && query.trim().length >= 2 && (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <AlertCircle size={32} color="var(--gold-600)" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: '0.90rem', fontWeight: 600, color: 'var(--brand-forest-900)', margin: '0 0 4px' }}>
                Nenhum alimento localizado para "{query}"
              </p>
              <p style={{ fontSize: '0.80rem', margin: 0 }}>
                Tente buscar apenas pela marca (ex: "PremieR", "Biofresh", "Golden") ou outro termo.
              </p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map((product) => {
                const isAlreadySelected = selectedSlugs.includes(product.slug);
                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      if (!isAlreadySelected) {
                        onSelectProduct(product.slug);
                      }
                    }}
                    disabled={isAlreadySelected}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid',
                      borderColor: isAlreadySelected ? 'var(--border-cream)' : 'var(--border-cream-dark)',
                      backgroundColor: isAlreadySelected ? 'var(--bg-muted)' : '#ffffff',
                      textAlign: 'left',
                      width: '100%',
                      cursor: isAlreadySelected ? 'not-allowed' : 'pointer',
                      opacity: isAlreadySelected ? 0.6 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Packshot ou fallback */}
                    <div
                      style={{
                        position: 'relative',
                        width: '46px',
                        height: '56px',
                        flexShrink: 0,
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-cream)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {product.frontLabelImageUrl ? (
                        <Image
                          src={product.frontLabelImageUrl}
                          alt={product.commercialName}
                          fill
                          sizes="46px"
                          style={{ objectFit: 'contain', padding: '3px' }}
                        />
                      ) : (
                        <Camera size={16} color="var(--text-subtle)" />
                      )}
                    </div>

                    {/* Dados do Produto */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: product.species === 'CAO' ? 'var(--dog-accent-bg)' : 'var(--cat-accent-bg)',
                            color: product.species === 'CAO' ? 'var(--dog-accent-text)' : 'var(--cat-accent-text)',
                            border: `1px solid ${product.species === 'CAO' ? 'var(--dog-accent-border)' : 'var(--cat-accent-border)'}`,
                          }}
                        >
                          {product.species === 'CAO' ? 'Cão' : 'Gato'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {product.brand}
                        </span>
                        {product.foodType === 'UMIDO' && (
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                            }}
                          >
                            Sachê/Patê
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '0.86rem',
                          fontWeight: 700,
                          color: 'var(--brand-forest-900)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {product.commercialName}
                      </div>
                    </div>

                    {/* Score ou Tag de já selecionado */}
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      {isAlreadySelected ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            padding: '3px 8px',
                            backgroundColor: 'var(--bg-muted)',
                            borderRadius: 'var(--radius-xs)',
                          }}
                        >
                          <Check size={12} />
                          Selecionado
                        </span>
                      ) : product.scoreTotal !== null ? (
                        <div
                          style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--brand-forest-50)',
                            border: '1px solid var(--brand-forest-200)',
                            color: 'var(--brand-forest-700)',
                            fontSize: '0.80rem',
                            fontWeight: 800,
                          }}
                        >
                          {product.scoreTotal}/100
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '3px 6px',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: '#eef2ff',
                            border: '1px solid #c7d2fe',
                            color: '#3730a3',
                            fontSize: '0.70rem',
                            fontWeight: 700,
                          }}
                        >
                          Coadjuvante
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé do Modal com Dica */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid var(--border-cream)',
            backgroundColor: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>Pressione ESC para fechar</span>
          <span>Observatório PetRankings • Dados Oficiais</span>
        </div>
      </div>
    </div>
  );
}
