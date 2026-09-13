import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Building2,
  MessageSquare,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  PawPrint,
  AlertTriangle,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== 'admin' && session.role !== 'curador')) {
    redirect('/admin/login');
  }

  // Estatísticas do Sistema de Análise Nutricional
  const [
    totalProducts,
    superPremiumCount,
    premiumEspecialCount,
    economicoCount,
    naoConformeCount,
    coadjuvantesCount,
    openTicketsCount,
    unreadMessagesCount,
    recentProducts,
    urgentTickets,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { classificationTier: { in: ['NIVEL_OURO', 'SUPER_PREMIUM'] } } }),
    prisma.product.count({ where: { classificationTier: { in: ['NIVEL_PRATA', 'PREMIUM_ESPECIAL'] } } }),
    prisma.product.count({ where: { classificationTier: { in: ['NIVEL_BRONZE', 'ECONOMICO'] } } }),
    prisma.product.count({ where: { classificationTier: { in: ['SOB_OBSERVACAO', 'PARAMETRO_LIMITROFE', 'NAO_CONFORME'] } } }),
    prisma.product.count({ where: { legalCategory: 'ALIMENTO_COADJUVANTE' } }),
    prisma.manufacturerTicket.count({ where: { status: 'ABERTO' } }),
    prisma.contactMessage.count({ where: { status: 'nova' } }),
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        slug: true,
        commercialName: true,
        brand: true,
        species: true,
        analyzedBatch: true,
        scoreTotal: true,
        classificationTier: true,
        legalCategory: true,
        updatedAt: true,
      },
    }),
    prisma.manufacturerTicket.findMany({
      where: { status: 'ABERTO' },
      orderBy: { slaDeadline: 'asc' },
      take: 4,
      select: {
        id: true,
        ticketNumber: true,
        companyName: true,
        requestType: true,
        slaDeadline: true,
        createdAt: true,
      },
    }),
  ]);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-forest-700)', fontWeight: 700, fontSize: '0.85rem' }}>
              <PawPrint size={16} fill="currentColor" strokeWidth={1.5} />
              <span>Painel de Curadoria e Governança Regulatória</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--brand-forest-900)', marginTop: '4px' }}>
              Visão Geral de Análise de Rótulos
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.90rem' }}>
              Sessão ativa: <strong>{session.name || session.email}</strong> ({session.role})
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/admin/produtos/novo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--brand-forest-900)',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Plus size={16} />
              <span>Analisar Novo Produto</span>
            </Link>

            <Link
              href="/admin/chamados"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--gold-50)',
                border: '1.5px solid var(--gold-500)',
                color: 'var(--gold-800)',
                fontSize: '0.88rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Building2 size={16} />
              <span>Chamados Fabricantes ({openTicketsCount})</span>
            </Link>
          </div>
        </div>

        {/* Métricas Principais */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border-cream)', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Produtos no Catálogo
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, color: 'var(--brand-forest-900)', marginTop: '4px' }}>
              {totalProducts}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#065f46', marginTop: '4px' }}>
              {superPremiumCount} Nível Ouro • {premiumEspecialCount} Nível Prata
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border-cream)', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Nível Bronze / Sob Observação
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, color: '#92400e', marginTop: '4px' }}>
              {economicoCount + naoConformeCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#991b1b', marginTop: '4px' }}>
              {economicoCount} Bronze • {naoConformeCount} Sob Observação (&lt;60 pts)
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border-cream)', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Alimentos Coadjuvantes
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, color: '#4338ca', marginTop: '4px' }}>
              {coadjuvantesCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6366f1', marginTop: '4px' }}>
              Prescrição clínica isolada
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border-cream)', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Chamados Right of Reply
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, color: openTicketsCount > 0 ? '#b45309' : 'var(--brand-forest-900)', marginTop: '4px' }}>
              {openTicketsCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              SLA de 5 dias úteis
            </div>
          </div>
        </div>

        {/* Grid de Conteúdo Recente */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Tabela de Produtos Auditados Recentemente */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-forest-900)' }}>
                Análises Mais Recentes
              </h2>
              <Link href="/admin/produtos" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-forest-700)', textDecoration: 'none' }}>
                Ver Todos →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentProducts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--bg-cream-main)',
                    border: '1px solid var(--border-cream-light)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.commercialName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {p.brand} • {p.species === 'CAO' ? 'Cão' : 'Gato'} • Ficha Técnica Oficial
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '12px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.80rem',
                        fontWeight: 800,
                        backgroundColor: p.scoreTotal !== null && p.scoreTotal >= 75 ? '#ecfdf5' : '#fffbeb',
                        color: p.scoreTotal !== null && p.scoreTotal >= 75 ? '#065f46' : '#92400e',
                      }}
                    >
                      {p.scoreTotal !== null ? `${p.scoreTotal} pts` : 'Clínico'}
                    </span>
                    <Link
                      href={`/admin/produtos/${p.id}/editar`}
                      style={{ fontSize: '0.78rem', color: 'var(--brand-forest-700)', fontWeight: 700, textDecoration: 'none' }}
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Chamados Pendentes de Fabricantes (Right of Reply) */}
          <section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-cream)',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-forest-900)' }}>
                Fila de Chamados dos Fabricantes
              </h2>
              <Link href="/admin/chamados" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold-700)', textDecoration: 'none' }}>
                Gerenciar Fila →
              </Link>
            </div>

            {urgentTickets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {urgentTickets.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#92400e' }}>{t.ticketNumber}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        Prazo SLA: {new Date(t.slaDeadline).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                      {t.companyName} ({t.requestType})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nenhum chamado aberto de fabricante no momento. SLA 100% em dia!
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
