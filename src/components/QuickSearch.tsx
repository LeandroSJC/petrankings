'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Sparkles, ArrowRight, Dog, Cat } from 'lucide-react';

interface SearchProduct {
  id: string;
  slug: string;
  commercialName: string;
  brand: string;
  species: 'CAO' | 'GATO';
  lifeStage: string;
  foodType: string;
  scoreTotal: number;
  classificationTier: string;
  frontLabelImageUrl?: string | null;
  legalCategory?: string | null;
  coadjuvanteCondition?: string | null;
}

interface SearchCategory {
  slug: string;
  label: string;
  keywords: string[];
}

interface SearchResponse {
  products: SearchProduct[];
  categories: SearchCategory[];
}

export default function QuickSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse>({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isPending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Atalho de teclado global Ctrl+K / Cmd+K para abrir a busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Foca no input ao abrir
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setResults({ products: [], categories: [] });
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Busca com debounce de 220ms
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults({ products: [], categories: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.ok) {
          const data: SearchResponse = await res.json();
          setResults(data);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Erro na pesquisa rápida:', err);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(handler);
  }, [query]);

  const handleSelectProduct = (slug: string) => {
    setIsOpen(false);
    startTransition(() => {
      router.push(`/produto/${slug}`);
    });
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    const totalItems = results.products.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < totalItems ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results.products[selectedIndex]) {
        handleSelectProduct(results.products[selectedIndex].slug);
      } else if (query.trim().length >= 2) {
        setIsOpen(false);
        router.push(`/catalogo?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <>
      {/* Gatilho visual no Header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Pesquisar rações e marcas"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '0 14px',
          height: '42px',
          borderRadius: '24px',
          backgroundColor: 'var(--bg-muted)',
          border: '1px solid var(--border-cream)',
          color: 'var(--text-muted)',
          fontSize: '0.86rem',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
        className="quick-search-trigger"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, overflow: 'hidden' }}>
          <Search size={16} style={{ color: 'var(--brand-forest-700)', flexShrink: 0 }} />
          <span
            className="quick-search-label"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: 'var(--text-body)',
              fontWeight: 500,
            }}
          >
            Buscar ração ou marca...
          </span>
        </div>
        <kbd
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.70rem',
            padding: '2px 7px',
            borderRadius: '5px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-cream)',
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
            fontWeight: 600,
            flexShrink: 0,
          }}
          className="quick-search-kbd"
        >
          Ctrl K
        </kbd>
      </button>

      {/* Modal Overlay / Backdrop */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Busca instantânea de alimentos"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 33, 21, 0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '16px',
            paddingTop: 'min(10vh, 80px)',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Caixa Central da Busca */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '700px',
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              boxShadow: '0 24px 50px -12px rgba(8, 33, 21, 0.32), 0 0 0 1px rgba(8, 33, 21, 0.08)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '84vh',
            }}
          >
            {/* Input Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '18px 22px',
                borderBottom: '1px solid var(--border-cream)',
                backgroundColor: '#ffffff',
              }}
            >
              <Search size={22} style={{ color: 'var(--brand-forest-700)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDownInput}
                placeholder="Digite a marca ou ração (ex: PremieR, N&D, Gatos Castrados)..."
                aria-label="Campo de pesquisa rápida"
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '1.05rem',
                  fontFamily: 'var(--font-inter)',
                  color: 'var(--brand-forest-900)',
                  backgroundColor: 'transparent',
                }}
              />
              {loading && <Loader2 size={18} className="spin-animation" style={{ color: 'var(--brand-forest-600)', flexShrink: 0 }} />}
              {query && !loading && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Limpar busca"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar busca"
                style={{
                  border: 'none',
                  backgroundColor: 'var(--bg-muted)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                ESC
              </button>
            </div>

            {/* Corpo de Resultados */}
            <div
              style={{
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {/* Sugestões de Categorias */}
              {results.categories.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      color: 'var(--text-muted)',
                      padding: '4px 8px',
                      display: 'block',
                    }}
                  >
                    Categorias Sugeridas
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {results.categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={cat.slug === 'coadjuvantes' ? '/coadjuvantes' : `/indice/${cat.slug}`}
                        onClick={() => setIsOpen(false)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          backgroundColor: 'var(--bg-muted)',
                          border: '1px solid var(--border-cream)',
                          fontSize: '0.80rem',
                          fontWeight: 600,
                          color: 'var(--brand-forest-800)',
                          textDecoration: 'none',
                        }}
                      >
                        <Sparkles size={12} style={{ color: 'var(--brand-forest-600)' }} />
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de Produtos */}
              {results.products.length > 0 && (
                <div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      color: 'var(--text-muted)',
                      padding: '4px 8px',
                      display: 'block',
                    }}
                  >
                    Alimentos Analisados ({results.products.length})
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    {results.products.map((prod, index) => {
                      const isSelected = index === selectedIndex;
                      const isCat = prod.species === 'GATO';

                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleSelectProduct(prod.slug)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            backgroundColor: isSelected ? 'var(--bg-muted)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.12s ease',
                            border: isSelected ? '1px solid var(--brand-forest-600)' : '1px solid transparent',
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            {/* Miniatura da embalagem */}
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--border-cream)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                position: 'relative',
                                overflow: 'hidden',
                              }}
                            >
                              {prod.frontLabelImageUrl ? (
                                <Image
                                  src={prod.frontLabelImageUrl}
                                  alt={prod.commercialName}
                                  width={36}
                                  height={36}
                                  style={{ objectFit: 'contain' }}
                                />
                              ) : isCat ? (
                                <Cat size={18} style={{ color: 'var(--brand-forest-600)' }} />
                              ) : (
                                <Dog size={18} style={{ color: 'var(--brand-forest-600)' }} />
                              )}
                            </div>

                            {/* Informações textuais */}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontSize: '0.70rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    color: 'var(--brand-forest-700)',
                                  }}
                                >
                                  {prod.brand}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.64rem',
                                    fontWeight: 600,
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    backgroundColor: isCat ? '#eef2ff' : '#f0fdf4',
                                    color: isCat ? '#4338ca' : '#15803d',
                                  }}
                                >
                                  {isCat ? 'Gato' : 'Cão'}
                                </span>
                              </div>
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: '0.88rem',
                                  fontWeight: 600,
                                  color: 'var(--brand-forest-900)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {prod.commercialName}
                              </h4>
                            </div>
                          </div>

                          {/* Nota da Avaliação Nutricional */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '12px' }}>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.94rem',
                                  fontWeight: 800,
                                  color: prod.scoreTotal >= 80 ? 'var(--brand-forest-700)' : '#d97706',
                                  lineHeight: 1,
                                }}
                              >
                                {prod.scoreTotal}
                                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>/100</span>
                              </span>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                Nota Técnica
                              </span>
                            </div>
                            <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Nenhum resultado */}
              {!loading && query.trim().length >= 2 && results.products.length === 0 && results.categories.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <p style={{ margin: 0, fontSize: '0.90rem', color: 'var(--text-muted)' }}>
                    Nenhum alimento encontrado para &ldquo;<strong>{query}</strong>&rdquo;.
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: '0.80rem', color: 'var(--text-muted)' }}>
                    Tente buscar por termos genéricos como &ldquo;PremieR&rdquo;, &ldquo;Filhote&rdquo;, &ldquo;Castrados&rdquo; ou consulte o catálogo completo.
                  </p>
                </div>
              )}

              {/* Sugestão inicial quando vazio */}
              {query.trim().length < 2 && (
                <div style={{ padding: '20px 12px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Digite pelo menos 2 letras para pesquisar centenas de alimentos analisados em Matéria Seca (MS).
                  </p>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderTop: '1px solid var(--border-cream)',
                backgroundColor: 'var(--bg-muted)',
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <span><kbd>↑</kbd> <kbd>↓</kbd> navegar</span>
                <span><kbd>↵</kbd> selecionar</span>
                <span><kbd>esc</kbd> fechar</span>
              </div>
              <Link
                href={`/catalogo${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`}
                onClick={() => setIsOpen(false)}
                style={{
                  color: 'var(--brand-forest-700)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Ver tudo no Catálogo →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
