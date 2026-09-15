'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Loader2, ShieldCheck, Stethoscope, ArrowRight, CornerDownLeft } from 'lucide-react';
import { formatarTermo } from '@/lib/formatters';

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

export default function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse>({ products: [], categories: [] });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Lista plana de itens navegáveis via teclado
  const flattenedItems = [
    ...results.categories.map((c) => ({
      type: 'category' as const,
      url: c.slug === 'coadjuvantes' ? '/coadjuvantes' : `/indice/${c.slug}`,
      id: c.slug,
    })),
    ...results.products.map((p) => ({
      type: 'product' as const,
      url: `/produto/${p.slug}`,
      id: p.id,
    })),
  ];

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ products: [], categories: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults({
            products: data.products || [],
            categories: data.categories || [],
          });
          setIsOpen(true);
          setSelectedIndex(-1);
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
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Campo Desktop */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '16px',
            color: 'var(--brand-forest-700)',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar marcas, alimentos, ingredientes..."
          aria-label="Buscar produtos e laudos analisados"
          className="header-search-input"
          style={{
            width: '100%',
            height: '44px',
            padding: '0 42px 0 46px',
            borderRadius: 'var(--radius-full)',
            border: '1.5px solid var(--border-cream)',
            backgroundColor: 'var(--bg-cream-main)',
            color: 'var(--brand-forest-950)',
            fontSize: '0.92rem',
            fontWeight: 500,
            outline: 'none',
            transition: 'var(--transition-fast)',
          }}
        />
        {loading && (
          <Loader2
            size={16}
            className="animate-spin"
            style={{
              position: 'absolute',
              right: '14px',
              color: 'var(--brand-forest-600)',
            }}
          />
        )}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            aria-label="Limpar busca"
            style={{
              position: 'absolute',
              right: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown de Resultados */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '48px',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-cream)',
            boxShadow: '0 12px 32px rgba(8, 33, 21, 0.12)',
            zIndex: 999,
            overflow: 'hidden',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {results.categories.length > 0 && (
            <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-cream-subtle)', borderBottom: '1px solid var(--border-cream)' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                Categorias Oficiais
              </span>
              {results.categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => handleSelect(c.slug === 'coadjuvantes' ? '/coadjuvantes' : `/indice/${c.slug}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    margin: '4px 0',
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: '#ffffff',
                    color: 'var(--brand-forest-900)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span>{c.label}</span>
                  <ArrowRight size={13} color="var(--text-muted)" />
                </button>
              ))}
            </div>
          )}

          {results.products.length > 0 ? (
            <div style={{ padding: '8px 0' }}>
              <div style={{ padding: '4px 14px 8px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Produtos Analisados
              </div>
              {results.products.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleSelect(`/produto/${prod.slug}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'var(--transition-fast)',
                  }}
                  className="search-item-hover"
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-cream-main)',
                      border: '1px solid var(--border-cream-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      color: prod.scoreTotal !== null && prod.scoreTotal >= 75 ? '#065f46' : '#92400e',
                    }}
                  >
                    {prod.scoreTotal !== null ? prod.scoreTotal : <Stethoscope size={16} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {prod.commercialName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {prod.brand} • {prod.classificationTier === 'COADJUVANTE' ? 'Coadjuvante' : formatarTermo(prod.classificationTier)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            query.trim().length >= 2 && !loading && (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Nenhum produto cadastrado com os termos digitados.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
