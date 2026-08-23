'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, Archive, CheckCircle2, Clock, RefreshCw, Send, Trash2, X, Inbox, Download } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/utils';

interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  status: 'nova' | 'lida' | 'arquivada';
  createdAt: Date | string;
}

export default function AdminMessagesPage() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [counts, setCounts] = useState({ total: 0, nova: 0, lida: 0, arquivada: 0 });
  const [selectedStatus, setSelectedStatus] = useState<string>('todas');
  const [loading, setLoading] = useState(true);

  // Mensagem aberta no visualizador
  const [viewingMessage, setViewingMessage] = useState<ContactMessageItem | null>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const url = selectedStatus === 'todas' ? '/api/contact' : `/api/contact?status=${selectedStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        setCounts(data.counts || { total: 0, nova: 0, lida: 0, arquivada: 0 });
      }
    } catch {
      showToast('Erro ao carregar mensagens', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedStatus]);

  // Ao abrir mensagem, marcar automaticamente como lida se era nova (Seção 7.6)
  const openMessage = async (msg: ContactMessageItem) => {
    setViewingMessage(msg);

    if (msg.status === 'nova') {
      try {
        await fetch('/api/contact', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: msg.id, status: 'lida' }),
        });

        // Atualizar estado local
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'lida' } : m))
        );
        setCounts((prev) => ({
          ...prev,
          nova: Math.max(0, prev.nova - 1),
          lida: prev.lida + 1,
        }));
      } catch {
        // Silencioso
      }
    }
  };

  // Alterar status manualmente
  const updateStatus = async (id: string, status: 'nova' | 'lida' | 'arquivada') => {
    try {
      const res = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) {
        showToast('Erro ao alterar status', 'error');
        return;
      }

      showToast(`Mensagem marcada como ${status}!`, 'success');
      if (viewingMessage && viewingMessage.id === id) {
        setViewingMessage({ ...viewingMessage, status });
      }
      fetchMessages();
    } catch {
      showToast('Erro de conexão', 'error');
    }
  };

  // Exportação de Mensagens para CSV
  const exportMessagesToCsv = () => {
    if (messages.length === 0) {
      showToast('Nenhuma mensagem para exportar', 'info');
      return;
    }
    const headers = ['ID', 'Nome', 'E-mail', 'Assunto', 'Mensagem', 'Status', 'Data de Envio'];
    const rows = messages.map((m) => [
      m.id,
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${(m.email || '').replace(/"/g, '""')}"`,
      `"${(m.subject || '').replace(/"/g, '""')}"`,
      `"${(m.message || '').replace(/"/g, '""')}"`,
      m.status,
      new Date(m.createdAt).toLocaleDateString('pt-BR') + ' ' + new Date(m.createdAt).toLocaleTimeString('pt-BR'),
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `petrankings-mensagens-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha CSV de mensagens exportada com sucesso!', 'success');
  };

  return (
    <div style={{ padding: '32px 0 64px 0' }}>
      <div className="container">
        {/* Cabeçalho */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>
              Caixa de Entrada de Contato
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Mensagens, dúvidas e sugestões enviadas através do formulário público com antispam.
            </p>
          </div>

          <button
            onClick={exportMessagesToCsv}
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
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
            title="Exportar mensagens recebidas em formato CSV"
          >
            <Download size={16} color="var(--brand-forest-700)" />
            <span>Exportar CSV</span>
          </button>
        </div>

        {/* Abas de Status */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '24px',
            borderBottom: '1px solid var(--border-cream)',
            paddingBottom: '12px',
          }}
        >
          <button
            onClick={() => setSelectedStatus('todas')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: selectedStatus === 'todas' ? 700 : 500,
              backgroundColor: selectedStatus === 'todas' ? 'var(--brand-forest-800)' : '#ffffff',
              color: selectedStatus === 'todas' ? '#ffffff' : 'var(--text-main)',
              border: '1px solid var(--border-cream)',
            }}
          >
            <Inbox size={15} />
            <span>Todas ({counts.total})</span>
          </button>

          <button
            onClick={() => setSelectedStatus('nova')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: selectedStatus === 'nova' ? 700 : 500,
              backgroundColor: selectedStatus === 'nova' ? '#15803d' : '#f0fdf4',
              color: selectedStatus === 'nova' ? '#ffffff' : '#15803d',
              border: selectedStatus === 'nova' ? '1px solid #15803d' : '1px solid #bbf7d0',
            }}
          >
            <Mail size={15} />
            <span>Não Lidas ({counts.nova})</span>
          </button>

          <button
            onClick={() => setSelectedStatus('lida')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: selectedStatus === 'lida' ? 700 : 500,
              backgroundColor: selectedStatus === 'lida' ? 'var(--brand-forest-800)' : '#ffffff',
              color: selectedStatus === 'lida' ? '#ffffff' : 'var(--text-main)',
              border: '1px solid var(--border-cream)',
            }}
          >
            <CheckCircle2 size={15} />
            <span>Lidas ({counts.lida})</span>
          </button>

          <button
            onClick={() => setSelectedStatus('arquivada')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: selectedStatus === 'arquivada' ? 700 : 500,
              backgroundColor: selectedStatus === 'arquivada' ? '#64748b' : '#ffffff',
              color: selectedStatus === 'arquivada' ? '#ffffff' : 'var(--text-main)',
              border: '1px solid var(--border-cream)',
            }}
          >
            <Archive size={15} />
            <span>Arquivadas ({counts.arquivada})</span>
          </button>
        </div>

        {/* Lista de Mensagens */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px', gap: '10px', color: 'var(--text-muted)' }}>
            <RefreshCw size={20} className="animate-spin" />
            <span>Carregando mensagens...</span>
          </div>
        ) : messages.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => openMessage(msg)}
                style={{
                  backgroundColor: msg.status === 'nova' ? '#f0fdf4' : '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  border: msg.status === 'nova' ? '1px solid #86efac' : '1px solid var(--border-cream)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'var(--transition)',
                }}
                className="message-row"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--brand-forest-900)' }}>
                      {msg.name}
                    </strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      &lt;{msg.email}&gt;
                    </span>

                    {msg.status === 'nova' && (
                      <span
                        style={{
                          backgroundColor: '#15803d',
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Nova
                      </span>
                    )}

                    {msg.status === 'arquivada' && (
                      <span
                        style={{
                          backgroundColor: '#e2e8f0',
                          color: '#475569',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        Arquivada
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.9rem', fontWeight: msg.status === 'nova' ? 700 : 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {msg.subject || '(Sem assunto)'}
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {msg.message}
                  </p>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>
                  {formatDate(msg.createdAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-cream)' }}>
            <MessageSquare size={36} color="var(--brand-forest-700)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Nenhuma mensagem encontrada</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Não há mensagens nesta categoria.
            </p>
          </div>
        )}

        {/* MODAL DE LEITURA E RESPOSTA DA MENSAGEM (Seção 7.6) */}
        {viewingMessage && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(6, 24, 16, 0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setViewingMessage(null)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-cream)',
                padding: '32px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header do Visualizador */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-cream-light)', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>
                    {viewingMessage.subject || '(Sem assunto)'}
                  </h2>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    De: <strong>{viewingMessage.name}</strong> &lt;{viewingMessage.email}&gt;
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                    Recebida em: {formatDate(viewingMessage.createdAt)}
                  </div>
                </div>

                <button
                  onClick={() => setViewingMessage(null)}
                  style={{ padding: '6px', color: 'var(--text-muted)' }}
                  aria-label="Fechar mensagem"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Corpo da Mensagem */}
              <div
                style={{
                  backgroundColor: 'var(--bg-cream-subtle)',
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-cream)',
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {viewingMessage.message}
              </div>

              {/* Ações: Alterar Status e Responder por E-mail */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {viewingMessage.status !== 'nova' && (
                    <button
                      onClick={() => updateStatus(viewingMessage.id, 'nova')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: '#f0fdf4',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      Marcar como Nova
                    </button>
                  )}

                  {viewingMessage.status !== 'arquivada' ? (
                    <button
                      onClick={() => updateStatus(viewingMessage.id, 'arquivada')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      Arquivar
                    </button>
                  ) : (
                    <button
                      onClick={() => updateStatus(viewingMessage.id, 'lida')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      Desarquivar (Mover para Lidas)
                    </button>
                  )}
                </div>

                {/* Responder pelo cliente de e-mail (Seção 7.6) */}
                <a
                  href={`mailto:${viewingMessage.email}?subject=Re: ${encodeURIComponent(viewingMessage.subject || 'Contato PetRankings')}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--brand-forest-800)',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Send size={15} />
                  <span>Responder por E-mail</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.message-row:hover) {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  );
}
