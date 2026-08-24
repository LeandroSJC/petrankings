import React from 'react';
import ProductForm from '@/components/admin/ProductForm';

export const metadata = {
  title: 'Novo Produto | Painel PetRankings',
};

export default function NewProductPage() {
  return <ProductForm mode="create" />;
}
