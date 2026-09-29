import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Stethoscope, AlertTriangle, ArrowLeft, ShieldAlert, ChevronRight } from 'lucide-react';
import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';

export const metadata: Metadata = {
  title: 'Catálogo de Alimentos Coadjuvantes — PetRankings',
  description:
    'Catálogo exclusivo de rações e alimentos com indicação veterinária específica (Renal, Urinário, Obesidade, Hepático). Sem nota comparativa de ranking geral.',
  alternates: {
    canonical: '/coadjuvantes',
  },
};

export default async function CoadjuvantesPage() {
  const rawProducts = await prisma.product.findMany({
    where: {
      isPublished: true,
      legalCategory: 'ALIMENTO_COADJUVANTE',
    },
    include: {
      affiliateLinks: {
        select: {
          store: true,
          productUrl: true,
          affiliateUrl: true,
        },
      },
    },
    orderBy: [
      { coadjuvanteCondition: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  const products = rawProducts.map((p) => ({
    ...p,
    labelCollectionDate: p.labelCollectionDate.toISOString(),
  }));

  return (
    <div style={{ backgroundColor: 'var(--bg-subtle)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Barra Superior de Breadcrumbs */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-cream)',
          padding: '14px 0',
        }}
      >
        <div className="container">
          <nav aria-label="Navegação estrutural" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
            <Link href="/" style={{ color: 'var(--text-body)', textDecoration: 'none' }}>
              Início
            </Link>
            <ChevronRight size={14} color="var(--text-subtle)" aria-hidden="true" />
            <span style={{ color: 'var(--brand-forest-700)', fontWeight: 700 }}>
              Alimentos Coadjuvantes
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Institucional Padronizado */}
      <section
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-cream)',
          padding: '36px 0 32px 0',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '840px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--brand-forest-50)',
                border: '1px solid var(--brand-forest-200)',
                color: 'var(--brand-forest-700)',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '14px',
              }}
            >
              <Stethoscope size={14} aria-hidden="true" />
              <span>Prescrição Clínica & Suporte Dietoterápico</span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.4rem)',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                letterSpacing: '-0.025em',
                lineHeight: 1.18,
                marginBottom: '12px',
              }}
            >
              Catálogo de Alimentos Coadjuvantes
            </h1>

            <p style={{ fontSize: '1.02rem', color: 'var(--text-body)', lineHeight: 1.65, margin: 0 }}>
              Produtos formulados com fins nutricionais clínicos específicos para animais com alterações fisiológicas ou metabólicas (doença renal, urinária, gastrointestinal, obesidade ou diabetes). Por possuírem formulação terapêutica exclusiva, estes alimentos não concorrem em rankings comparativos de manutenção regular.
            </p>
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingTop: '32px' }}>

        {/* Alerta Veterinário Mandatório */}
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: 'var(--radius-md)',
            padding: '20px 24px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            color: '#92400e',
            fontSize: '0.88rem',
            lineHeight: 1.55,
          }}
        >
          <ShieldAlert size={26} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.98rem', marginBottom: '4px', color: '#b45309' }}>
              Aviso Veterinário Obrigatório (Termo de Governança)
            </strong>
            Alimentos coadjuvantes só devem ser utilizados sob orientação e prescrição estrita de um Médico Veterinário. As especificações presentes nesta página visam unicamente a transparência cadastral dos níveis de garantia e matérias-primas aprovadas no MAPA, não constituindo recomendação médica ou indicação terapêutica.
          </div>
        </div>

        {/* Listagem */}
        <section aria-labelledby="coadjuvantes-list-heading">
          <h2 id="coadjuvantes-list-heading" className="sr-only">
            Alimentos Coadjuvantes Catalogados
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {products.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product as any}
                priority={idx === 0}
              />
            ))}

            {products.length === 0 && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '60px 20px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border-cream)',
                }}
              >
                Nenhum alimento coadjuvante cadastrado no momento.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
