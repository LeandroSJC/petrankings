'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  ShoppingCart,
  Leaf,
  FlaskConical,
  CheckCircle2,
  Stethoscope,
  Camera,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import TransgenicIcon from '@/components/TransgenicIcon';
import { getFaixaVisual, formatarTermo } from '@/lib/formatters';

export interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    commercialName: string;
    brand: string;
    manufacturerLegalName?: string;
    legalCategory: string;
    species: string;
    lifeStage: string;
    breedSize: string;
    foodType: string;
    coadjuvanteCondition?: string | null;
    sourceUrl?: string;
    sourceArchiveUrl?: string | null;
    sourceDocumentUrl?: string | null;
    analyzedBatch?: string | null;
    labelCollectionDate: string | Date;
    frontLabelImageUrl?: string | null;
    backLabelImageUrl?: string | null;

    moistureMaxPct: number;
    crudeProteinMinPct: number;
    etherExtractMinPct: number;
    crudeFiberMaxPct: number;
    mineralMatterMaxPct: number;
    calciumMinPct: number;
    calciumMaxPct?: number | null;
    phosphorusMinPct: number;
    sodiumMinPct?: number | null;
    omega3MinPct?: number | null;

    meatClaimType: string;
    containsGmo: boolean;
    gmoIngredients?: string | null;
    antioxidantType: string;
    topIngredients: string; // JSON string or text
    editorialOpinion?: string | null;

    scoreTotal: number | null;
    classificationTier: string;
    scoreBreakdown?: any;

    affiliateLinks?: Array<{
      store: string;
      productUrl: string;
      affiliateUrl?: string | null;
    }>;
  };
  rankPosition?: number;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Parse dos ingredientes
  let parsedIngredients: string[] = [];
  try {
    parsedIngredients = Array.isArray(product.topIngredients)
      ? product.topIngredients
      : JSON.parse(product.topIngredients);
  } catch {
    parsedIngredients = product.topIngredients
      ? product.topIngredients.split(',').map((s) => s.trim())
      : [];
  }

  const isCoadjuvante = product.legalCategory === 'ALIMENTO_COADJUVANTE';
  const isComplementar = product.legalCategory === 'ALIMENTO_COMPLEMENTAR';
  const tier = getFaixaVisual(product.classificationTier, isCoadjuvante, isComplementar);

  // Normalização para base seca
  const fatorMS = (100 - (product.moistureMaxPct || 10)) / 100;
  const divisor = fatorMS > 0 ? fatorMS : 1;
  const pbMS = (product.crudeProteinMinPct / divisor).toFixed(1);
  const eeMS = (product.etherExtractMinPct / divisor).toFixed(1);
  const relacaoCaP = (product.calciumMinPct / (product.phosphorusMinPct || 0.01)).toFixed(2);

  const isWet = product.foodType === 'UMIDO';
  const hasAffiliates = product.affiliateLinks && product.affiliateLinks.length > 0;

  return (
    <article
      id={`produto-${product.slug}`}
      className="editorial-card"
    >
      <div className="editorial-card-main">
        {/* Coluna 1: Imagem com Badge Discreta de Formato */}
        <div className="editorial-card-thumb">
          <span
            className="editorial-card-format-tag"
            style={{
              backgroundColor: isWet ? '#e0f2fe' : 'rgba(255, 255, 255, 0.92)',
              color: isWet ? '#0369a1' : 'var(--brand-forest-900)',
              border: isWet ? '1px solid #bae6fd' : '1px solid var(--border-cream)',
            }}
          >
            {isWet ? '🥫 Sachê / Patê' : '🥣 Ração Seca'}
          </span>

          {product.frontLabelImageUrl ? (
            <Image
              src={product.frontLabelImageUrl}
              alt={`Embalagem de ${product.commercialName}`}
              fill
              sizes="(max-width: 900px) 100vw, 140px"
              style={{ objectFit: 'contain', padding: '10px' }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              <Camera size={24} style={{ margin: '0 auto 4px', display: 'block' }} />
              Ficha Coletada
            </div>
          )}
        </div>

        {/* Coluna 2: Informações Principais e Mini-Tabela Bromatológica */}
        <div className="editorial-card-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="editorial-card-brand">{product.brand}</span>
            <span style={{ color: 'var(--border-cream-dark)' }}>•</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {formatarTermo(product.species)} • {formatarTermo(product.lifeStage)}
              {product.breedSize && product.breedSize !== 'TODOS' && ` • ${formatarTermo(product.breedSize)}`}
            </span>
          </div>

          <h3 className="editorial-card-title">
            <Link href={`/produto/${product.slug}`}>
              {product.commercialName}
            </Link>
          </h3>

          {/* Mini-Grid de Métricas Bromatológicas Chave */}
          <div className="nutri-stat-grid">
            <div className="nutri-stat-item">
              <span className="nutri-stat-label">Proteína (MS)</span>
              <span className="nutri-stat-value">{pbMS}%</span>
            </div>
            <div className="nutri-stat-item">
              <span className="nutri-stat-label">Gordura (MS)</span>
              <span className="nutri-stat-value">{eeMS}%</span>
            </div>
            <div className="nutri-stat-item">
              <span className="nutri-stat-label">Balanço Ca:P</span>
              <span className="nutri-stat-value">{relacaoCaP}:1</span>
            </div>
          </div>

          {/* Linha Consolidada de Ingredientes & Selos */}
          <div className="editorial-card-ingredients">
            {parsedIngredients.length > 0 && (
              <span>
                <strong>1º Ingrediente:</strong> {parsedIngredients[0]}
              </span>
            )}
            <span style={{ color: 'var(--border-cream-dark)' }}>•</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: product.antioxidantType === 'NATURAL' ? '#065f46' : '#b45309',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              {product.antioxidantType === 'NATURAL' ? (
                <>
                  <Leaf size={13} color="#059669" />
                  <span>Conservantes Naturais</span>
                </>
              ) : (
                <>
                  <FlaskConical size={13} color="#d97706" />
                  <span>Conservantes Sintéticos (BHA/BHT)</span>
                </>
              )}
            </span>
            <span style={{ color: 'var(--border-cream-dark)' }}>•</span>
            {product.containsGmo ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#92400e',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                <TransgenicIcon size={14} />
                <span>Contém Transgênicos</span>
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#166534',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={13} color="#16a34a" />
                <span>Livre de Transgênicos</span>
              </span>
            )}
          </div>
        </div>

        {/* Coluna 3: Score Circular e Ações Claras */}
        <div className="editorial-card-actions">
          {!isCoadjuvante && !isComplementar && product.scoreTotal !== null ? (
            <div
              className="editorial-card-score-box"
              style={{
                backgroundColor: tier.bgColor,
                borderColor: tier.borderColor,
                color: tier.color,
              }}
            >
              <div className="editorial-card-score-circle">
                <span className="num">{product.scoreTotal}</span>
                <span className="unit">pts</span>
              </div>
              <div>
                <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', opacity: 0.85 }}>
                  Conformidade
                </span>
                <span className="editorial-card-tier-label">{tier.shortLabel}</span>
              </div>
            </div>
          ) : isComplementar ? (
            <div
              className="editorial-card-score-box"
              style={{
                backgroundColor: '#fdf4ff',
                borderColor: '#e879f9',
                color: '#701a75',
              }}
            >
              <Sparkles size={24} />
              <div>
                <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                  Categoria
                </span>
                <span className="editorial-card-tier-label">Complementar</span>
              </div>
            </div>
          ) : (
            <div
              className="editorial-card-score-box"
              style={{
                backgroundColor: '#eef2ff',
                borderColor: '#c7d2fe',
                color: '#3730a3',
              }}
            >
              <Stethoscope size={24} />
              <div>
                <span style={{ fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                  Finalidade
                </span>
                <span className="editorial-card-tier-label">Terapêutica</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <Link
              href={`/produto/${product.slug}`}
              className="editorial-btn-primary"
            >
              <span>Ver Análise Completa</span>
              <ArrowRight size={14} />
            </Link>

            {hasAffiliates && (
              <Link
                href={`/produto/${product.slug}#onde-comprar`}
                className="editorial-btn-secondary"
              >
                <ShoppingCart size={13} />
                <span>Onde Comprar</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
