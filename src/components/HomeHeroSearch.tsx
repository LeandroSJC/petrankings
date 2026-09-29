'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, ArrowRight, Stethoscope, ShieldCheck, X } from 'lucide-react';

interface SearchProductItem {
  id: string;
  slug: string;
  commercialName: string;
  brand: string;
  species: string;
  lifeStage: string;
  scoreTotal: number | null;
  classificationTier: string;
  frontLabelImageUrl?: string | null;
  legalCategory: string;
  coadjuvanteCondition?: string | null;
}

interface SearchCategoryItem {
  slug: string;
  label: string;
}

interface SearchResponse {
  products: SearchProductItem[];
  categories: SearchCategoryItem[];
}

export default function HomeHeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse>({ products: [], categories: [] });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ products: [], categories: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data: SearchResponse = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/catalogo?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '680px' }}>
      <form onSubmit={handleSubmit} style={{ position: 'relative', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--brand-forest-600)',
            boxShadow: '0 8px 28px rgba(4, 120, 87, 0.14)',
            overflow: 'hidden',
            padding: '4px 6px 4px 16px',
            transition: 'var(--transition-fast)',
          }}
        >
          <Search size={22} color="var(--brand-forest-600)" aria-hidden="true" style={{ flexShrink: 0, marginRight: '10px' }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.products.length > 0 || results.categories.length > 0) setIsOpen(true);
            }}
            placeholder="Consulte a ficha técnica de uma ração (ex: PremieR, Golden, Royal Canin)..."
            aria-label="Buscar ração por marca ou nome"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              color: 'var(--text-main)',
              backgroundColor: 'transparent',
              padding: '10px 0',
              fontFamily: 'inherit',
            }}
          />

          {loading && (
            <Loader2 size={18} className="animate-spin" color="var(--brand-forest-600)" style={{ marginRight: '8px' }} />
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              aria-label="Limpar busca"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          )}

          <button
            type="submit"
            style={{
              backgroundColor: 'var(--brand-forest-700)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 20px',
              fontSize: '0.90rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition-fast)',
              flexShrink: 0,
            }}
            className="hero-search-submit-btn"
          >
            <span>Buscar</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </form>

      {/* Dropdown de Resultados Preditivos Instantâneos */}
      {isOpen && (results.products.length > 0 || results.categories.length > 0) && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-cream)',
            boxShadow: '0 16px 36px rgba(15, 23, 42, 0.16)',
            zIndex: 99,
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          {results.categories.length > 0 && (
            <div style={{ padding: '6px 16px 4px 16px' }}>
              <span style={{ fontSize: '0.70rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Segmentos Encontrados
              </span>
              {results.categories.map((c) => (
                <Link
                  key={c.slug}
                  href={c.slug === 'coadjuvantes' ? '/coadjuvantes' : `/indice/${c.slug}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--brand-forest-800)',
                    textDecoration: 'none',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    marginTop: '4px',
                    backgroundColor: 'var(--brand-forest-50)',
                  }}
                >
                  <span>{c.label}</span>
                  <ArrowRight size={13} color="var(--brand-forest-600)" />
                </Link>
              ))}
            </div>
          )}

          {results.products.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px 4px 16px' }}>
                <span style={{ fontSize: '0.70rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Produtos Oficiais Analisados
                </span>
              </div>
              {results.products.map((p) => (
                <Link
                  key={p.id}
                  href={`/produto/${p.slug}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--border-cream-light)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background-color 0.15s ease',
                  }}
                  className="search-result-row"
                >
                  {p.frontLabelImageUrl ? (
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        position: 'relative',
                        flexShrink: 0,
                        borderRadius: 'var(--radius-xs)',
                        overflow: 'hidden',
                        backgroundColor: 'var(--bg-muted)',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.frontLabelImageUrl} alt={p.commercialName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--bg-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      <ShieldCheck size={18} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {p.brand}
                    </span>
                    <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--brand-forest-900)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.commercialName}
                    </h4>
                  </div>

                  {p.scoreTotal !== null && (
                    <span
                      style={{
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        backgroundColor: p.scoreTotal >= 80 ? 'var(--brand-forest-100)' : 'var(--gold-100)',
                        color: p.scoreTotal >= 80 ? 'var(--brand-forest-800)' : 'var(--gold-800)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        flexShrink: 0,
                      }}
                    >
                      Nota {p.scoreTotal}
                    </span>
                  )}
                </Link>
              ))}

              <div style={{ padding: '8px 16px', textAlign: 'center', backgroundColor: 'var(--bg-subtle)' }}>
                <Link
                  href={`/catalogo?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--brand-forest-700)',
                    textDecoration: 'none',
                  }}
                >
                  Ver todos os resultados no Catálogo Geral →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
