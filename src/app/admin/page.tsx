import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Award, Package, MessageSquare, AlertTriangle, Plus, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/admin/login');
  }

  // 1. Estatísticas de Rankings
  const totalRankings = await prisma.ranking.count();
  const publishedRankings = await prisma.ranking.count({ where: { isPublished: true } });
  const draftRankings = totalRankings - publishedRankings;

  // 2. Estatísticas de Produtos
  const totalProducts = await prisma.product.count();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Produtos que precisam de revisão (>30 dias ou sem data)
  const productsNeedingReview = await prisma.product.findMany({
    where: {
      OR: [
        { ratingUpdatedAt: null },
        { ratingUpdatedAt: { lt: thirtyDaysAgo } },
      ],
    },
    include: {
      stores: true,
      rankings: { include: { ranking: true } },
    },
    orderBy: [
      { ratingUpdatedAt: 'asc' },
      { createdAt: 'desc' },
    ],
    take: 6,
  });

  const totalNeedsReviewCount = await prisma.product.count({
    where: {
      OR: [
        { ratingUpdatedAt: null },
        { ratingUpdatedAt: { lt: thirtyDaysAgo } },
      ],
    },
  });

  // 3. Mensagens
  const unreadMessagesCount = await prisma.contactMessage.count({
    where: { status: 'nova' },
  });

  return (
    <div style={{ padding: '32px 0 64px 0' }}>
      <div className="container">
        {/* Header do Painel */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>
              Painel de Controle Editorial
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Bem-vindo, <strong>{session.name || session.email}</strong>. Gerencie rankings, catálogo e lançamentos de avaliações.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/admin/produtos/novo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--brand-forest-800)',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.88rem',
                transition: 'var(--transition)',
              }}
            >
              <Plus size={16} />
              <span>Novo Produto</span>
            </Link>

            <Link
              href="/admin/rankings/novo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--gold-500)',
                color: '#453300',
                padding: '10px 18px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.88rem',
                transition: 'var(--transition)',
              }}
            >
              <Plus size={16} />
              <span>Novo Ranking</span>
            </Link>

            <Link
              href="/admin/produtos"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                color: 'var(--brand-forest-900)',
                padding: '10px 18px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: '0.88rem',
                border: '1px solid var(--border-cream)',
                transition: 'var(--transition)',
              }}
            >
              <Package size={16} />
              <span>Catálogo</span>
            </Link>

            <Link
              href="/admin/rankings"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                color: 'var(--brand-forest-900)',
                padding: '10px 18px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: '0.88rem',
                border: '1px solid var(--border-cream)',
                transition: 'var(--transition)',
              }}
            >
              <Award size={16} color="var(--gold-600)" />
              <span>Rankings</span>
            </Link>
          </div>
        </div>

        {/* Grade de Métricas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '36px',
          }}
        >
          {/* Card 1: Rankings */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-cream)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Rankings
              </span>
              <Award size={20} color="var(--gold-600)" />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--brand-forest-900)' }}>
              {totalRankings}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              <strong style={{ color: 'var(--brand-forest-700)' }}>{publishedRankings} publicados</strong> • {draftRankings} rascunhos
            </div>
          </div>

          {/* Card 2: Produtos */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-cream)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Catálogo Total
              </span>
              <Package size={20} color="var(--brand-forest-700)" />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--brand-forest-900)' }}>
              {totalProducts}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Produtos cadastrados no sistema
            </div>
          </div>

          {/* Card 3: Produtos precisando de revisão (>30 dias) */}
          <div
            style={{
              backgroundColor: totalNeedsReviewCount > 0 ? '#fffbeb' : '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: totalNeedsReviewCount > 0 ? '1px solid #fde68a' : '1px solid var(--border-cream)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: totalNeedsReviewCount > 0 ? '#b45309' : 'var(--text-muted)' }}>
                Revisão Pendente
              </span>
              <AlertTriangle size={20} color={totalNeedsReviewCount > 0 ? '#d97706' : 'var(--text-muted)'} />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: totalNeedsReviewCount > 0 ? '#b45309' : 'var(--brand-forest-900)' }}>
              {totalNeedsReviewCount}
            </div>
            <div style={{ fontSize: '0.82rem', color: totalNeedsReviewCount > 0 ? '#92400e' : 'var(--text-muted)', marginTop: '8px' }}>
              {totalNeedsReviewCount > 0 ? 'Itens sem revisão ou com >30 dias' : 'Todos os itens revisados recentemente'}
            </div>
          </div>

          {/* Card 4: Mensagens não lidas */}
          <div
            style={{
              backgroundColor: unreadMessagesCount > 0 ? '#f0fdf4' : '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: unreadMessagesCount > 0 ? '1px solid #bbf7d0' : '1px solid var(--border-cream)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: unreadMessagesCount > 0 ? '#15803d' : 'var(--text-muted)' }}>
                Caixa de Entrada
              </span>
              <MessageSquare size={20} color={unreadMessagesCount > 0 ? '#16a34a' : 'var(--text-muted)'} />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: unreadMessagesCount > 0 ? '#15803d' : 'var(--brand-forest-900)' }}>
              {unreadMessagesCount}
            </div>
            <div style={{ fontSize: '0.82rem', color: unreadMessagesCount > 0 ? '#166534' : 'var(--text-muted)', marginTop: '8px' }}>
              <Link href="/admin/mensagens" style={{ textDecoration: 'underline', fontWeight: 600 }}>
                {unreadMessagesCount} novas mensagens de contato
              </Link>
            </div>
          </div>
        </div>

        {/* Tabela de Produtos que Precisam de Revisão Urgente (Seção 7.2) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-cream)',
            padding: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>
                Itens Prioritários para Revisão de Avaliações
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Produtos com dados mais antigos ou ainda sem lançamento manual de notas.
              </p>
            </div>

            <Link
              href="/admin/produtos?sort=unreviewed"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--brand-forest-800)',
              }}
            >
              <span>Ver catálogo completo</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {productsNeedingReview.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {productsNeedingReview.map((prod) => (
                <div
                  key={prod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    padding: '14px 18px',
                    backgroundColor: 'var(--bg-cream-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-cream)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '550px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className={`tag-pill ${prod.species === 'caes' ? 'tag-caes' : 'tag-gatos'}`}>
                        {prod.species === 'caes' ? '🐕 Cães' : '🐈 Gatos'}
                      </span>
                      <span className="tag-pill tag-type">
                        {prod.productType}
                      </span>
                    </div>
                    <strong style={{ fontSize: '0.98rem', color: 'var(--brand-forest-900)' }}>
                      {prod.title}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                      {prod.rankings.length} ranking(s) vinculado(s) • {prod.stores.length} loja(s) configurada(s)
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-subtle)', display: 'block' }}>Última revisão:</span>
                      <span style={{ fontWeight: 700, color: prod.ratingUpdatedAt ? 'var(--text-main)' : '#b45309' }}>
                        {formatDate(prod.ratingUpdatedAt)}
                      </span>
                    </div>

                    <Link
                      href={`/admin/produtos?editReview=${prod.id}`}
                      style={{
                        backgroundColor: 'var(--brand-forest-800)',
                        color: '#ffffff',
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Lançar Avaliações
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              <CheckCircle2 size={32} color="var(--brand-forest-600)" style={{ margin: '0 auto 12px auto' }} />
              <p>Parabéns! Todos os produtos do catálogo foram revisados nos últimos 30 dias.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
