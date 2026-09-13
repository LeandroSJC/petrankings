'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShieldCheck, PawPrint, FileSpreadsheet, Building2, Stethoscope } from 'lucide-react';

import HeaderSearch from './HeaderSearch';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mobileNavLinks = [
    { href: '/', label: 'Índice Geral' },
    { href: '/indice/caes-adultos', label: 'Cães Adultos' },
    { href: '/indice/gatos-adultos', label: 'Gatos Adultos' },
    { href: '/coadjuvantes', label: 'Coadjuvantes (Prescrição)', icon: Stethoscope },
    { href: '/sobre', label: 'Metodologia & Pilares' },
    { href: '/fabricante', label: 'Área do Fabricante', icon: Building2 },
    { href: '/contato', label: 'Fale Conosco' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
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
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #082115 0%, #174e35 100%)',
              color: 'var(--gold-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(8, 33, 21, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
              border: '1.5px solid rgba(212, 175, 55, 0.4)',
            }}
          >
            <PawPrint size={22} aria-hidden="true" fill="currentColor" strokeWidth={1.5} />
          </div>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                letterSpacing: '-0.5px',
                display: 'block',
                lineHeight: 1.05,
              }}
            >
              Pet<span style={{ color: 'var(--gold-700)' }}>Rankings</span>
            </span>
            <span
              style={{
                fontSize: '0.66rem',
                color: 'var(--text-muted)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Avaliação Nutricional de Pet Food
            </span>
          </div>
        </Link>

        {/* Busca Ampla Desobstruída com Espaço Generoso */}
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

        {/* Lado Direito: Menu de Navegação */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              color: 'var(--brand-forest-900)',
              backgroundColor: 'var(--bg-cream-subtle)',
              border: '1.5px solid var(--border-cream)',
              transition: 'var(--transition-fast)',
              cursor: 'pointer',
            }}
          >
            {mobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
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
                      fontWeight: active ? 800 : 600,
                      color: active ? 'var(--brand-forest-900)' : 'var(--text-main)',
                      backgroundColor: active ? 'var(--bg-cream-subtle)' : '#ffffff',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      border: active ? '1px solid var(--border-cream)' : '1px solid #f1ece1',
                      borderLeft: active ? '4px solid var(--gold-600)' : '4px solid transparent',
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
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: 'var(--gold-800)',
                          backgroundColor: 'var(--gold-100)',
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
                backgroundColor: 'var(--bg-cream-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-cream)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <ShieldCheck size={22} color="var(--gold-700)" aria-hidden="true" />
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
