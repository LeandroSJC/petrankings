import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PawPrint, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
    lifeStages: ['CRESCIMENTO_INICIAL', 'CRESCIMENTO_FINAL'],
    description:
      'Avaliação de conformidade para rações secas destinadas ao desenvolvimento e crescimento de filhotes de cães, com foco em densidade proteica e equilíbrio Cálcio-Fósforo.',
  },
  'gatos-adultos': {
    title: 'Guia Nutricional: Gatos Adultos — Alimentos Secos',
    species: 'GATO',
    lifeStages: ['ADULTO', 'SENIOR'],
    description:
      'Avaliação técnica de alimentos secos para felinos adultos e castrados. Verificação estrita de requisitos de proteína animal e moderação mineral.',
  },
  'gatos-filhotes': {
    title: 'Guia Nutricional: Gatos Filhotes — Alimentos Secos',
    species: 'GATO',
    lifeStages: ['CRESCIMENTO_INICIAL', 'CRESCIMENTO_FINAL'],
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
    <main style={{ paddingBottom: '60px' }}>
      <div className="container" style={{ paddingTop: '32px' }}>
        {/* Navegação Breadcrumb */}
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

        {/* Cabeçalho da Categoria */}
        <header
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-cream)',
            padding: '36px',
            marginBottom: '32px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--brand-forest-50)',
              border: '1px solid var(--brand-forest-200)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: 'var(--brand-forest-800)',
              marginBottom: '14px',
            }}
          >
            <PawPrint size={14} fill="currentColor" strokeWidth={1.5} />
            <span>Segmentação Estrita Oficial</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 3.5vw, 2.4rem)',
              fontWeight: 900,
              color: 'var(--brand-forest-900)',
              lineHeight: 1.2,
              marginBottom: '12px',
            }}
          >
            {config.title}
          </h1>

          <p style={{ fontSize: '1rem', color: 'var(--text-body)', lineHeight: 1.6, maxWidth: '800px' }}>
            {config.description}
          </p>
        </header>

        {/* Listagem dos Produtos da Categoria */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {products.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product as any}
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
      </div>
    </main>
  );
}
