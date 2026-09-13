import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ProductForm from '@/components/admin/ProductForm';

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'curador')) {
    redirect('/admin/login');
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { affiliateLinks: true },
  });

  if (!product) {
    notFound();
  }

  return <ProductForm initialProduct={product} isEdit={true} />;
}
