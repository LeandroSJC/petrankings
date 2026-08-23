'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, ShoppingBag, ZoomIn, Crown, Clock } from 'lucide-react';
import StoreButton from './StoreButton';
import ShareButton from './ShareButton';
import ImageLightbox from './ImageLightbox';
import { formatDate, getRankBadgeClass } from '@/lib/utils';

export interface ProductCardProps {
  rank: number;
  product: {
    id: string;
    title: string;
    brand?: string | null;
    species: string;
    productType: string;
    description?: string | null;
    imageUrl?: string | null;
    averageRating: number | null;
    ratingUpdatedAt?: Date | string | null;
    stores: Array<{
      id: string;
      store: string;
      productUrl: string;
      affiliateUrl?: string | null;
      rating?: number | null;
    }>;
  };
  rankingTitle?: string;
}

export default function ProductCard({ rank, product, rankingTitle }: ProductCardProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const fallbackImage =
    product.species === 'caes'
      ? 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80';

  const imageSrc = product.imageUrl || fallbackImage;
  const rankClass = getRankBadgeClass(rank);

  return (
    <article
      className={`product-card ${rank === 1 ? 'card-gold' : ''}`}
      aria-label={`Posição ${rank}: ${product.title}`}
    >
      {/* Faixa de Destaque para o 1º Lugar */}
      {rank === 1 && (
        <div
          style={{
            position: 'absolute',
            top: '-13px',
            left: '28px',
            backgroundColor: 'var(--brand-forest-950)',
            color: 'var(--gold-300)',
            padding: '5px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.76rem',
            fontWeight: 800,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(4, 20, 12, 0.35)',
            border: '1.5px solid var(--gold-400)',
            zIndex: 2,
          }}
        >
          <Crown size={14} color="var(--gold-400)" aria-hidden="true" />
          <span>🏆 O Mais Amado pelos Tutores #1</span>
        </div>
      )}

      {/* 1. GRID SUPERIOR: Imagem na Esquerda | Informações na Direita */}
      <div
        className="product-top-grid"
        style={{
          display: 'grid',
          gap: '24px',
          paddingTop: rank === 1 ? '8px' : '0',
          alignItems: 'start',
        }}
      >
        {/* Coluna Esquerda: Imagem com Badge de Posição Sobreposta */}
        <div
          style={{
            position: 'relative',
            width: '100%',
          }}
        >
          {/* Medalha de Posição Sobreposta no Canto Superior Esquerdo */}
          <div
            className={`rank-badge ${rankClass}`}
            title={`Classificação: #${rank}`}
            aria-label={`Posição número ${rank} no ranking`}
            style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              zIndex: 3,
            }}
          >
            {rank}
          </div>

          {/* Container da Imagem com Efeito Hover e Lightbox */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
              minHeight: '170px',
              maxHeight: '220px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--border-cream)',
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'var(--transition)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setIsLightboxOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsLightboxOpen(true);
              }
            }}
            aria-label={`Ampliar foto do produto: ${product.title}`}
            className="product-img-box"
          >
            {/* Skeleton de Carregamento Progressivo */}
            {!imageLoaded && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'var(--bg-cream-subtle)',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
            )}

            <Image
              src={imageSrc}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, 220px"
              style={{
                objectFit: 'contain',
                padding: '12px',
                transition: 'transform 0.3s ease, opacity 0.3s ease',
                opacity: imageLoaded ? 1 : 0,
              }}
              onLoad={() => setImageLoaded(true)}
              className="product-img-hover"
            />

            {/* Ícone de Dica de Ampliação */}
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(4px)',
                borderRadius: '6px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--brand-forest-900)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                fontSize: '0.72rem',
                fontWeight: 800,
                border: '1px solid var(--border-cream-light)',
              }}
            >
              <ZoomIn size={13} aria-hidden="true" />
              <span>Ampliar</span>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Nome, Marca, Tags e Descrição */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            gap: '10px',
            paddingTop: '2px',
          }}
        >
          {product.brand && (
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: 'var(--brand-forest-700)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                display: 'block',
              }}
            >
              {product.brand}
            </span>
          )}

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.25rem, 2.4vw, 1.45rem)',
              fontWeight: 700,
              color: 'var(--brand-forest-900)',
              lineHeight: 1.3,
            }}
          >
            {product.title}
          </h2>

          {/* Tags de Espécie e Categoria */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
            <span className={`tag-pill ${product.species === 'caes' ? 'tag-caes' : 'tag-gatos'}`}>
              {product.species === 'caes' ? '🐕 Cães' : '🐈 Gatos'}
            </span>
            <span className="tag-pill tag-type">
              {product.productType}
            </span>
          </div>

          {product.description && (
            <p
              style={{
                fontSize: '0.98rem',
                color: 'var(--text-body)',
                lineHeight: 1.68,
                marginTop: '6px',
              }}
            >
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* 2. ABAIXO DO GRID: Bloco de Nota dos Tutores e Compartilhamento */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 20px',
          backgroundColor: 'var(--bg-cream-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--border-cream)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-body)' }}>
            Nota dos tutores:
          </span>
          {product.averageRating !== null ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1.5px solid var(--gold-500)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-900)',
                  lineHeight: 1,
                }}
              >
                {product.averageRating.toFixed(2)}
              </span>
              <Star size={18} fill="var(--gold-500)" color="var(--gold-600)" aria-hidden="true" />
            </div>
          ) : (
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Ainda sendo avaliado
            </span>
          )}
        </div>

        <ShareButton
          productTitle={product.title}
          averageRating={product.averageRating}
          rankingTitle={rankingTitle}
        />
      </div>

      {/* 3. Orientação de Lojas com Ícone de Carrinho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.82rem',
          fontWeight: 800,
          color: 'var(--brand-forest-900)',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          marginTop: '2px',
        }}
      >
        <ShoppingBag size={16} color="var(--gold-700)" aria-hidden="true" />
        <span>Onde encontrar com o melhor preço e entrega:</span>
      </div>

      {/* 4. Grade de Botões de Lojas */}
      <div className="store-grid">
        {product.stores && product.stores.length > 0 ? (
          product.stores.map((store) => (
            <StoreButton
              key={store.id}
              storeKey={store.store}
              productUrl={store.productUrl}
              affiliateUrl={store.affiliateUrl}
              rating={store.rating}
            />
          ))
        ) : (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Nenhuma loja cadastrada para este produto no momento.
          </p>
        )}
      </div>

      {/* 5. Última Atualização no Rodapé do Card */}
      <div
        style={{
          borderTop: '1px solid var(--border-cream-light)',
          paddingTop: '16px',
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} color="var(--brand-forest-700)" aria-hidden="true" />
          <span>Última conferência de notas:</span>
        </div>
        <strong style={{ color: 'var(--brand-forest-900)' }}>
          {formatDate(product.ratingUpdatedAt)}
        </strong>
      </div>

      {/* Lightbox Modal */}
      <ImageLightbox
        src={imageSrc}
        alt={product.title}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />

      <style jsx>{`
        :global(.product-top-grid) {
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 600px) {
          :global(.product-top-grid) {
            grid-template-columns: 180px 1fr !important;
            gap: 28px !important;
            align-items: start;
          }
        }
        @media (min-width: 900px) {
          :global(.product-top-grid) {
            grid-template-columns: 200px 1fr !important;
          }
        }
        :global(.product-img-box:hover) {
          border-color: var(--gold-500) !important;
          box-shadow: var(--shadow-md) !important;
        }
        :global(.product-img-hover):hover {
          transform: scale(1.08);
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </article>
  );
}
