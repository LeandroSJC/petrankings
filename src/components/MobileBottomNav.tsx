'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PawPrint, Scale, Calculator, Menu, X } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Oculta no painel administrativo
  const isAdmin = pathname?.startsWith('/admin');

  useEffect(() => {
    const handleMenuState = (e: Event) => {
      const customEvent = e as CustomEvent<{ open?: boolean }>;
      if (typeof customEvent.detail?.open === 'boolean') {
        setMenuOpen(customEvent.detail.open);
      }
    };

    window.addEventListener('mobile-menu-state', handleMenuState);
    return () => window.removeEventListener('mobile-menu-state', handleMenuState);
  }, []);

  if (isAdmin) {
    return null;
  }

  const toggleMenu = () => {
    window.dispatchEvent(new CustomEvent('toggle-mobile-menu'));
  };

  const navItems = [
    {
      href: '/',
      label: 'Início',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      href: '/catalogo',
      label: 'Catálogo',
      icon: PawPrint,
      isActive: pathname?.startsWith('/catalogo') || pathname?.startsWith('/produto'),
    },
    {
      href: '/comparar',
      label: 'Comparar',
      icon: Scale,
      isActive: pathname?.startsWith('/comparar'),
    },
    {
      href: '/calculadora',
      label: 'Calculadora',
      icon: Calculator,
      isActive: pathname?.startsWith('/calculadora'),
    },
  ];

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Navegação móvel ergonômica"
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(58px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-cream)',
        boxShadow: '0 -4px 20px rgba(15, 23, 42, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 1000,
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.isActive && !menuOpen;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '3px',
              color: active ? 'var(--brand-forest-700)' : 'var(--text-muted)',
              textDecoration: 'none',
              transition: 'var(--transition-fast)',
              position: 'relative',
              touchAction: 'manipulation',
            }}
          >
            {active && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '32px',
                  height: '3px',
                  backgroundColor: 'var(--brand-forest-600)',
                  borderRadius: '0 0 3px 3px',
                }}
              />
            )}
            <Icon size={20} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: active ? 800 : 600,
                lineHeight: 1,
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* Botão de Menu (Gaveta Institucional e Guias) */}
      <button
        type="button"
        onClick={toggleMenu}
        aria-label={menuOpen ? 'Fechar menu de opções' : 'Abrir menu de opções'}
        aria-expanded={menuOpen}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: '3px',
          color: menuOpen ? 'var(--brand-forest-700)' : 'var(--text-muted)',
          transition: 'var(--transition-fast)',
          position: 'relative',
          touchAction: 'manipulation',
        }}
      >
        {menuOpen && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              width: '32px',
              height: '3px',
              backgroundColor: 'var(--brand-forest-600)',
              borderRadius: '0 0 3px 3px',
            }}
          />
        )}
        {menuOpen ? (
          <X size={20} strokeWidth={2.4} aria-hidden="true" />
        ) : (
          <Menu size={20} strokeWidth={1.8} aria-hidden="true" />
        )}
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: menuOpen ? 800 : 600,
            lineHeight: 1,
          }}
        >
          {menuOpen ? 'Fechar' : 'Mais'}
        </span>
      </button>
    </nav>
  );
}

