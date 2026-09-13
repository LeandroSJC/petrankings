'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function FabricantePage() {
  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    mapaRegistration: '',
    requesterName: '',
    requesterRole: '',
    requesterEmail: '',
    requesterPhone: '',
    requestType: 'ATUALIZACAO_URL',
    batchNumber: '',
    documentUrl: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; ticket?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/fabricante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar solicitação.');
      }

      setStatusMessage({
        type: 'success',
        text: 'Sua solicitação de atualização foi protocolada com sucesso. Nossa equipe técnica efetuará a conferência dos dados na página oficial informada e responderá no e-mail corporativo informado no prazo de até 5 (cinco) dias úteis.',
        ticket: data.ticketNumber,
      });

      setFormData({
        companyName: '',
        cnpj: '',
        mapaRegistration: '',
        requesterName: '',
        requesterRole: '',
        requesterEmail: '',
        requesterPhone: '',
        requestType: 'ATUALIZACAO_URL',
        batchNumber: '',
        documentUrl: '',
        message: '',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Ocorreu um erro ao enviar a solicitação. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ paddingBottom: '70px' }}>
      <div className="container" style={{ paddingTop: '36px', maxWidth: '840px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: 'var(--brand-forest-700)',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            <span>Voltar ao Índice Geral</span>
          </Link>
        </div>

        {/* Cabeçalho */}
        <header
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-cream)',
            padding: '36px',
            marginBottom: '32px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
              fontWeight: 900,
              color: 'var(--brand-forest-900)',
              lineHeight: 1.2,
              marginBottom: '14px',
            }}
          >
            Fabricante: Solicite Atualização de Dados Oficiais
          </h1>

          <p style={{ fontSize: '0.98rem', color: 'var(--text-body)', lineHeight: 1.65 }}>
            Para resguardar a boa-fé e manter a mais alta fidelidade técnica aos dados públicos, este canal direto
            permite que indústrias e marcas comuniquem novos links de páginas oficiais de produtos, atualização de composições declaradas ou solicitem inclusão de novos itens no portal.
          </p>
        </header>

        {/* Painel de Exigências Regulatórias & SLA */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid #cbd5e1',
            padding: '24px 28px',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FileCheck2 size={22} color="var(--brand-forest-700)" />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-forest-900)' }}>
              Requisitos para Análise Técnica (SLA de até 5 Dias Úteis)
            </h2>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#334155' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--brand-forest-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Identificação Corporativa:</strong> Nome da marca/empresa solicitante, nome do responsável e e-mail corporativo institucional.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--brand-forest-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Página Oficial do Produto:</strong> URL pública da página do produto no website oficial da marca contendo os níveis de garantia e ingredientes atualizados.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--brand-forest-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span><strong>Detalhamento da Alteração:</strong> Descrição das reformulações nutricionais declaradas, inclusão de novo produto ou esclarecimentos adicionais.</span>
            </li>
          </ul>
        </div>

        {/* Mensagens de Retorno */}
        {statusMessage && (
          <div
            style={{
              padding: '20px 24px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '28px',
              backgroundColor: statusMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1.5px solid ${statusMessage.type === 'success' ? '#34d399' : '#f87171'}`,
              color: statusMessage.type === 'success' ? '#065f46' : '#991b1b',
              fontSize: '0.92rem',
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <strong style={{ fontSize: '1rem' }}>
                {statusMessage.type === 'success' ? 'Protocolo Gerado com Sucesso!' : 'Atenção'}
              </strong>
            </div>
            <p style={{ margin: '4px 0 0 0' }}>{statusMessage.text}</p>
            {statusMessage.ticket && (
              <div style={{ marginTop: '14px', padding: '12px 18px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1.5px solid #34d399', display: 'inline-block', boxShadow: 'var(--shadow-xs)' }}>
                <span style={{ fontSize: '0.80rem', color: '#065f46', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                  Protocolo Oficial de Atendimento:
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 900, color: 'var(--brand-forest-900)' }}>
                  {statusMessage.ticket}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-cream)',
            padding: '32px',
            boxShadow: 'var(--shadow-xs)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                Nome da Marca / Fabricante *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Ex: PremieR Pet, Farmina, Royal Canin..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1.5px solid var(--border-cream)',
                  fontSize: '0.90rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                URL Oficial da Página do Produto no Site da Marca *
              </label>
              <input
                type="url"
                required
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="https://marca.com.br/produtos/..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1.5px solid var(--border-cream)',
                  fontSize: '0.90rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                Tipo de Solicitação *
              </label>
              <select
                value={formData.requestType}
                onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1.5px solid var(--border-cream)',
                  fontSize: '0.90rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="ATUALIZACAO_URL">Atualização de URL / Nova Página Oficial do Produto</option>
                <option value="REFORMULACAO">Reformulação de Fórmula / Novos Níveis de Garantia</option>
                <option value="CORRECAO_COMPOSICAO">Correção de Ingredientes ou Composição Declarada</option>
                <option value="CADASTRO_PRODUTO">Solicitação de Cadastro de Novo Produto da Marca</option>
                <option value="OUTRO">Outras Solicitações Institucionais</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                CNPJ da Empresa (Opcional)
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0001-00 (Opcional)"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1.5px solid var(--border-cream)',
                  fontSize: '0.90rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                Nome do Responsável / Solicitante *
              </label>
              <input
                type="text"
                required
                value={formData.requesterName}
                onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                placeholder="Nome Completo"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1.5px solid var(--border-cream)',
                  fontSize: '0.90rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                Cargo / Área na Empresa *
              </label>
              <input
                type="text"
                required
                value={formData.requesterRole}
                onChange={(e) => setFormData({ ...formData, requesterRole: e.target.value })}
                placeholder="Ex: Assuntos Regulatórios, P&D, Marketing, SAC, RT"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1.5px solid var(--border-cream)',
                  fontSize: '0.90rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                E-mail Corporativo do Fabricante *
              </label>
              <input
                type="email"
                required
                value={formData.requesterEmail}
                onChange={(e) => setFormData({ ...formData, requesterEmail: e.target.value })}
                placeholder="contato@empresa.com.br"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1.5px solid var(--border-cream)',
                  fontSize: '0.90rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                Telefone / WhatsApp com DDD
              </label>
              <input
                type="tel"
                value={formData.requesterPhone}
                onChange={(e) => setFormData({ ...formData, requesterPhone: e.target.value })}
                placeholder="(11) 99999-9999"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1.5px solid var(--border-cream)',
                  fontSize: '0.90rem',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
              Link de Documento / Snapshot / Comprovante (Google Drive / OneDrive / Archive.org - Opcional)
            </label>
            <input
              type="url"
              value={formData.documentUrl}
              onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
              placeholder="https://drive.google.com/... ou https://web.archive.org/..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-xs)',
                border: '1.5px solid var(--border-cream)',
                fontSize: '0.90rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
              Detalhamento da Solicitação *
            </label>
            <textarea
              rows={5}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Descreva as alterações nos níveis de garantia, novos ingredientes declarados ou atualização de dados no website oficial..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 'var(--radius-xs)',
                border: '1.5px solid var(--border-cream)',
                fontSize: '0.90rem',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 28px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--brand-forest-900)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 800,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '10px',
              transition: 'var(--transition-fast)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Registrando no Protocolo Oficial...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Protocolar Solicitação Oficial</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
