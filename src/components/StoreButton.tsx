'use client';

import React from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { sendGAEvent } from '@next/third-parties/google';
import { getStoreInfo, StoreKey } from '@/lib/utils';

interface StoreButtonProps {
  storeKey: string;
  productUrl: string;
  affiliateUrl?: string | null;
  rating?: number | null;
  productTitle?: string;
}

export default function StoreButton({
  storeKey,
  productUrl,
  affiliateUrl,
  rating,
  productTitle,
}: StoreButtonProps) {
  const storeInfo = getStoreInfo(storeKey) || {
    key: storeKey as StoreKey,
    name: storeKey,
    domain: '',
    themeColor: '#123826',
    accentColor: '#061810',
    bgLight: '#ffffff',
  };

  const targetUrl = affiliateUrl && affiliateUrl.trim().length > 0 ? affiliateUrl : productUrl;

  const handleClick = () => {
    try {
      sendGAEvent({
        event: 'affiliate_click',
        store_name: storeInfo.name,
        store_key: storeKey,
        product_title: productTitle || '',
        destination_url: targetUrl,
      });
    } catch {
      // Ignora silenciosamente se o dataLayer não estiver inicializado
    }
  };

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="store-btn"
      onClick={handleClick}
      aria-label={`Ver produto na loja ${storeInfo.name}${rating ? ` - Nota de avaliação: ${rating.toFixed(1)} estrelas` : ''}`}
    >
      {/* Detalhes da Loja e Nota */}
      <div className="store-btn-details">
        <span className="store-btn-name">{storeInfo.name}</span>
        {rating !== null && rating !== undefined ? (
          <span className="store-btn-rating">
            <Star size={11} fill="var(--gold-500)" color="var(--gold-600)" aria-hidden="true" />
            <strong className="store-btn-rating-val">{rating.toFixed(1)}</strong>
            <span className="store-btn-rating-max">/ 5.0</span>
          </span>
        ) : (
          <span className="store-btn-rating store-btn-unrated">
            Sem nota
          </span>
        )}
      </div>

      {/* Botão de Ação */}
      <div className="store-btn-cta">
        <span>Acessar</span>
        <ExternalLink size={12} className="store-btn-cta-icon" aria-hidden="true" />
      </div>
    </a>
  );
}
