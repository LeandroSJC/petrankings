'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award, Plus, Edit2, Trash2, CheckCircle2, XCircle, RefreshCw,
  Eye, Download, FileSpreadsheet, FileDown, FileUp, Upload, X, AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/lib/utils';
import { parseCsv, serializeToCsv, downloadCsvFile, RANKING_CSV_HEADERS, RANKING_CSV_TEMPLATE, ParsedCsvRow } from '@/lib/csv-helper';

interface RankingAdminItem {
  id: string;
  slug: string;
  title: string;
  species: string;
  productType: string;
  description?: string | null;
  isPublished: boolean;
  dataUpdatedAt?: Date | string | null;
  createdAt: Date | string;
  _count?: {
    products: number;
  };
}

export default function AdminRankingsPage() {
  const { showToast } = useToast();
  const [rankings, setRankings] = useState<RankingAdminItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal de Importação CSV
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedCsvRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/rankings?all=true');
      const data = await res.json();
      if (data.rankings) {
        setRankings(data.rankings);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar rankings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  // Baixar Modelo CSV
  const handleDownloadTemplate = () => {
    downloadCsvFile('modelo-rankings-petrankings.csv', RANKING_CSV_TEMPLATE);
    showToast('Modelo de planilha CSV baixado com sucesso!', 'info');
  };

  // Exportação de Rankings para CSV
  const exportRankingsToCsv = () => {
    if (rankings.length === 0) {
      showToast('Nenhum ranking para exportar', 'info');
      return;
    }
    const rows = rankings.map((r) => [
      r.id,
      r.slug,
      r.title,
      r.species,
      r.productType,
      r.description || '',
      r.isPublished ? 'true' : 'false',
    ]);
    const csvContent = serializeToCsv(RANKING_CSV_HEADERS, rows);
    downloadCsvFile(`petrankings-rankings-${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    showToast('Planilha CSV de rankings exportada com sucesso!', 'success');
  };

  // Leitura do arquivo CSV para pré-visualização
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCsv(text);
        if (parsed.length === 0) {
          setImportError('O arquivo CSV parece estar vazio ou com formato inválido.');
          setParsedPreview([]);
        } else {
          setParsedPreview(parsed);
        }
      } catch (err) {
        console.error(err);
        setImportError('Erro ao interpretar o arquivo CSV.');
        setParsedPreview([]);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // Confirmação e envio da importação
  const handleConfirmImport = async () => {
    if (parsedPreview.length === 0) return;
    setImporting(true);
    setImportError('');

    try {
      const res = await fetch('/api/rankings/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankings: parsedPreview }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImportError(data.error || 'Erro durante a importação.');
        showToast(data.error || 'Erro ao importar', 'error');
        return;
      }

      showToast(`Importação concluída: ${data.created} criados, ${data.updated} atualizados!`, 'success');
      if (data.errors && data.errors.length > 0) {
        showToast(`${data.errors.length} avisos durante a importação`, 'info');
      }
      setIsImportModalOpen(false);
      setImportFile(null);
      setParsedPreview([]);
      fetchRankings();
    } catch (err) {
      console.error(err);
      setImportError('Erro de conexão ao enviar rankings.');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o ranking "${title}"? Os produtos vinculados NÃO serão excluídos do catálogo.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/rankings/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Erro ao excluir ranking', 'error');
        return;
      }

      showToast('Ranking excluído com sucesso!', 'success');
      fetchRankings();
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao excluir', 'error');
    } finally {
      setDeletingId(null);
    }
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
            marginBottom: '28px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>
              Gestão de Rankings Editoriais
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Crie rankings comparativos, configure status de publicação e gerencie os produtos vinculados em tela cheia.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={handleDownloadTemplate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'transparent',
                color: 'var(--brand-forest-800)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: '0.84rem',
                border: '1px dashed var(--brand-forest-300)',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              title="Baixar modelo de planilha CSV de rankings pré-formatado"
            >
              <FileDown size={15} color="var(--brand-forest-700)" />
              <span>Modelo CSV</span>
            </button>

            <button
              onClick={() => {
                setImportFile(null);
                setParsedPreview([]);
                setImportError('');
                setIsImportModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--brand-forest-50)',
                color: 'var(--brand-forest-900)',
                padding: '10px 18px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: '1.5px solid var(--brand-forest-200)',
                cursor: 'pointer',
                transition: 'var(--transition)',
              }}
              title="Importar rankings em lote a partir de arquivo CSV"
            >
              <FileUp size={16} color="var(--brand-forest-800)" />
              <span>Importar CSV</span>
            </button>

            <button
              onClick={exportRankingsToCsv}
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
              title="Exportar rankings cadastrados em formato CSV"
            >
              <Download size={16} color="var(--brand-forest-700)" />
              <span>Exportar CSV</span>
            </button>

            {/* Novo Ranking -> Redireciona para /admin/rankings/novo */}
            <Link
              href="/admin/rankings/novo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--brand-forest-800)',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.9rem',
                boxShadow: 'var(--shadow-sm)',
                textDecoration: 'none',
                transition: 'var(--transition)',
              }}
            >
              <Plus size={18} />
              <span>Novo Ranking</span>
            </Link>
          </div>
        </div>

        {/* Lista de Rankings */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px', gap: '10px', color: 'var(--text-muted)' }}>
            <RefreshCw size={20} className="animate-spin" />
            <span>Carregando rankings...</span>
          </div>
        ) : rankings.length > 0 ? (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-cream)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-cream-subtle)', borderBottom: '1px solid var(--border-cream)' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--brand-forest-900)' }}>Ranking</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--brand-forest-900)' }}>Categoria</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--brand-forest-900)' }}>Status</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--brand-forest-900)' }}>Produtos</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--brand-forest-900)' }}>Última Atualização</th>
                    <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--brand-forest-900)', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-cream-light)' }}>
                      <td style={{ padding: '16px 18px' }}>
                        <Link
                          href={`/admin/rankings/${r.id}/editar`}
                          style={{
                            fontSize: '0.95rem',
                            color: 'var(--brand-forest-900)',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'block',
                          }}
                        >
                          {r.title}
                        </Link>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                          /{r.species}/{r.slug}
                        </span>
                      </td>

                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span className={`tag-pill ${r.species === 'caes' ? 'tag-caes' : 'tag-gatos'}`}>
                            {r.species === 'caes' ? '🐕 Cães' : '🐈 Gatos'}
                          </span>
                          <span className="tag-pill tag-type">
                            {r.productType}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '16px 18px' }}>
                        {r.isPublished ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#15803d',
                              backgroundColor: '#f0fdf4',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                            }}
                          >
                            <CheckCircle2 size={13} />
                            <span>Publicado</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#64748b',
                              backgroundColor: '#f1f5f9',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            <XCircle size={13} />
                            <span>Rascunho</span>
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '16px 18px', fontWeight: 600, color: 'var(--brand-forest-800)' }}>
                        {r._count?.products || 0} vinculados
                      </td>

                      <td style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {formatDate(r.dataUpdatedAt)}
                      </td>

                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {r.isPublished && (
                            <Link
                              href={`/${r.species}/${r.slug}`}
                              target="_blank"
                              title="Visualizar página pública"
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                color: 'var(--brand-forest-700)',
                                backgroundColor: 'var(--brand-forest-50)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                textDecoration: 'none',
                              }}
                            >
                              <Eye size={15} />
                            </Link>
                          )}

                          {/* Editar Ranking (Página Dedicada) */}
                          <Link
                            href={`/admin/rankings/${r.id}/editar`}
                            title="Editar informações e produtos do ranking"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              color: 'var(--brand-forest-900)',
                              backgroundColor: 'var(--bg-cream-subtle)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              textDecoration: 'none',
                              border: '1px solid var(--border-cream)',
                            }}
                          >
                            <Edit2 size={15} />
                          </Link>

                          {/* Excluir Ranking */}
                          <button
                            onClick={() => handleDelete(r.id, r.title)}
                            disabled={deletingId === r.id}
                            title="Excluir ranking"
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              color: '#ef4444',
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fecaca',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-cream)' }}>
            <Award size={36} color="var(--gold-600)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Nenhum ranking cadastrado</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Crie seu primeiro ranking para começar a classificar produtos.
            </p>
            <Link
              href="/admin/rankings/novo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--brand-forest-800)',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
              }}
            >
              <Plus size={16} />
              <span>Criar Ranking</span>
            </Link>
          </div>
        )}

        {/* MODAL: IMPORTAÇÃO DE RANKINGS EM CSV (Sem fechamento acidental por backdrop) */}
        {isImportModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(6, 24, 16, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                border: '1.5px solid var(--border-cream)',
                padding: '32px',
                maxWidth: '780px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--brand-forest-50)',
                      color: 'var(--brand-forest-800)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--brand-forest-200)',
                    }}
                  >
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', color: 'var(--brand-forest-900)', margin: 0 }}>
                      Importar Rankings em Lote (CSV)
                    </h2>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Cadastre ou atualize múltiplos rankings através de arquivo de planilha CSV.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!importing) setIsImportModalOpen(false);
                  }}
                  disabled={importing}
                  style={{
                    backgroundColor: 'var(--bg-cream-subtle)',
                    border: '1px solid var(--border-cream)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Botão de Ajuda */}
              <div
                style={{
                  backgroundColor: 'var(--bg-cream-subtle)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '0.84rem', color: 'var(--text-body)' }}>
                  Precisa do arquivo modelo? Baixe o modelo oficial com todas as colunas editoriais.
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#ffffff',
                    color: 'var(--brand-forest-900)',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: '1px solid var(--border-cream)',
                    cursor: 'pointer',
                  }}
                >
                  <FileDown size={14} color="var(--brand-forest-700)" />
                  <span>Baixar Modelo CSV</span>
                </button>
              </div>

              {importError && (
                <div
                  role="alert"
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    color: '#991b1b',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{importError}</span>
                </div>
              )}

              {/* Upload de Arquivo */}
              <div
                style={{
                  border: '2px dashed var(--brand-forest-300)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '32px 20px',
                  textAlign: 'center',
                  backgroundColor: importFile ? 'var(--brand-forest-50)' : '#ffffff',
                  marginBottom: '20px',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
              >
                <input
                  type="file"
                  id="csv-ranking-input"
                  accept=".csv,text/csv,application/vnd.ms-excel"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="csv-ranking-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Upload size={32} color="var(--brand-forest-700)" />
                  <span style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    {importFile ? `Arquivo selecionado: ${importFile.name}` : 'Clique para selecionar o arquivo CSV ou arraste aqui'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Formato .csv codificado em UTF-8
                  </span>
                </label>
              </div>

              {/* Pré-visualização */}
              {parsedPreview.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--brand-forest-900)' }}>
                      Pré-visualização dos Rankings ({parsedPreview.length} encontrados):
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Exibindo até 10 primeiras linhas
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-cream)', borderRadius: 'var(--radius-md)', maxHeight: '240px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                      <thead style={{ backgroundColor: 'var(--bg-cream-subtle)', position: 'sticky', top: 0 }}>
                        <tr style={{ borderBottom: '1px solid var(--border-cream)' }}>
                          <th style={{ padding: '8px 12px' }}>#</th>
                          <th style={{ padding: '8px 12px' }}>Título</th>
                          <th style={{ padding: '8px 12px' }}>Espécie</th>
                          <th style={{ padding: '8px 12px' }}>Tipo</th>
                          <th style={{ padding: '8px 12px' }}>Publicado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPreview.slice(0, 10).map((row, idx) => {
                          const title = row.titulo || row.title || '—';
                          const species = row.especie || row.species || '—';
                          const pType = row.tipo_produto || row.productType || row.tipo || '—';
                          const isPub = (row.publicado || row.isPublished || 'true').toLowerCase() !== 'false';

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-cream-light)' }}>
                              <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--brand-forest-900)' }}>{title}</td>
                              <td style={{ padding: '8px 12px', textTransform: 'capitalize' }}>{species}</td>
                              <td style={{ padding: '8px 12px' }}>{pType}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ color: isPub ? '#16a34a' : '#64748b', fontWeight: 700 }}>
                                  {isPub ? 'Sim' : 'Rascunho'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={importing}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-cream)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={parsedPreview.length === 0 || importing}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--brand-forest-800)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    opacity: parsedPreview.length === 0 || importing ? 0.6 : 1,
                    cursor: parsedPreview.length === 0 || importing ? 'not-allowed' : 'pointer',
                    border: 'none',
                  }}
                >
                  {importing ? 'Importando...' : `Confirmar e Importar (${parsedPreview.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
