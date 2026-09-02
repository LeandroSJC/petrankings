'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Loader2, Award, Package, Star, ArrowRight, CornerDownLeft } from 'lucide-react';

interface SearchRankingItem {
  id: string;
  title: string;
  slug: string;
  species: string;
  productType: string;
  _count: { products: number };
}

interface SearchProductItem {
  id: string;
  title: string;
  brand?: string | null;
  species: string;
  productType: string;
  imageUrl?: string | null;
  averageRating: number | null;
  rankings: Array<{
    ranking: {
      id: string;
      title: string;
      slug: string;
    };
  }>;
}

interface SearchResponse {
  rankings: SearchRankingItem[];
  products: SearchProductItem[];
  totalFound?: number;
}

export default function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse>({ rankings: [], products: [] });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Lista plana de itens navegáveis via teclado
  const flattenedItems = [
    ...results.rankings.map((r) => ({
      type: 'ranking' as const,
      url: `/ranking/${r.slug}`,
      id: r.id,
    })),
    ...results.products.map((p) => {
      const primaryRanking = p.rankings[0]?.ranking;
      return {
        type: 'product' as const,
        url: primaryRanking ? `/ranking/${primaryRanking.slug}#product-${p.id}` : `/?q=${encodeURIComponent(p.title)}`,
        id: p.id,
      };
    }),
  ];

  // Atalho de teclado global: '/' ou 'Ctrl+K' / 'Cmd+K' para focar na busca
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) && !isInput) {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setIsMobileSearchActive(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        } else {
          inputRef.current?.focus();
          setIsOpen(true);
        }
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMobileSearchActive(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Efetuar busca debounced com abort controller
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults({ rankings: [], products: [] });
      setLoading(false);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data: SearchResponse = await res.json();
          setResults(data);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Erro na busca instantânea:', err);
        }
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setIsMobileSearchActive(false);
    setQuery('');
    router.push(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || flattenedItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flattenedItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flattenedItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flattenedItems.length) {
        handleSelect(flattenedItems[selectedIndex].url);
      } else if (results.rankings.length > 0) {
        handleSelect(`/ranking/${results.rankings[0].slug}`);
      }
    }
  };

  const hasResults = results.rankings.length > 0 || results.products.length > 0;
  const showDropdown = isOpen && query.trim().length >= 2;

  return (
    <>
      {/* Botão de Busca no Mobile (< 768px) */}
      <button
        type="button"
        onClick={() => {
          setIsMobileSearchActive(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        }}
        aria-label="Abrir busca de rankings e produtos"
        className="mobile-search-trigger"
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          color: 'var(--brand-forest-900)',
          backgroundColor: 'var(--bg-cream-subtle)',
          border: '1.5px solid var(--border-cream)',
          cursor: 'pointer',
          transition: 'var(--transition-fast)',
        }}
      >
        <Search size={20} aria-hidden="true" />
      </button>

      {/* Overlay de Busca Mobile em Tela Cheia */}
      {isMobileSearchActive && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Busca de produtos e rankings"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#ffffff',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            animation: 'lightboxFadeIn 0.2s ease',
          }}
        >
          {/* Barra Superior Mobile */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 20px',
              borderBottom: '1.5px solid var(--border-cream)',
              backgroundColor: '#ffffff',
            }}
          >
            <Search size={20} color="var(--brand-forest-700)" aria-hidden="true" />
            <input
              ref={mobileInputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ração, areia, marca..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '1.05rem',
                color: 'var(--brand-forest-900)',
                backgroundColor: 'transparent',
              }}
            />
            {loading && <Loader2 size={18} className="animate-spin" color="var(--brand-forest-600)" />}
            {query && !loading && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpar texto"
                style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchActive(false);
                setQuery('');
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--brand-forest-800)',
                cursor: 'pointer',
                padding: '6px 8px',
              }}
            >
              Fechar
            </button>
          </div>

          {/* Resultados Mobile */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {query.trim().length < 2 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', paddingTop: '32px' }}>
                Digite ao menos 2 letras para buscar rankings e produtos...
              </div>
            ) : !loading && !hasResults ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                Nenhum resultado encontrado para &quot;<strong>{query}</strong>&quot;.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {results.rankings.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gold-800)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
                      🏆 Rankings Relacionados
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {results.rankings.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleSelect(`/ranking/${r.slug}`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-cream-subtle)',
                            border: '1px solid var(--border-cream)',
                            textAlign: 'left',
                            width: '100%',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '0.94rem', color: 'var(--brand-forest-900)', display: 'block' }}>
                              {r.title}
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {r.species === 'caes' ? '🐕 Cães' : '🐈 Gatos'} • {r.productType} ({r._count.products} produtos)
                            </span>
                          </div>
                          <ArrowRight size={16} color="var(--brand-forest-600)" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {results.products.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--brand-forest-700)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
                      📦 Produtos no Catálogo
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {results.products.map((p) => {
                        const primaryRanking = p.rankings[0]?.ranking;
                        const targetUrl = primaryRanking
                          ? `/ranking/${primaryRanking.slug}#product-${p.id}`
                          : `/?q=${encodeURIComponent(p.title)}`;

                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelect(targetUrl)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: '#ffffff',
                              border: '1px solid var(--border-cream)',
                              textAlign: 'left',
                              width: '100%',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: 'var(--bg-cream-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                              {p.imageUrl ? (
                                <Image src={p.imageUrl} alt={p.title} fill sizes="40px" style={{ objectFit: 'contain', padding: '2px' }} />
                              ) : (
                                <Package size={20} color="#94a3b8" />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong style={{ fontSize: '0.9rem', color: 'var(--brand-forest-900)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.title}
                              </strong>
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                {p.brand ? `${p.brand} • ` : ''}
                                {p.species === 'caes' ? '🐕 Cães' : '🐈 Gatos'}
                              </span>
                            </div>
                            {p.averageRating !== null && (
                              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gold-700)', display: 'inline-flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                                ★ {p.averageRating.toFixed(1)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barra de Busca Desktop (≥ 768px) */}
      <div
        ref={containerRef}
        className="desktop-search-container"
        style={{
          position: 'relative',
          width: '280px',
          maxWidth: '320px',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-cream-subtle)',
            border: isOpen ? '1.5px solid var(--gold-500)' : '1.5px solid var(--border-cream)',
            borderRadius: 'var(--radius-full)',
            padding: '7px 14px 7px 12px',
            transition: 'var(--transition-fast)',
            boxShadow: isOpen ? '0 4px 16px rgba(212, 175, 55, 0.2)' : 'none',
          }}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" color="var(--brand-forest-700)" style={{ flexShrink: 0, marginRight: '8px' }} />
          ) : (
            <Search size={16} color="var(--text-subtle)" style={{ flexShrink: 0, marginRight: '8px' }} />
          )}

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim().length >= 2) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar rações, rankings..."
            aria-label="Buscar rankings e produtos"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '0.86rem',
              color: 'var(--brand-forest-900)',
              fontWeight: 500,
            }}
          />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Limpar busca"
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: 'var(--text-subtle)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          ) : (
            <kbd
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: 'var(--text-subtle)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-cream)',
                borderRadius: '4px',
                padding: '1px 5px',
                lineHeight: 1.2,
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              /
            </kbd>
          )}
        </div>

        {/* Dropdown Flutuante de Autocomplete Desktop */}
        {showDropdown && (
          <div
            role="listbox"
            aria-label="Resultados da busca"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: '380px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-cream)',
              boxShadow: '0 18px 44px rgba(4, 20, 12, 0.18)',
              padding: '14px',
              zIndex: 1000,
              animation: 'lightboxFadeIn 0.16s ease',
              maxHeight: '440px',
              overflowY: 'auto',
            }}
          >
            {!loading && !hasResults ? (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Nenhum resultado para &quot;<strong>{query}</strong>&quot;.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Grupo Rankings */}
                {results.rankings.length > 0 && (
                  <div>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: 'var(--gold-800)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        display: 'block',
                        marginBottom: '6px',
                        paddingLeft: '4px',
                      }}
                    >
                      🏆 Rankings
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {results.rankings.map((r, rIdx) => {
                        const isSelected = selectedIndex === rIdx;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => handleSelect(`/ranking/${r.slug}`)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: isSelected ? 'var(--brand-forest-50)' : 'transparent',
                              border: isSelected ? '1px solid var(--brand-forest-200)' : '1px solid transparent',
                              textAlign: 'left',
                              width: '100%',
                              cursor: 'pointer',
                              transition: 'var(--transition-fast)',
                            }}
                            onMouseEnter={() => setSelectedIndex(rIdx)}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <strong style={{ fontSize: '0.86rem', color: 'var(--brand-forest-900)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {r.title}
                              </strong>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {r.species === 'caes' ? '🐕 Cães' : '🐈 Gatos'} • {r._count.products} produtos
                              </span>
                            </div>
                            <ArrowRight size={14} color="var(--brand-forest-700)" style={{ flexShrink: 0, marginLeft: '6px' }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Grupo Produtos */}
                {results.products.length > 0 && (
                  <div>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: 'var(--brand-forest-700)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        display: 'block',
                        marginBottom: '6px',
                        paddingLeft: '4px',
                      }}
                    >
                      📦 Produtos
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {results.products.map((p, pIdx) => {
                        const actualIdx = results.rankings.length + pIdx;
                        const isSelected = selectedIndex === actualIdx;
                        const primaryRanking = p.rankings[0]?.ranking;
                        const targetUrl = primaryRanking
                          ? `/ranking/${primaryRanking.slug}#product-${p.id}`
                          : `/?q=${encodeURIComponent(p.title)}`;

                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelect(targetUrl)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: isSelected ? 'var(--brand-forest-50)' : 'transparent',
                              border: isSelected ? '1px solid var(--brand-forest-200)' : '1px solid transparent',
                              textAlign: 'left',
                              width: '100%',
                              cursor: 'pointer',
                              transition: 'var(--transition-fast)',
                            }}
                            onMouseEnter={() => setSelectedIndex(actualIdx)}
                          >
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-cream-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0,
                                position: 'relative',
                                border: '1px solid var(--border-cream)',
                              }}
                            >
                              {p.imageUrl ? (
                                <Image src={p.imageUrl} alt={p.title} fill sizes="34px" style={{ objectFit: 'contain', padding: '2px' }} />
                              ) : (
                                <Package size={16} color="#94a3b8" />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--brand-forest-900)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.title}
                              </strong>
                              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                                {p.brand ? `${p.brand} • ` : ''}
                                {p.species === 'caes' ? '🐕 Cães' : '🐈 Gatos'}
                              </span>
                            </div>
                            {p.averageRating !== null && (
                              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--gold-700)', display: 'inline-flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                                ★ {p.averageRating.toFixed(1)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rodapé de Dica do Dropdown */}
                <div
                  style={{
                    borderTop: '1px solid var(--border-cream-light)',
                    paddingTop: '8px',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: 'var(--text-subtle)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CornerDownLeft size={11} /> Pressione Enter para abrir
                  </span>
                  <span>Esc para fechar</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
