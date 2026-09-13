import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import ProductForm from '@/components/admin/ProductForm';

export default async function NovoProdutoPage() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'curador')) {
    redirect('/admin/login');
  }

  return <ProductForm />;
}
