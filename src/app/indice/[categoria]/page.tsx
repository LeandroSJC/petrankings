import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PawPrint, ArrowLeft, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';

interface CategoriaConfig {
  title: string;
  species: 'CAO' | 'GATO';
  lifeStages: string[];
  description: string;
}

const CATEGORIAS_CONFIG: Record<string, CategoriaConfig> = {
  'caes-adultos': {
    title: 'Guia Nutricional: Cães Adultos — Alimentos Secos',
    species: 'CAO',
    lifeStages: ['ADULTO', 'SENIOR'],
    description:
      'Classificação técnica e determinística de alimentos secos para cães adultos baseada na avaliação nutricional em Matéria Seca e parâmetros do Manual ABINPET (11ª Edição).',
  },
  'caes-filhotes': {
    title: 'Guia Nutricional: Cães Filhotes — Alimentos Secos',
    species: 'CAO',
    lifeStages: ['CRESCIMENTO_INICIAL', 'CRESCIMENTO_FINAL', 'FILHOTE'],
    description:
      'Avaliação de conformidade para rações secas destinadas ao desenvolvimento e crescimento de filhotes de cães, com foco em densidade proteica e equilíbrio Cálcio-Fósforo.',
  },
  'gatos-adultos': {
    title: 'Guia Nutricional: Gatos Adultos — Alimentos Secos',
    species: 'GATO',
    lifeStages: ['ADULTO', 'SENIOR', 'ADULTO_MANUTENCAO'],
    description:
      'Avaliação técnica de alimentos secos para felinos adultos e castrados. Verificação estrita de requisitos de proteína animal e moderação mineral.',
  },
  'gatos-filhotes': {
    title: 'Guia Nutricional: Gatos Filhotes — Alimentos Secos',
    species: 'GATO',
    lifeStages: ['CRESCIMENTO_INICIAL', 'CRESCIMENTO_FINAL', 'FILHOTE'],
    description:
      'Avaliação documental e nutricional de rações para filhotes de gatos conforme exigências nutricionais estritas para crescimento saudável na Matéria Seca.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string }>;
}): Promise<Metadata> {
  const { categoria } = await params;
  const config = CATEGORIAS_CONFIG[categoria];

  if (!config) {
    return { title: 'Categoria Não Encontrada — PetRankings' };
  }

  return {
    title: `${config.title} — PetRankings`,
    description: config.description,
    alternates: {
      canonical: `/indice/${categoria}`,
    },
  };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria } = await params;
  const config = CATEGORIAS_CONFIG[categoria];

  if (!config) {
    notFound();
  }

  const rawProducts = await prisma.product.findMany({
    where: {
      isPublished: true,
      legalCategory: 'ALIMENTO_COMPLETO',
      species: config.species,
      lifeStage: { in: config.lifeStages },
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
      { scoreTotal: 'desc' },
      { commercialName: 'asc' },
    ],
  });

  const products = rawProducts.map((p) => ({
    ...p,
    labelCollectionDate: p.labelCollectionDate.toISOString(),
  }));

  return (
    <div style={{ backgroundColor: 'var(--bg-subtle)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Barra Superior de Breadcrumbs Compacta */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-cream)',
          padding: '10px 0',
        }}
      >
        <div className="container">
          <nav aria-label="Navegação estrutural" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
            <Link href="/" style={{ color: 'var(--text-body)', textDecoration: 'none' }}>
              Início
            </Link>
            <ChevronRight size={13} color="var(--text-subtle)" aria-hidden="true" />
            <Link href="/catalogo" style={{ color: 'var(--text-body)', textDecoration: 'none' }}>
              Catálogo
            </Link>
            <ChevronRight size={13} color="var(--text-subtle)" aria-hidden="true" />
            <span style={{ color: 'var(--brand-forest-700)', fontWeight: 700 }}>
              {config.title.replace('Guia Nutricional: ', '')}
            </span>
          </nav>
        </div>
      </div>

      {/* Hero Utilitário Compacto */}
      <section
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-cream)',
          padding: '20px 0 16px 0',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '860px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--brand-forest-50)',
                border: '1px solid var(--brand-forest-200)',
                color: 'var(--brand-forest-700)',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              <PawPrint size={13} aria-hidden="true" />
              <span>Segmentação Estrita Oficial</span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.45rem, 2.8vw, 1.85rem)',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: '6px',
              }}
            >
              {config.title}
            </h1>

            <p style={{ fontSize: '0.90rem', color: 'var(--text-body)', lineHeight: 1.5, margin: 0 }}>
              {config.description}
            </p>
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingTop: '20px' }}>

        {/* Listagem dos Produtos da Categoria */}
        <section aria-labelledby="categoria-list-heading">
          <h2 id="categoria-list-heading" className="sr-only">
            Alimentos Catalogados nesta Categoria
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
              Nenhum produto cadastrado nesta categoria no momento.
            </div>
          )}
        </div>
        </section>
      </div>
    </div>
  );
}
