'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, PawPrint, Building2, ShieldCheck } from 'lucide-react';

import HeaderSearch from './HeaderSearch';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    setCurrentHash(window.location.hash);
    const onHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const mobileNavLinks = [
    { href: '/', label: 'Início (Comparador)' },
    { href: '/sobre', label: 'Metodologia & Pilares' },
    { href: '/fabricante', label: 'Área do Fabricante', icon: Building2 },
    { href: '/contato', label: 'Fale Conosco' },
  ];

  const isActive = (href: string) => {
    if (href.startsWith('/#')) {
      return pathname === '/' && currentHash === href.replace('/', '');
    }
    if (href === '/') return pathname === '/' && (!currentHash || currentHash === '#catalogo-produtos');
    return pathname.startsWith(href);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-cream)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(8, 33, 21, 0.04)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '76px',
          gap: '16px',
        }}
      >
        {/* Logotipo Editorial Premium */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
          aria-label="PetRankings - Avaliação Nutricional de Pet Food"
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--brand-forest-700)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(4, 120, 87, 0.22)',
            }}
          >
            <PawPrint size={20} aria-hidden="true" fill="currentColor" strokeWidth={1.5} />
          </div>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                letterSpacing: '-0.5px',
                display: 'block',
                lineHeight: 1.05,
              }}
            >
              Pet<span style={{ color: 'var(--brand-forest-600)' }}>Rankings</span>
            </span>
            <span
              style={{
                fontSize: '0.64rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Avaliação Nutricional de Pet Food
            </span>
          </div>
        </Link>

        {/* Busca Ampla exibida apenas em páginas internas (na Home a busca é central) */}
        {pathname !== '/' ? (
          <div
            style={{
              flex: 1,
              maxWidth: '680px',
              minWidth: '220px',
              margin: '0 24px',
            }}
          >
            <HeaderSearch />
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        {/* Lado Direito: Navegação Desktop + Gatilho Mobile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Menu Desktop Visível e Limpo */}
          <nav
            aria-label="Navegação Principal"
            className="desktop-nav"
            style={{
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {[
              { href: '/', label: 'Início' },
              { href: '/sobre', label: 'Metodologia' },
              { href: '/fabricante', label: 'Fabricantes' },
              { href: '/contato', label: 'Fale Conosco' },
            ].map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`desktop-nav-link ${active ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Botão Hambúrguer para Telas Menores */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            className="mobile-menu-btn"
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--brand-forest-900)',
              backgroundColor: 'var(--bg-muted)',
              border: '1px solid var(--border-cream)',
              transition: 'var(--transition-fast)',
              cursor: 'pointer',
            }}
          >
            {mobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: '78px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(4, 20, 12, 0.65)',
              zIndex: 998,
            }}
            onClick={() => setMobileMenuOpen(false)}
          />

          <div
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação móvel"
            style={{
              position: 'absolute',
              top: '78px',
              left: 0,
              right: 0,
              width: '100%',
              backgroundColor: '#ffffff',
              borderBottom: '2px solid var(--border-cream)',
              boxShadow: '0 20px 48px rgba(4, 20, 12, 0.22)',
              padding: '20px 24px 28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              zIndex: 999,
            }}
          >
            <nav
              aria-label="Links do menu móvel"
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {mobileNavLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      fontSize: '0.98rem',
                      fontWeight: active ? 700 : 600,
                      color: active ? 'var(--brand-forest-700)' : 'var(--text-main)',
                      backgroundColor: active ? 'var(--brand-forest-50)' : '#ffffff',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: active ? '1px solid var(--brand-forest-200)' : '1px solid var(--border-cream)',
                      borderLeft: active ? '4px solid var(--brand-forest-600)' : '4px solid transparent',
                      transition: 'var(--transition-fast)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textDecoration: 'none',
                    }}
                  >
                    <span>{link.label}</span>
                    {active && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--brand-forest-700)',
                          backgroundColor: 'var(--brand-forest-100)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        Ativo
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-cream)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <ShieldCheck size={20} color="var(--brand-forest-600)" aria-hidden="true" />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: 1.4 }}>
                Índice 100% determinístico baseado nas informações oficiais dos fabricantes e no Manual ABINPET 11ª Edição.
              </span>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
