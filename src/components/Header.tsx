'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Award, ShieldCheck } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Início & Rankings' },
    { href: '/sobre', label: 'Sobre & Como Funciona' },
    { href: '/contato', label: 'Fale com a Gente' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Fechar menu mobile ao pressionar a tecla Escape (WCAG 2.1.2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Bloquear scroll de fundo quando o menu mobile estiver aberto
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
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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
          height: '78px',
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
          }}
          aria-label="PetRankings - Página Inicial"
        >
          <div
            style={{
              width: '44px',
              height: '44px',
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
            <Award size={24} aria-hidden="true" />
          </div>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.55rem',
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
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Guia Amigo dos Pets
            </span>
          </div>
        </Link>

        {/* Navegação Desktop */}
        <nav
          aria-label="Navegação principal"
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '10px',
          }}
          className="desktop-nav"
        >
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                style={{
                  fontSize: '0.94rem',
                  fontWeight: active ? 700 : 600,
                  color: active ? 'var(--brand-forest-900)' : 'var(--text-body)',
                  backgroundColor: active ? 'var(--bg-cream-subtle)' : 'transparent',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-full)',
                  border: active ? '1.5px solid var(--border-cream)' : '1.5px solid transparent',
                  transition: 'var(--transition-fast)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                className="nav-link-hover"
              >
                {active && (
                  <span
                    aria-hidden="true"
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--gold-600)',
                    }}
                  />
                )}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Botão Menu Mobile (WCAG 2.5.5 Touch Target 44x44px) */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation-drawer"
          className="mobile-menu-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            color: 'var(--brand-forest-900)',
            backgroundColor: 'var(--bg-cream-subtle)',
            border: '1.5px solid var(--border-cream)',
            transition: 'var(--transition-fast)',
          }}
        >
          {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      {/* Gaveta Mobile Lateral com Backdrop Blur & ARIA Dialog */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação móvel"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(4, 20, 12, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 999,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: '320px',
              maxWidth: '85%',
              height: '100%',
              backgroundColor: '#ffffff',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              boxShadow: 'var(--shadow-xl)',
              animation: 'drawerSlide 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'var(--brand-forest-800)',
                    color: 'var(--gold-400)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Award size={20} aria-hidden="true" />
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: 'var(--brand-forest-900)',
                  }}
                >
                  PetRankings
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
                style={{
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-forest-900)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-cream-subtle)',
                  border: '1px solid var(--border-cream)',
                }}
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            <div style={{ borderBottom: '1px solid var(--border-cream-light)' }} />

            <nav
              aria-label="Links do menu móvel"
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      fontSize: '1.02rem',
                      fontWeight: active ? 800 : 600,
                      color: active ? 'var(--brand-forest-900)' : 'var(--text-main)',
                      backgroundColor: active ? 'var(--brand-forest-50)' : 'transparent',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: active ? '4px solid var(--gold-600)' : '4px solid transparent',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div
              style={{
                marginTop: 'auto',
                padding: '16px',
                backgroundColor: 'var(--bg-cream-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-cream)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <ShieldCheck size={24} color="var(--gold-700)" aria-hidden="true" />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-body)', lineHeight: 1.4 }}>
                Rankings 100% sinceros e transparentes, feitos para quem ama cuidar bem.
              </span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 768px) {
          :global(.desktop-nav) {
            display: flex !important;
          }
          :global(.mobile-menu-btn) {
            display: none !important;
          }
        }
        :global(.nav-link-hover:hover) {
          color: var(--brand-forest-900) !important;
          background-color: var(--bg-cream-subtle) !important;
        }
        @keyframes drawerSlide {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </header>
  );
}
