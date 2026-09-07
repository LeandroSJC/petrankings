import React from 'react';
import Link from 'next/link';
import { Compass, Home, Search, HelpCircle } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Página Não Encontrada | PetRankings',
  description: 'A página solicitada não foi encontrada no PetRankings.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '65vh',
        padding: '60px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          border: '1.5px solid var(--border-cream)',
          borderRadius: 'var(--radius-xl)',
          padding: '48px 32px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--brand-forest-50)',
            color: 'var(--brand-forest-800)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            border: '2px solid var(--brand-forest-200)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <HelpCircle size={42} strokeWidth={2.2} />
        </div>

        <span
          style={{
            display: 'inline-block',
            fontSize: '0.85rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--gold-700)',
            backgroundColor: 'var(--gold-100)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            marginBottom: '16px',
            border: '1px solid var(--gold-300)',
          }}
        >
          Erro 404 — Não Encontrado
        </span>

        <h1
          style={{
            fontSize: '2rem',
            lineHeight: 1.25,
            marginBottom: '12px',
            color: 'var(--brand-forest-900)',
          }}
        >
          Ops! Essa página não está aqui
        </h1>

        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '1rem',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}
        >
          O link que você seguiu pode ter sido alterado, removido ou digitado incorretamente.
          Que tal voltar para a página inicial e encontrar as melhores recomendações para o seu pet?
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          <Link
            href="/"
            className="hero-primary-btn"
            style={{
              padding: '12px 24px',
              fontSize: '0.92rem',
              minHeight: '46px',
            }}
          >
            <Home size={18} />
            <span>Página Inicial</span>
          </Link>

          <Link
            href="/#rankings-destaque"
            className="hero-secondary-btn"
            style={{
              padding: '12px 24px',
              fontSize: '0.92rem',
              minHeight: '46px',
            }}
          >
            <Compass size={18} />
            <span>Ver Melhores Rankings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
