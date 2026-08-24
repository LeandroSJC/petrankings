'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();

        if (!res.ok || !data.product) {
          setError(data.error || 'Produto não encontrado.');
          return;
        }

        setProduct(data.product);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar os dados do produto.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div style={{ padding: '64px 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px' }}>
          <RefreshCw
            size={36}
            color="var(--brand-forest-700)"
            style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}
          />
          <h2 style={{ fontSize: '1.2rem', color: 'var(--brand-forest-950)' }}>
            Carregando dados do produto...
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Aguarde um instante enquanto recuperamos os detalhes editoriais e avaliações.
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ padding: '64px 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px', backgroundColor: '#ffffff', padding: '36px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-cream)' }}>
          <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: '1.3rem', color: 'var(--brand-forest-950)', marginBottom: '8px' }}>
            Não foi possível carregar o produto
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            {error || 'O produto solicitado não foi localizado no catálogo central.'}
          </p>
          <Link
            href="/admin/produtos"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--brand-forest-800)',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            <span>Voltar ao Catálogo</span>
          </Link>
        </div>
      </div>
    );
  }

  return <ProductForm mode="edit" initialData={product} productId={productId} />;
}
