import React from 'react';
import type { Metadata } from 'next';
import FabricanteClient from './FabricanteClient';

export const metadata: Metadata = {
  title: 'Portal do Fabricante — Solicitação de Atualização Oficial | PetRankings',
  description:
    'Canal direto e transparente para fabricantes e responsáveis técnicos solicitarem atualização de páginas oficiais, novos lotes ou retificação de dados nutricionais.',
  alternates: {
    canonical: '/fabricante',
  },
  openGraph: {
    title: 'Portal do Fabricante — PetRankings',
    description:
      'Canal oficial para fabricantes e responsáveis técnicos solicitarem atualização de páginas oficiais e dados nutricionais.',
    url: '/fabricante',
    siteName: 'PetRankings',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function FabricantePage() {
  return <FabricanteClient />;
}
