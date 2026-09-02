'use client';

import React, { useEffect, useRef } from 'react';
import { AdSlotConfig } from '@/lib/ads';

export interface AdSlotRendererProps {
  slot?: AdSlotConfig | null;
  slotKey?: string;
  minHeight?: string;
  className?: string;
  style?: React.CSSProperties;
  showLabel?: boolean;
}

/**
 * Renderizador de Bloco de Publicidade / Google AdSense Dinâmico.
 * Injeta o código integralmente conforme colado no painel administrativo e
 * executa de forma segura e fiel os scripts embutidos do AdSense.
 * 
 * Se o slot estiver inativo ou sem código cadastrado, retorna null sem poluir a interface.
 */
export default function AdSlotRenderer({
  slot,
  minHeight = '90px',
  className = '',
  style = {},
  showLabel = true,
}: AdSlotRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const isActive = slot?.isActive && Boolean(slot.code?.trim());
  const code = slot?.code || '';

  useEffect(() => {
    if (!isActive || !containerRef.current || !code) return;

    const container = containerRef.current;
    container.innerHTML = '';

    try {
      // Cria um document fragment para interpretar o HTML e recriar os scripts
      const range = document.createRange();
      range.selectNode(container);
      const documentFragment = range.createContextualFragment(code);

      // Encontra scripts para garantir execução pelo motor do navegador
      const scripts = Array.from(documentFragment.querySelectorAll('script'));
      
      container.appendChild(documentFragment);

      // Re-executa scripts de forma assíncrona para que o AdSense funcione perfeitamente
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });

      // Tenta acionar adsbygoogle se houver tag ins sem inicialização
      if (typeof window !== 'undefined' && container.querySelector('.adsbygoogle')) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch {
          // Bloqueadores de anúncio (AdBlock) tratados de forma silenciosa
        }
      }
    } catch (err) {
      console.error('Erro ao renderizar bloco de anúncio AdSense:', err);
    }
  }, [isActive, code]);

  if (!isActive) {
    return null;
  }

  return (
    <aside
      className={`ad-container dynamic-ad-slot ${className}`}
      aria-label="Espaço Publicitário"
      style={{
        margin: '24px auto',
        maxWidth: '100%',
        minHeight,
        textAlign: 'center',
        overflow: 'hidden',
        ...style,
      }}
    >
      {showLabel && (
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
          Publicidade
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          minHeight,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      />
    </aside>
  );
}
