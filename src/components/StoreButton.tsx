import React from 'react';
import Image from 'next/image';
import { ExternalLink, Star } from 'lucide-react';
import { getStoreInfo, StoreKey } from '@/lib/utils';

interface StoreButtonProps {
  storeKey: string;
  productUrl: string;
  affiliateUrl?: string | null;
  rating?: number | null;
}

export default function StoreButton({
  storeKey,
  productUrl,
  affiliateUrl,
  rating,
}: StoreButtonProps) {
  const storeInfo = getStoreInfo(storeKey) || {
    key: storeKey as StoreKey,
    name: storeKey,
    domain: '',
    themeColor: '#123826',
    accentColor: '#061810',
    bgLight: '#ffffff',
    logo: '/stores/amazon.svg',
  };

  const targetUrl = affiliateUrl && affiliateUrl.trim().length > 0 ? affiliateUrl : productUrl;

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="store-btn"
      aria-label={`Ver produto na loja ${storeInfo.name}${rating ? ` - Nota de avaliação: ${rating.toFixed(1)} estrelas` : ''}`}
    >
      {/* Logotipo da Loja */}
      <div className="store-btn-logo">
        <Image
          src={storeInfo.logo}
          alt={`Logo ${storeInfo.name}`}
          width={30}
          height={30}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>

      {/* Detalhes da Loja e Nota */}
      <div className="store-btn-details">
        <span className="store-btn-name">{storeInfo.name}</span>
        {rating !== null && rating !== undefined ? (
          <span className="store-btn-rating">
            <span style={{ fontWeight: 700, color: 'var(--brand-forest-900)' }}>
              {rating.toFixed(1)}
            </span>
            <Star size={11} fill="var(--gold-500)" color="var(--gold-600)" />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>/ 5</span>
          </span>
        ) : (
          <span className="store-btn-rating" style={{ fontStyle: 'italic', fontSize: '0.72rem' }}>
            Sem nota
          </span>
        )}
      </div>

      {/* Botão de Ação */}
      <div className="store-btn-cta">
        <span>Visitar</span>
        <ExternalLink size={11} />
      </div>
    </a>
  );
}
