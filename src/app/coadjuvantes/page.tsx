import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Stethoscope, AlertTriangle, ArrowLeft, ShieldAlert } from 'lucide-react';
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
    <main style={{ paddingBottom: '60px' }}>
      <div className="container" style={{ paddingTop: '32px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: 'var(--brand-forest-700)',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            <span>Voltar ao Índice Geral</span>
          </Link>
        </div>

        {/* Cabeçalho do Catálogo */}
        <header
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-cream)',
            padding: '36px',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#eef2ff',
              border: '1px solid #c7d2fe',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#3730a3',
              marginBottom: '14px',
            }}
          >
            <Stethoscope size={16} />
            <span>Prescrição Clínica & Suporte Dietoterápico</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.85rem, 3.8vw, 2.5rem)',
              fontWeight: 900,
              color: 'var(--brand-forest-900)',
              lineHeight: 1.15,
              marginBottom: '12px',
            }}
          >
            Catálogo de Alimentos Coadjuvantes
          </h1>

          <p style={{ fontSize: '1rem', color: 'var(--text-body)', lineHeight: 1.6, maxWidth: '820px' }}>
            Produtos formulados com fins nutricionais clínicos específicos para animais com alterações fisiológicas ou metabólicas.
            Por possuírem formulação dietoterápica exclusiva, estes alimentos não concorrem em rankings comparativos de manutenção regular.
          </p>
        </header>

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
    </main>
  );
}
