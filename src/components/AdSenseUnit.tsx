'use client';

import React, { useEffect } from 'react';

export interface AdSenseUnitProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  minHeight?: string;
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}

/**
 * Componente padrão para blocos de anúncios do Google AdSense.
 * Projetado pelo adsense-monetization-architect para prevenção estrita de CLS (Cumulative Layout Shift)
 * e conformidade com as políticas do Google Publisher (rotulagem e distanciamento seguro).
 */
export default function AdSenseUnit({
  slotId,
  format = 'auto',
  responsive = true,
  minHeight = '90px',
  className = '',
  label = 'Publicidade',
  style = {},
}: AdSenseUnitProps) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && clientId && slotId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {
      // Ignora silenciosamente bloqueadores de anúncios (adblockers)
    }
  }, [clientId, slotId]);

  // Modo de Desenvolvimento ou quando Client ID / Slot ID não estão ativos
  if (!clientId || !slotId) {
    return (
      <aside
        className={`ad-container ad-slot-reserved ${className}`}
        aria-label="Espaço Publicitário"
        style={{
          minHeight,
          backgroundColor: '#faf8f5',
          border: '1px dashed #e2dcd0',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px',
          margin: '24px 0',
          textAlign: 'center',
          ...style,
        }}
      >
        <span
          style={{
            fontSize: '0.70rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: 'var(--text-subtle)',
          }}
        >
          {label}
        </span>
      </aside>
    );
  }

  return (
    <aside
      className={`ad-container ${className}`}
      aria-label="Espaço Publicitário"
      style={{
        minHeight,
        margin: '24px 0',
        textAlign: 'center',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          fontSize: '0.66rem',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          color: 'var(--text-subtle)',
          marginBottom: '6px',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </aside>
  );
}
