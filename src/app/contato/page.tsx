import React from 'react';
import type { Metadata } from 'next';
import ContatoClient from './ContatoClient';
import { SITE_URL } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Fale Conosco & Contato Editorial | PetRankings',
  description: 'Entre em contato com a equipe editorial do PetRankings. Envie dúvidas, sugestões de novos rankings, correções ou propostas de parceria.',
  alternates: {
    canonical: `${SITE_URL}/contato`,
  },
  openGraph: {
    title: 'Fale Conosco & Contato Editorial | PetRankings',
    description: 'Entre em contato com a equipe editorial do PetRankings.',
    url: `${SITE_URL}/contato`,
    siteName: 'PetRankings',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function ContatoPage() {
  return <ContatoClient />;
}
