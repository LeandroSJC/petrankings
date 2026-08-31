'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Award, ArrowLeft, Save, Star, Trash2, ExternalLink,
  AlertCircle, CheckCircle2, ShieldAlert, Plus, Eye, EyeOff, Search, Link as LinkIcon, Edit2, Package
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { slugify, formatDate } from '@/lib/utils';

export interface RankingFormData {
  id?: string;
  slug?: string;
  title: string;
  species: string;
  productType: string;
  description: string;
  isPublished: boolean;
  products?: Array<{
    id: string;
    title: string;
    brand?: string | null;
    imageUrl?: string | null;
    averageRating?: number | null;
    ratingUpdatedAt?: Date | string | null;
    stores?: Array<{
      store: string;
      productUrl: string;
      rating?: number | null;
      reviewCount?: number | null;
    }>;
  }>;
}

interface RankingFormProps {
  mode: 'create' | 'edit';
  initialData?: RankingFormData;
  rankingId?: string;
}

export default function RankingForm({ mode, initialData, rankingId }: RankingFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  // Categorias existentes no banco de dados
  const [categories, setCategories] = useState<{ caes: string[]; gatos: string[]; all: string[] }>({
    caes: [],
    gatos: [],
    all: [],
  });

  // Carregar categorias dinâmicas cadastradas no banco
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories({
            caes: data.caes || [],
            gatos: data.gatos || [],
            all: data.all || [],
          });
        }
      } catch (err) {
        console.error('Erro ao carregar categorias dinâmicas:', err);
      }
    }
    loadCategories();
  }, []);

  const [formData, setFormData] = useState<RankingFormData>(() => {
    if (initialData) {
      return {
        ...initialData,
        description: initialData.description || '',
        isPublished: initialData.isPublished !== undefined ? initialData.isPublished : true,
      };
    }
    return {
      title: '',
      species: 'caes',
      productType: '',
      description: '',
      isPublished: true,
    };
  });

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Produtos vinculados e disponíveis
  const [rankingProducts, setRankingProducts] = useState(initialData?.products || []);
  const [compatibleProducts, setCompatibleProducts] = useState<Array<{ id: string; title: string; brand?: string | null; averageRating?: number | null; imageUrl?: string | null }>>([]);
  const [loadingCompatible, setLoadingCompatible] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Slug em tempo real
  const liveSlug = useMemo(() => {
    if (mode === 'edit' && formData.slug) return formData.slug;
    return slugify(formData.title);
  }, [mode, formData.slug, formData.title]);

  // Carregar produtos compatíveis do catálogo central para facilitar vinculação
  const fetchCompatibleProducts = useCallback(async () => {
    if (mode !== 'edit' || !formData.species || !formData.productType) return;
    try {
      setLoadingCompatible(true);
      const params = new URLSearchParams();
      params.set('species', formData.species);
      params.set('productType', formData.productType);
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.products) {
        setCompatibleProducts(data.products);
      }
    } catch {
      console.error('Erro ao carregar produtos compatíveis');
    } finally {
      setLoadingCompatible(false);
    }
  }, [mode, formData.species, formData.productType]);

  // Recarregar os produtos atuais do ranking
  const reloadRankingProducts = useCallback(async () => {
    if (mode !== 'edit' || !rankingId) return;
    try {
      const res = await fetch(`/api/rankings/${rankingId}`);
      const data = await res.json();
      if (data.ranking && data.ranking.products) {
        setRankingProducts(data.ranking.products);
      }
    } catch {
      console.error('Erro ao recarregar produtos do ranking');
    }
  }, [mode, rankingId]);

  useEffect(() => {
    if (mode === 'edit') {
      fetchCompatibleProducts();
      reloadRankingProducts();
    }
  }, [mode, fetchCompatibleProducts, reloadRankingProducts]);

  // Alerta de saída sem salvar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Atalho Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const updateField = (field: keyof RankingFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setFormError('');
  };

  // Salvar Ranking
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError('');

    if (formData.title.trim().length < 3 || formData.title.trim().length > 180) {
      setFormError('O título do ranking deve conter entre 3 e 180 caracteres.');
      showToast('Corrija o título do ranking', 'error');
      return;
    }

    if (formData.productType.trim().length < 2 || formData.productType.trim().length > 120) {
      setFormError('Informe a categoria / tipo de produto (mínimo 2 caracteres).');
      showToast('Informe o tipo de produto', 'error');
      return;
    }

    setSaving(true);
    try {
      const url = mode === 'edit' ? `/api/rankings/${rankingId}` : '/api/rankings';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Erro ao salvar ranking.');
        showToast(data.error || 'Erro ao salvar', 'error');
        return;
      }

      setIsDirty(false);
      showToast(
        mode === 'edit' ? 'Ranking atualizado com sucesso!' : 'Ranking criado com sucesso!',
        'success'
      );

      router.push('/admin/rankings');
      router.refresh();
    } catch {
      setFormError('Erro de conexão ao salvar ranking.');
      showToast('Erro de conexão', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Vincular ou desvincular produto diretamente do ranking
  const handleToggleProduct = async (productId: string, action: 'link' | 'unlink') => {
    if (!rankingId) return;

    try {
      const res = await fetch(`/api/products/${productId}/rankings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankingId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Erro ao atualizar produto no ranking', 'error');
        return;
      }

      showToast(
        action === 'link' ? 'Produto adicionado ao ranking!' : 'Produto removido do ranking!',
        'success'
      );
      await reloadRankingProducts();
      await fetchCompatibleProducts();
    } catch {
      showToast('Erro de conexão ao atualizar ranking', 'error');
    }
  };

  // Excluir ranking com segurança
  const handleDeleteRanking = async () => {
    if (!rankingId) return;
    if (!window.confirm(`Tem certeza que deseja excluir o ranking "${formData.title}"? Os produtos cadastrados NÃO serão excluídos do catálogo.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/rankings/${rankingId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Erro ao excluir ranking', 'error');
        return;
      }

      setIsDirty(false);
      showToast('Ranking excluído com sucesso!', 'success');
      router.push('/admin/rankings');
      router.refresh();
    } catch {
      showToast('Erro de conexão ao excluir ranking', 'error');
    }
  };

  // Filtro de produtos ainda não vinculados
  const unlinkedCompatibleProducts = useMemo(() => {
    const linkedIds = new Set(rankingProducts.map((p) => p.id));
    return compatibleProducts.filter((p) => {
      if (linkedIds.has(p.id)) return false;
      if (!productSearch) return true;
      const term = productSearch.toLowerCase();
      return (
        p.title.toLowerCase().includes(term) ||
        (p.brand && p.brand.toLowerCase().includes(term))
      );
    });
  }, [compatibleProducts, rankingProducts, productSearch]);

  return (
    <div style={{ padding: '24px 0 80px 0' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Barra Superior de Navegação & Ações */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '24px',
            backgroundColor: '#ffffff',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-cream)',
            boxShadow: 'var(--shadow-sm)',
            position: 'sticky',
            top: '76px',
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/admin/rankings"
              onClick={(e) => {
                if (isDirty && !window.confirm('Você tem alterações não salvas. Deseja realmente sair?')) {
                  e.preventDefault();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--brand-forest-800)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.88rem',
                backgroundColor: 'var(--bg-cream-subtle)',
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-cream)',
                transition: 'var(--transition)',
              }}
            >
              <ArrowLeft size={16} />
              <span>Voltar aos Rankings</span>
            </Link>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--brand-forest-950)' }}>
                  {mode === 'create' ? 'Novo Ranking Editorial' : 'Editar Ranking'}
                </h1>
                {isDirty && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid #fde68a',
                    }}
                  >
                    Alterações pendentes
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Dica: pressione <kbd style={{ backgroundColor: '#f1f5f9', padding: '1px 5px', borderRadius: '3px', fontSize: '0.75rem', border: '1px solid #cbd5e1' }}>Ctrl + S</kbd> para salvar a qualquer momento.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {mode === 'edit' && formData.slug && (
              <Link
                href={`/${formData.species}/${formData.slug}`}
                target="_blank"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-cream-subtle)',
                  color: 'var(--brand-forest-900)',
                  border: '1px solid var(--border-cream)',
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                }}
              >
                <Eye size={15} />
                <span>Ver no Site</span>
                <ExternalLink size={12} />
              </Link>
            )}

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--brand-forest-800)',
                color: '#ffffff',
                padding: '10px 24px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.92rem',
                boxShadow: 'var(--shadow-sm)',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                border: 'none',
                transition: 'var(--transition)',
              }}
            >
              <Save size={17} />
              <span>{saving ? 'Salvando dados...' : 'Salvar Ranking'}</span>
            </button>
          </div>
        </div>

        {/* Mensagem de Erro */}
        {formError && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              color: '#991b1b',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px',
            }}
          >
            <AlertCircle size={20} color="#dc2626" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CARD 1: DADOS EDITORIAIS */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-cream)',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontSize: '1.15rem', color: 'var(--brand-forest-950)', marginBottom: '4px' }}>
              1. Identificação Editorial do Ranking
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Defina o título principal exibido nas buscas e no cabeçalho do ranking comparativo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Título */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    Título do Ranking * (Ex: As Melhores Rações para Cães Adultos)
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                    {formData.title.length}/180 caracteres
                  </span>
                </div>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={180}
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Ex: As 10 Melhores Rações Secas para Cães de Grande Porte"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--border-cream)',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Preview da URL / Slug */}
              <div
                style={{
                  backgroundColor: 'var(--bg-cream-subtle)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                }}
              >
                <strong style={{ color: 'var(--brand-forest-800)' }}>Endereço público (Slug):</strong>
                <code style={{ color: 'var(--brand-forest-900)', backgroundColor: '#ffffff', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-cream)' }}>
                  /{formData.species}/{liveSlug || 'url-do-ranking'}
                </code>
              </div>

              {/* Grid: Espécie, Tipo e Publicação */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {/* Espécie */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                    Espécie *
                  </label>
                  <select
                    value={formData.species}
                    onChange={(e) => updateField('species', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--border-cream)',
                      fontSize: '0.92rem',
                      backgroundColor: '#ffffff',
                      fontWeight: 600,
                    }}
                  >
                    <option value="caes">🐕 Cães</option>
                    <option value="gatos">🐈 Gatos</option>
                  </select>
                </div>

                {/* Tipo de Produto */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                    Categoria / Tipo *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    list="ranking-categories-datalist"
                    value={formData.productType}
                    onChange={(e) => updateField('productType', e.target.value)}
                    placeholder="Ex: Ração Seca, Areia Sanitária"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--border-cream)',
                      fontSize: '0.92rem',
                    }}
                  />
                  <datalist id="ranking-categories-datalist">
                    {(categories[formData.species as 'caes' | 'gatos'] || []).map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                {/* Status de Publicação */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                    Status de Publicação
                  </label>
                  <button
                    type="button"
                    onClick={() => updateField('isPublished', !formData.isPublished)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: formData.isPublished ? '1.5px solid #bbf7d0' : '1.5px solid #fed7aa',
                      backgroundColor: formData.isPublished ? '#f0fdf4' : '#fff7ed',
                      color: formData.isPublished ? '#166534' : '#c2410c',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    {formData.isPublished ? (
                      <>
                        <CheckCircle2 size={16} color="#16a34a" />
                        <span>Publicado no Site</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={16} color="#ea580c" />
                        <span>Rascunho Oculto</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sugestões rápidas de categoria baseadas nas já cadastradas */}
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '6px' }}>
                  Categorias já cadastradas para {formData.species === 'caes' ? 'Cães' : 'Gatos'}:
                </span>
                {(categories[formData.species as 'caes' | 'gatos'] || []).length > 0 ? (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(categories[formData.species as 'caes' | 'gatos'] || []).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => updateField('productType', cat)}
                        style={{
                          fontSize: '0.76rem',
                          backgroundColor: formData.productType.toLowerCase() === cat.toLowerCase() ? 'var(--brand-forest-800)' : 'var(--bg-cream-subtle)',
                          color: formData.productType.toLowerCase() === cat.toLowerCase() ? '#ffffff' : 'var(--brand-forest-900)',
                          border: '1px solid var(--border-cream)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                    Nenhuma categoria cadastrada ainda para {formData.species === 'caes' ? 'cães' : 'gatos'}. Digite no campo acima para criar!
                  </p>
                )}
              </div>

              {/* Descrição Editorial */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    Texto de Introdução e Metodologia Editorial (Opcional)
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                    {formData.description.length}/3000 caracteres
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={3000}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Explique os critérios da curadoria, quais fatores foram considerados e como a lista ajuda o tutor..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--border-cream)',
                    fontSize: '0.92rem',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                  }}
                />
              </div>
            </div>
          </div>

          {/* CARD 2: PRODUTOS NO RANKING (ORDENADOS POR NOTA & CRITÉRIOS DE DESEMPATE) */}
          {mode === 'edit' && rankingId && (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-cream)',
                padding: '28px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', color: 'var(--brand-forest-950)', margin: 0 }}>
                    2. Produtos Classificados no Ranking ({rankingProducts.length})
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
                    A ordem de classificação (#1, #2, #3...) é calculada automaticamente com base na nota média e desempates.
                  </p>
                </div>
              </div>

              {/* Tabela de Produtos no Ranking */}
              {rankingProducts.length > 0 ? (
                <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-cream)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', color: 'var(--brand-forest-900)', width: '60px' }}>Posição</th>
                        <th style={{ padding: '10px 12px', color: 'var(--brand-forest-900)' }}>Produto</th>
                        <th style={{ padding: '10px 12px', color: 'var(--brand-forest-900)', textAlign: 'center' }}>Nota Média</th>
                        <th style={{ padding: '10px 12px', color: 'var(--brand-forest-900)', textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingProducts.map((prod, index) => {
                        const isTop = index === 0;
                        return (
                          <tr
                            key={prod.id}
                            style={{
                              borderBottom: '1px solid var(--border-cream-light)',
                              backgroundColor: isTop ? '#fffbeb' : 'transparent',
                            }}
                          >
                            {/* Posição */}
                            <td style={{ padding: '12px', fontWeight: 800, color: isTop ? '#b45309' : 'var(--brand-forest-800)' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: isTop ? 'var(--gold-500)' : 'var(--brand-forest-50)',
                                  color: isTop ? '#453300' : 'var(--brand-forest-900)',
                                  fontWeight: 800,
                                  fontSize: '0.85rem',
                                }}
                              >
                                #{index + 1}
                              </span>
                            </td>

                            {/* Foto & Título */}
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div
                                  style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '6px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid var(--border-cream)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                  }}
                                >
                                  {prod.imageUrl ? (
                                    <Image
                                      src={prod.imageUrl}
                                      alt={prod.title}
                                      fill
                                      sizes="44px"
                                      style={{ objectFit: 'contain', padding: '2px' }}
                                    />
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                      <Award size={18} color="#cbd5e1" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <strong style={{ display: 'block', color: 'var(--brand-forest-950)', fontSize: '0.92rem' }}>
                                    {prod.title}
                                  </strong>
                                  {prod.brand && (
                                    <span style={{ fontSize: '0.78rem', color: 'var(--brand-forest-600)', fontWeight: 600 }}>
                                      {prod.brand}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Nota Média */}
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              {prod.averageRating !== null && prod.averageRating !== undefined ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: 'var(--brand-forest-900)', fontSize: '0.95rem' }}>
                                  {prod.averageRating.toFixed(2)}
                                  <Star size={14} fill="var(--gold-500)" color="var(--gold-600)" />
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                  Sem nota
                                </span>
                              )}
                            </td>

                            {/* Ações */}
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <Link
                                  href={`/admin/produtos/${prod.id}/editar`}
                                  target="_blank"
                                  title="Editar Produto em Nova Aba"
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-cream-subtle)',
                                    color: 'var(--brand-forest-900)',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <Edit2 size={13} />
                                  <span>Editar</span>
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => handleToggleProduct(prod.id, 'unlink')}
                                  title="Remover produto deste ranking"
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#fef2f2',
                                    color: '#ef4444',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    border: '1px solid #fecaca',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Remover
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', backgroundColor: 'var(--bg-cream-subtle)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-cream)', marginTop: '16px' }}>
                  <Award size={32} color="var(--brand-forest-700)" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                    Nenhum produto vinculado ainda
                  </p>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Use a lista de produtos compatíveis abaixo para adicionar itens a este ranking.
                  </span>
                </div>
              )}

              {/* Adicionar Produtos Compatíveis do Catálogo */}
              <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-cream-light)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '0.98rem', color: 'var(--brand-forest-900)', margin: 0 }}>
                      + Adicionar Produtos do Catálogo ({unlinkedCompatibleProducts.length} disponíveis)
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Exibindo produtos da espécie <strong>{formData.species}</strong> e categoria <strong>{formData.productType}</strong>
                    </span>
                  </div>

                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                    <input
                      type="text"
                      placeholder="Filtrar por nome..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px 6px 30px',
                        fontSize: '0.82rem',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border-cream)',
                      }}
                    />
                  </div>
                </div>

                {loadingCompatible ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Carregando catálogo compatível...</p>
                ) : unlinkedCompatibleProducts.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                    {unlinkedCompatibleProducts.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          backgroundColor: 'var(--bg-cream-subtle)',
                          border: '1px solid var(--border-cream)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <div style={{ width: '32px', height: '32px', position: 'relative', flexShrink: 0, backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid var(--border-cream)' }}>
                            {p.imageUrl ? (
                              <Image src={p.imageUrl} alt={p.title} fill sizes="32px" style={{ objectFit: 'contain' }} />
                            ) : (
                              <Package size={16} color="#94a3b8" style={{ margin: '8px auto' }} />
                            )}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ fontSize: '0.84rem', color: 'var(--brand-forest-900)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.title}
                            </strong>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {p.brand || 'Sem marca'} • {p.averageRating ? `${p.averageRating.toFixed(2)} ★` : 'Sem nota'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleProduct(p.id, 'link')}
                          style={{
                            backgroundColor: 'var(--brand-forest-800)',
                            color: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            border: 'none',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          + Adicionar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                    Nenhum outro produto compatível para vincular no momento. Cadastre mais produtos no Catálogo Central.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CARD 3: ZONA DE PERIGO (APENAS MODO DE EDIÇÃO) */}
          {mode === 'edit' && rankingId && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #fecaca',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={18} /> Excluir este ranking
                </strong>
                <p style={{ fontSize: '0.82rem', color: '#b91c1c', margin: '4px 0 0 0' }}>
                  Os produtos associados permanecerão no Catálogo Central sem qualquer perda.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDeleteRanking}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                Excluir Ranking
              </button>
            </div>
          )}

          {/* Barra Flutuante de Salvar no Rodapé */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '14px',
              paddingTop: '12px',
            }}
          >
            <Link
              href="/admin/rankings"
              onClick={(e) => {
                if (isDirty && !window.confirm('Deseja descartar as alterações e voltar à listagem de rankings?')) {
                  e.preventDefault();
                }
              }}
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-cream)',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: 'var(--text-main)',
                textDecoration: 'none',
                backgroundColor: '#ffffff',
              }}
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--brand-forest-800)',
                color: '#ffffff',
                padding: '12px 32px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: 'var(--shadow-md)',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                border: 'none',
              }}
            >
              <Save size={18} />
              <span>{saving ? 'Gravando dados...' : mode === 'edit' ? 'Atualizar Ranking' : 'Criar Ranking'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
