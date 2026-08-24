'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Award, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import RankingForm, { RankingFormData } from '@/components/admin/RankingForm';

export default function EditRankingPage() {
  const params = useParams();
  const rankingId = params?.id as string;

  const [ranking, setRanking] = useState<RankingFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!rankingId) return;

    const fetchRanking = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/rankings/${rankingId}`);
        const data = await res.json();

        if (!res.ok || !data.ranking) {
          setError(data.error || 'Ranking não encontrado.');
          return;
        }

        setRanking(data.ranking);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar os dados do ranking.');
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [rankingId]);

  if (loading) {
    return (
      <div style={{ padding: '64px 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px' }}>
          <RefreshCw
            size={36}
            color="var(--gold-600)"
            style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}
          />
          <h2 style={{ fontSize: '1.2rem', color: 'var(--brand-forest-950)' }}>
            Carregando ranking e produtos vinculados...
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Aguarde um instante enquanto estruturamos os dados editoriais.
          </p>
        </div>
      </div>
    );
  }

  if (error || !ranking) {
    return (
      <div style={{ padding: '64px 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px', backgroundColor: '#ffffff', padding: '36px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-cream)' }}>
          <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: '1.3rem', color: 'var(--brand-forest-950)', marginBottom: '8px' }}>
            Não foi possível carregar o ranking
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            {error || 'O ranking solicitado não foi localizado no sistema.'}
          </p>
          <Link
            href="/admin/rankings"
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
            <span>Voltar aos Rankings</span>
          </Link>
        </div>
      </div>
    );
  }

  return <RankingForm mode="edit" initialData={ranking} rankingId={rankingId} />;
}
