'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  MessageSquare,
  Loader2,
  Filter,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

interface TicketItem {
  id: string;
  ticketNumber: string;
  companyName: string;
  cnpj?: string | null;
  mapaRegistration?: string | null;
  requesterName: string;
  requesterRole: string;
  requesterEmail: string;
  requesterPhone?: string | null;
  requestType: string;
  message: string;
  documentUrl?: string | null;
  batchNumber?: string | null;
  status: string;
  slaDeadline: string;
  internalNotes?: string | null;
  createdAt: string;
  product?: {
    id: string;
    commercialName: string;
    slug: string;
  } | null;
}

export default function AdminChamadosPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chamados');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
      showToast('Erro ao carregar chamados.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenDetails = (t: TicketItem) => {
    setSelectedTicket(t);
    setNewStatus(t.status);
    setNotes(t.internalNotes || '');
  };

  const handleUpdate = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/chamados/${selectedTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, internalNotes: notes }),
      });

      if (res.ok) {
        showToast('Chamado atualizado com sucesso!', 'success');
        setTickets(
          tickets.map((t) =>
            t.id === selectedTicket.id ? { ...t, status: newStatus, internalNotes: notes } : t
          )
        );
        setSelectedTicket(null);
      } else {
        showToast('Erro ao atualizar chamado.', 'error');
      }
    } catch {
      showToast('Falha na comunicação ao atualizar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'todos' && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ padding: '32px 0 64px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-700)', fontWeight: 700, fontSize: '0.85rem' }}>
            <Building2 size={16} />
            <span>Módulo Institucional • Solicitações do Fabricante</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', color: 'var(--brand-forest-900)', marginTop: '4px' }}>
            Fila de Chamados dos Fabricantes
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Gestão das solicitações de retificação de lotes e atendimento com SLA prioritário de 5 dias úteis.
          </p>
        </div>

        {/* Filtros */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-cream)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Filtrar Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-xs)',
              border: '1.5px solid var(--border-cream)',
              fontSize: '0.85rem',
              backgroundColor: '#ffffff',
            }}
          >
            <option value="todos">Todos os Chamados</option>
            <option value="ABERTO">Em Aberto</option>
            <option value="EM_ANALISE">Em Análise Técnica</option>
            <option value="DEFERIDO">Deferido / Atualizado</option>
            <option value="INDEFERIDO">Indeferido</option>
          </select>
        </div>

        {/* Tabela de Chamados */}
        <div className="table-nutri-wrapper">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <span>Carregando chamados institucionais...</span>
            </div>
          ) : (
            <table className="table-nutri">
              <thead>
                <tr>
                  <th>Protocolo & Data</th>
                  <th>Empresa & Solicitante</th>
                  <th>Tipo de Pedido</th>
                  <th>Prazo SLA (5 dias)</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => {
                  const deadline = new Date(t.slaDeadline);
                  const isLate = deadline.getTime() < Date.now() && t.status === 'ABERTO';

                  return (
                    <tr key={t.id}>
                      <td>
                        <strong style={{ color: 'var(--brand-forest-900)', display: 'block' }}>
                          {t.ticketNumber}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </td>

                      <td>
                        <strong style={{ color: 'var(--text-main)', display: 'block' }}>
                          {t.companyName}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {t.requesterName} ({t.requesterRole})
                        </span>
                      </td>

                      <td style={{ fontSize: '0.82rem' }}>
                        <div>{t.requestType}</div>
                        {t.batchNumber && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Lote: {t.batchNumber}
                          </span>
                        )}
                      </td>

                      <td style={{ fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isLate ? '#ef4444' : 'var(--text-body)', fontWeight: isLate ? 800 : 500 }}>
                          <Clock size={13} />
                          <span>{deadline.toLocaleDateString('pt-BR')}</span>
                        </div>
                        {isLate && (
                          <span style={{ fontSize: '0.70rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase' }}>
                            Atrasado
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            backgroundColor:
                              t.status === 'ABERTO'
                                ? '#fffbeb'
                                : t.status === 'DEFERIDO'
                                ? '#ecfdf5'
                                : '#f1f5f9',
                            color:
                              t.status === 'ABERTO'
                                ? '#b45309'
                                : t.status === 'DEFERIDO'
                                ? '#065f46'
                                : '#475569',
                          }}
                        >
                          {t.status}
                        </span>
                      </td>

                      <td>
                        <button
                          onClick={() => handleOpenDetails(t)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--brand-forest-900)',
                            color: '#ffffff',
                            fontSize: '0.80rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Analisar
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Nenhum chamado encontrado com o filtro selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal de Deliberação e Detalhes */}
        {selectedTicket && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-md)',
                padding: '32px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800 }}>
                  Protocolo: {selectedTicket.ticketNumber}
                </h3>
                <button
                  onClick={() => setSelectedTicket(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>
                <div>
                  <strong>Fabricante:</strong> {selectedTicket.companyName}
                </div>
                <div>
                  <strong>CNPJ:</strong> {selectedTicket.cnpj}
                </div>
                <div>
                  <strong>Solicitante:</strong> {selectedTicket.requesterName}
                </div>
                <div>
                  <strong>Cargo / ART:</strong> {selectedTicket.requesterRole}
                </div>
                <div>
                  <strong>E-mail:</strong> {selectedTicket.requesterEmail}
                </div>
                <div>
                  <strong>Telefone:</strong> {selectedTicket.requesterPhone || 'Não informado'}
                </div>
              </div>

              {selectedTicket.documentUrl && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>Documento Anexo / Link:</strong>{' '}
                  <a
                    href={selectedTicket.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--brand-forest-700)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    Abrir Evidência Documental <ExternalLink size={13} />
                  </a>
                </div>
              )}

              <div style={{ marginBottom: '16px', backgroundColor: 'var(--bg-cream-main)', padding: '12px', borderRadius: '4px', fontSize: '0.85rem' }}>
                <strong>Mensagem do Solicitante:</strong>
                <p style={{ marginTop: '4px', lineHeight: 1.5 }}>{selectedTicket.message}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    Alterar Status do Chamado:
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1.5px solid var(--border-cream)' }}
                  >
                    <option value="ABERTO">Aberto (Aguardando Análise)</option>
                    <option value="EM_ANALISE">Em Análise Técnica</option>
                    <option value="DEFERIDO">Deferido (Lote/Dados Atualizados no Catálogo)</option>
                    <option value="INDEFERIDO">Indeferido (Documentação Insuficiente)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    Parecer Interno da Curadoria:
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Registre a deliberação técnica interna..."
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1.5px solid var(--border-cream)', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--border-cream)', background: '#ffffff', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleUpdate}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--brand-forest-900)',
                      color: '#ffffff',
                      fontWeight: 700,
                      border: 'none',
                      cursor: saving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {saving ? 'Salvando...' : 'Salvar Deliberação'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
