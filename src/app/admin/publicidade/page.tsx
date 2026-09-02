'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Save,
  CheckCircle2,
  AlertCircle,
  Code,
  Eye,
  Info,
  Layers,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

interface AdSlotItem {
  id?: string;
  slotKey: string;
  name: string;
  description: string | null;
  code: string;
  isActive: boolean;
}

export default function AdminPublicidadePage() {
  const { showToast } = useToast();
  const [slots, setSlots] = useState<AdSlotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'slots' | 'guia'>('slots');

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ads');
      const data = await res.json();
      if (res.ok && data.slots) {
        setSlots(data.slots);
      } else {
        showToast(data.error || 'Erro ao carregar blocos de anúncio', 'error');
      }
    } catch {
      showToast('Falha na comunicação com o servidor', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = (slotKey: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.slotKey === slotKey ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleCodeChange = (slotKey: string, newCode: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.slotKey === slotKey ? { ...s, code: newCode } : s))
    );
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Configurações de publicidade salvas com sucesso!', 'success');
        if (data.slots) {
          setSlots(data.slots);
        }
      } else {
        showToast(data.error || 'Erro ao salvar configurações', 'error');
      }
    } catch {
      showToast('Erro de rede ao salvar configurações', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const activeSlotsCount = slots.filter((s) => s.isActive).length;

  const exampleSnippet = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
<!-- Bloco PetRankings -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`;

  return (
    <div style={{ padding: '32px 0 80px 0' }}>
      <div className="container">
        {/* Cabeçalho da Página */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--brand-forest-800)',
                  color: 'var(--gold-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Megaphone size={20} />
              </div>
              <h1 style={{ fontSize: '1.9rem', color: 'var(--brand-forest-950)', margin: 0 }}>
                Gerenciador de Publicidade & AdSense
              </h1>
            </div>
            <p style={{ color: 'var(--text-body)', fontSize: '0.94rem', margin: 0 }}>
              Ative ou desative posições de anúncios e cole os códigos fornecidos pelo Google AdSense diretamente para exibição no site.
            </p>
          </div>

          {/* Botão de Salvar Superior */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={fetchSlots}
              disabled={isLoading || isSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#ffffff',
                border: '1.5px solid var(--border-cream)',
                color: 'var(--brand-forest-900)',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              title="Recarregar do banco de dados"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              <span>Atualizar</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isLoading || isSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--brand-forest-800)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: isLoading || isSaving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(27, 67, 50, 0.2)',
                transition: 'var(--transition)',
              }}
            >
              <Save size={16} />
              <span>{isSaving ? 'Salvando Alterações...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>

        {/* Resumo de Status Rápido */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-cream)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'rgba(27, 67, 50, 0.08)',
                color: 'var(--brand-forest-800)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Total de Posições
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-forest-950)' }}>
                {slots.length} Slots
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-cream)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Posições Ativas
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
                {activeSlotsCount} Ativas
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-cream)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'rgba(100, 116, 139, 0.12)',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Eye size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Desativadas
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#64748b' }}>
                {slots.length - activeSlotsCount} Inativas
              </div>
            </div>
          </div>
        </div>

        {/* Abas de Navegação interna */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1.5px solid var(--border-cream)',
            marginBottom: '24px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('slots')}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '0.94rem',
              fontWeight: 700,
              color: activeTab === 'slots' ? 'var(--brand-forest-900)' : 'var(--text-muted)',
              borderBottom: activeTab === 'slots' ? '3px solid var(--brand-forest-800)' : '3px solid transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Code size={16} />
            <span>Posições de Anúncio ({slots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guia')}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '0.94rem',
              fontWeight: 700,
              color: activeTab === 'guia' ? 'var(--brand-forest-900)' : 'var(--text-muted)',
              borderBottom: activeTab === 'guia' ? '3px solid var(--brand-forest-800)' : '3px solid transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <HelpCircle size={16} />
            <span>Guia de Configuração do AdSense</span>
          </button>
        </div>

        {/* Conteúdo da Aba: Posições de Anúncio */}
        {activeTab === 'slots' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {isLoading ? (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
                <p>Carregando configurações de publicidade...</p>
              </div>
            ) : slots.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  padding: '40px',
                  textAlign: 'center',
                  border: '1.5px dashed var(--border-cream)',
                }}
              >
                <p style={{ color: 'var(--text-body)' }}>Nenhum slot de anúncio configurado.</p>
              </div>
            ) : (
              slots.map((slot) => {
                const hasCode = Boolean(slot.code && slot.code.trim());

                return (
                  <div
                    key={slot.slotKey}
                    style={{
                      backgroundColor: '#ffffff',
                      border: slot.isActive
                        ? '1.5px solid rgba(16, 185, 129, 0.4)'
                        : '1.5px solid var(--border-cream)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: slot.isActive
                        ? '0 4px 16px rgba(16, 185, 129, 0.06)'
                        : '0 2px 8px rgba(0, 0, 0, 0.02)',
                      padding: '24px',
                      transition: 'var(--transition)',
                    }}
                  >
                    {/* Header do Card de Slot */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px',
                        marginBottom: '16px',
                        paddingBottom: '16px',
                        borderBottom: '1px solid var(--border-cream)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h2
                            style={{
                              fontSize: '1.25rem',
                              fontWeight: 800,
                              color: 'var(--brand-forest-950)',
                              margin: 0,
                            }}
                          >
                            {slot.name}
                          </h2>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--bg-cream-subtle)',
                              border: '1px solid var(--border-cream)',
                              color: 'var(--text-body)',
                              fontFamily: 'monospace',
                            }}
                          >
                            chave: {slot.slotKey}
                          </span>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              padding: '3px 10px',
                              borderRadius: '12px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              backgroundColor: slot.isActive ? '#ecfdf5' : '#f1f5f9',
                              color: slot.isActive ? '#059669' : '#64748b',
                              border: `1px solid ${slot.isActive ? '#a7f3d0' : '#cbd5e1'}`,
                            }}
                          >
                            {slot.isActive ? '● Ativo no Site' : '○ Inativo'}
                          </span>
                        </div>
                        {slot.description && (
                          <p
                            style={{
                              color: 'var(--text-body)',
                              fontSize: '0.88rem',
                              margin: '6px 0 0 0',
                            }}
                          >
                            {slot.description}
                          </p>
                        )}
                      </div>

                      {/* Alternador Ativo/Inativo */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: slot.isActive ? '#059669' : 'var(--text-muted)',
                          }}
                        >
                          {slot.isActive ? 'Publicidade Ativa' : 'Publicidade Desativada'}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={slot.isActive}
                          onClick={() => handleToggleActive(slot.slotKey)}
                          style={{
                            width: '52px',
                            height: '28px',
                            borderRadius: '14px',
                            backgroundColor: slot.isActive ? '#10b981' : '#cbd5e1',
                            border: 'none',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            padding: 0,
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: '2px',
                              left: slot.isActive ? '26px' : '3px',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                              transition: 'left 0.2s',
                            }}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Editor do Código do AdSense */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                        }}
                      >
                        <label
                          htmlFor={`code-${slot.slotKey}`}
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--brand-forest-900)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Code size={14} />
                          <span>Código HTML / Script fornecido pelo AdSense:</span>
                        </label>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {hasCode ? (
                            <span
                              style={{
                                fontSize: '0.74rem',
                                color: '#059669',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <CheckCircle2 size={13} /> {slot.code.length} caracteres
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.74rem',
                                color: 'var(--text-muted)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <AlertCircle size={13} /> Nenhum código colado
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          position: 'relative',
                          backgroundColor: '#1e293b',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          border: '1px solid #334155',
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: '#0f172a',
                            padding: '6px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #334155',
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                            HTML / JavaScript (AdSense Script)
                          </span>
                          {slot.code && (
                            <button
                              type="button"
                              onClick={() => handleCodeChange(slot.slotKey, '')}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#f87171',
                                fontSize: '0.72rem',
                                cursor: 'pointer',
                              }}
                            >
                              Limpar código
                            </button>
                          )}
                        </div>

                        <textarea
                          id={`code-${slot.slotKey}`}
                          rows={6}
                          value={slot.code}
                          onChange={(e) => handleCodeChange(slot.slotKey, e.target.value)}
                          placeholder={`Cole aqui o código fornecido pelo Google AdSense integralmente...\nExemplo:\n<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-..." data-ad-slot="..." data-ad-format="auto"></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`}
                          style={{
                            width: '100%',
                            backgroundColor: 'transparent',
                            color: '#f8fafc',
                            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                            fontSize: '0.84rem',
                            lineHeight: 1.5,
                            padding: '14px',
                            border: 'none',
                            outline: 'none',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '8px',
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span>
                          💡 O código será incluído integralmente na página sem alterações quando o slot estiver ativo.
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Barra de Ação Inferior */}
            {slots.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px 24px',
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--border-cream)',
                  marginTop: '8px',
                }}
              >
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  {activeSlotsCount} de {slots.length} posições de publicidade estão ativas.
                </span>

                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isLoading || isSaving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 28px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--brand-forest-800)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.94rem',
                    fontWeight: 700,
                    cursor: isLoading || isSaving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(27, 67, 50, 0.25)',
                    transition: 'var(--transition)',
                  }}
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Salvando Alterações...' : 'Salvar Todas as Posições'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Conteúdo da Aba: Guia de Configuração do AdSense */}
        {activeTab === 'guia' && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border-cream)',
              padding: '32px',
            }}
          >
            <h2 style={{ fontSize: '1.4rem', color: 'var(--brand-forest-950)', marginBottom: '16px' }}>
              Como obter os códigos de anúncio no Google AdSense
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-body)' }}>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-forest-800)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-forest-900)', margin: '0 0 4px 0' }}>
                    Acesse o painel do Google AdSense
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.92rem' }}>
                    Faça login na sua conta do{' '}
                    <a
                      href="https://www.google.com/adsense"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--brand-forest-700)', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      Google AdSense <ExternalLink size={12} style={{ display: 'inline' }} />
                    </a>
                    .
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-forest-800)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-forest-900)', margin: '0 0 4px 0' }}>
                    Crie um novo Bloco de Anúncios
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.92rem' }}>
                    No menu lateral esquerdo, clique em <strong>Anúncios</strong> &rarr; <strong>Por bloco de anúncios</strong>.
                    Recomendamos criar:
                  </p>
                  <ul style={{ margin: '8px 0 0 18px', padding: 0, fontSize: '0.9rem' }}>
                    <li><strong>Anúncios de display (Responsivo)</strong>: Ideal para Topo e Rodapé.</li>
                    <li><strong>Anúncios In-feed</strong>: Ideal para o Meio dos Produtos.</li>
                    <li><strong>Anúncios no artigo</strong>: Excelente para artigos editoriais e laterais.</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-forest-800)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-forest-900)', margin: '0 0 4px 0' }}>
                    Copie o Snippet do Código
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.92rem' }}>
                    Após nomear e salvar o bloco de anúncios, o AdSense exibirá uma caixa com o código HTML/Script.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-forest-800)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                  }}
                >
                  4
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-forest-900)', margin: '0 0 4px 0' }}>
                    Cole no campo correspondente e ative o botão
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.92rem' }}>
                    Volte à aba <strong>Posições de Anúncio</strong>, cole o código integralmente no respectivo slot, ative a chave e clique em <strong>Salvar Alterações</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Exemplo de Código do AdSense */}
            <div style={{ marginTop: '28px' }}>
              <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '8px' }}>
                Formato típico do código do AdSense:
              </h4>
              <div
                style={{
                  backgroundColor: '#1e293b',
                  color: '#e2e8f0',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace',
                  fontSize: '0.84rem',
                  overflowX: 'auto',
                }}
              >
                <pre style={{ margin: 0 }}>{exampleSnippet}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
