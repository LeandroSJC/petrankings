'use client';

import React from 'react';
import { Share2 } from 'lucide-react';
import { useToast } from './Toast';

interface ShareButtonProps {
  productTitle: string;
  averageRating: number | null;
  rankingTitle?: string;
  rankingUrl?: string;
}

export default function ShareButton({
  productTitle,
  averageRating,
  rankingTitle,
  rankingUrl,
}: ShareButtonProps) {
  const { showToast } = useToast();

  const handleShare = async () => {
    const currentUrl = rankingUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const ratingText = averageRating ? `${averageRating.toFixed(2)} ★` : 'Em avaliação';
    const textToShare = `Olha que dica boa para o seu pet: ${productTitle} com nota média ${ratingText} no PetRankings! Veja o comparativo completo: ${currentUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${productTitle} - PetRankings`,
          text: textToShare,
          url: currentUrl,
        });
        showToast('Dica compartilhada com sucesso! 🐾', 'success');
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback: copiar para área de transferência
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToShare);
        showToast('Link copiado! Agora é só colar e compartilhar essa dica! 🐾', 'success');
      } else {
        const input = document.createElement('textarea');
        input.value = textToShare;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('Link copiado! Compartilhe com quem também ama pets! 🐾', 'success');
      }
    } catch {
      showToast('Não conseguimos copiar o link automaticamente. Tente novamente!', 'error');
    }
  };

  return (
    <button
      onClick={handleShare}
      className="share-btn"
      aria-label={`Compartilhar dica sobre ${productTitle}`}
      title="Compartilhar essa dica"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.86rem',
        fontWeight: 700,
        color: 'var(--brand-forest-900)',
        backgroundColor: '#ffffff',
        padding: '8px 16px',
        borderRadius: 'var(--radius-full)',
        border: '1.5px solid var(--border-cream)',
        boxShadow: 'var(--shadow-xs)',
        transition: 'var(--transition-fast)',
        minHeight: '38px',
      }}
    >
      <Share2 size={15} color="var(--brand-forest-700)" aria-hidden="true" />
      <span>Compartilhar dica</span>
    </button>
  );
}
