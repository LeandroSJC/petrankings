import React from 'react';
import RankingForm from '@/components/admin/RankingForm';

export const metadata = {
  title: 'Novo Ranking Editorial | Painel PetRankings',
};

export default function NewRankingPage() {
  return <RankingForm mode="create" />;
}
