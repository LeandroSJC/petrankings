'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  Clock,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { getFaixaVisual, formatarTermo } from '@/lib/formatters';

interface ProductItem {
  id: string;
  slug: string;
  commercialName: string;
  brand: string;
  manufacturerLegalName: string;
  legalCategory: string;
  species: string;
  lifeStage: string;
  breedSize: string;
  sourceUrl?: string;
  sourceArchiveUrl?: string | null;
  sourceDocumentUrl?: string | null;
  analyzedBatch?: string | null;
  labelCollectionDate: string;
  scoreTotal: number | null;
  classificationTier: string;
  isPublished: boolean;
  curatorResponsible?: string | null;
}

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('todos');
  const [tierFilter, setTierFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todos');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      showToast('Erro ao carregar catálogo de produtos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover o produto analisado "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Produto excluído com sucesso!', 'success');
        setProducts(products.filter((p) => p.id !== id));
      } else {
        showToast('Erro ao excluir produto.', 'error');
      }
    } catch {
      showToast('Falha na comunicação ao excluir.', 'error');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (speciesFilter !== 'todos' && p.species !== speciesFilter) return false;
    if (tierFilter !== 'todos') {
      const t = p.classificationTier;
      if (tierFilter === 'NIVEL_OURO' && t !== 'NIVEL_OURO' && t !== 'SUPER_PREMIUM') return false;
      if (tierFilter === 'NIVEL_PRATA' && t !== 'NIVEL_PRATA' && t !== 'PREMIUM_ESPECIAL') return false;
      if (tierFilter === 'NIVEL_BRONZE' && t !== 'NIVEL_BRONZE' && t !== 'ECONOMICO') return false;
      if (tierFilter === 'SOB_OBSERVACAO' && t !== 'SOB_OBSERVACAO' && t !== 'NAO_CONFORME' && t !== 'PARAMETRO_LIMITROFE') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.commercialName.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.sourceUrl && p.sourceUrl.toLowerCase().includes(q)) ||
        (p.analyzedBatch && p.analyzedBatch.toLowerCase().includes(q))
      );
    }

    return true;
  });

  return (
    <div style={{ padding: '32px 0 64px 0' }}>
      <div className="container">
        {/* Header da Listagem */}
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
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', color: 'var(--brand-forest-900)' }}>
              Catálogo de Produtos Cadastrados
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Gestão de laudos de rotulagem, conformidade bromatológica e custódia jurídica.
            </p>
          </div>

          <Link
            href="/admin/produtos/novo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--brand-forest-900)',
              color: '#ffffff',
              fontSize: '0.88rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Plus size={16} />
            <span>Cadastrar / Analisar Produto</span>
          </Link>
        </div>

        {/* Filtros e Busca */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-cream)',
            padding: '18px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, marca, lote ou MAPA..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 'var(--radius-xs)',
                border: '1.5px solid var(--border-cream)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1.5px solid var(--border-cream)',
                fontSize: '0.85rem',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="todos">Todas Espécies</option>
              <option value="CAO">🐶 Cães</option>
              <option value="GATO">🐱 Gatos</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1.5px solid var(--border-cream)',
                fontSize: '0.85rem',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="todos">Todas as Categorias</option>
              <option value="ALIMENTO_COMPLETO">Alimento Completo</option>
              <option value="ALIMENTO_COADJUVANTE">Alimento Coadjuvante (Clínico)</option>
            </select>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1.5px solid var(--border-cream)',
                fontSize: '0.85rem',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="todos">Todas as Faixas</option>
              <option value="NIVEL_OURO">Nível Ouro (90 a 100)</option>
              <option value="NIVEL_PRATA">Nível Prata (75 a 89)</option>
              <option value="NIVEL_BRONZE">Nível Bronze (60 a 74)</option>
              <option value="SOB_OBSERVACAO">Sob Observação (&lt; 60)</option>
            </select>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="table-nutri-wrapper">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <span>Carregando catálogo de produtos e laudos...</span>
            </div>
          ) : (
            <table className="table-nutri">
              <thead>
                <tr>
                  <th>Score / Faixa</th>
                  <th>Produto & Marca</th>
                  <th>Classificação</th>
                  <th>Lote & Registro MAPA</th>
                  <th>Coleta / Curador</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isCoadjuvante = p.legalCategory === 'ALIMENTO_COADJUVANTE';
                  const tierInfo = getFaixaVisual(p.classificationTier, isCoadjuvante);
                  return (
                    <tr key={p.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {isCoadjuvante ? (
                          <span className="badge-tier badge-coadjuvante">
                            <Stethoscope size={12} />
                            Clínico
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong
                              style={{
                                fontSize: '1rem',
                                color: p.scoreTotal !== null && p.scoreTotal >= 75 ? '#065f46' : '#92400e',
                              }}
                            >
                              {p.scoreTotal} pts
                            </strong>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: tierInfo.bgColor,
                                color: tierInfo.color,
                                border: `1px solid ${tierInfo.borderColor}`,
                              }}
                            >
                              {tierInfo.shortLabel}
                            </span>
                          </div>
                        )}
                      </td>

                      <td>
                        <strong style={{ color: 'var(--brand-forest-900)', display: 'block' }}>
                          {p.commercialName}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {p.brand}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.82rem' }}>
                        <div>{p.species === 'CAO' ? '🐶 Cão' : '🐱 Gato'} • {formatarTermo(p.lifeStage)}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Porte: {formatarTermo(p.breedSize)}</div>
                      </td>

                      <td style={{ fontSize: '0.82rem' }}>
                        <div>
                          {p.sourceUrl ? (
                            <a
                              href={p.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: 'var(--brand-forest-700)', fontWeight: 700, textDecoration: 'underline' }}
                              title={p.sourceUrl}
                            >
                              🌐 Site Oficial ↗
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Site Oficial</span>
                          )}
                        </div>
                      </td>

                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <div>{new Date(p.labelCollectionDate).toLocaleDateString('pt-BR')}</div>
                        <div style={{ fontSize: '0.75rem' }}>{p.curatorResponsible || 'Curadoria'}</div>
                      </td>

                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Link
                            href={`/admin/produtos/${p.id}/editar`}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-cream-subtle)',
                              color: 'var(--brand-forest-800)',
                              fontSize: '0.80rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Edit2 size={13} />
                            <span>Editar</span>
                          </Link>

                          <Link
                            href={`/produto/${p.slug}`}
                            target="_blank"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '4px',
                              backgroundColor: '#f1f5f9',
                              color: '#334155',
                              fontSize: '0.80rem',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            title="Ver no site público"
                          >
                            <ExternalLink size={13} />
                          </Link>

                          <button
                            onClick={() => handleDelete(p.id, p.commercialName)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#fef2f2',
                              color: '#ef4444',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                            title="Excluir produto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Nenhum produto encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
