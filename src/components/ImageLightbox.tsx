'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({ src, alt, isOpen, onClose }: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Focar no botão de fechar com pequeno delay para garantir montagem
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Travar scroll do body
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Visualização ampliada de ${alt}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(4, 20, 12, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        cursor: 'zoom-out',
        animation: 'lightboxFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        touchAction: 'none',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1.5px solid var(--border-cream)',
          padding: '24px',
          maxWidth: '92vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.2)',
          cursor: 'default',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de Fechar Acessível (WCAG 2.5.5 Touch Target 44x44px) */}
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Fechar visualização ampliada"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-cream-subtle)',
            color: 'var(--brand-forest-900)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-fast)',
            zIndex: 10,
            border: '1.5px solid var(--border-cream)',
            cursor: 'pointer',
          }}
          className="lightbox-close-btn"
        >
          <X size={22} aria-hidden="true" />
        </button>

        {/* Imagem Ampliada */}
        <div
          style={{
            position: 'relative',
            maxWidth: '100%',
            maxHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              borderRadius: 'var(--radius-sm)',
              userSelect: 'none',
              pointerEvents: 'auto',
            }}
          />
        </div>

        <p
          style={{
            marginTop: '16px',
            fontSize: '0.96rem',
            fontWeight: 700,
            color: 'var(--brand-forest-900)',
            textAlign: 'center',
            maxWidth: '480px',
            lineHeight: 1.4,
          }}
        >
          {alt}
        </p>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
