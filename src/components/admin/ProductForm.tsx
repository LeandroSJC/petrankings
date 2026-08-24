'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Package, ArrowLeft, Save, Star, Trash2, ExternalLink,
  Upload, AlertCircle, CheckCircle2, ShieldAlert, Plus, Sparkles, Link as LinkIcon
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { VALID_STORES, StoreKey, getStoreInfo } from '@/lib/utils';

export interface ProductFormData {
  id?: string;
  title: string;
  species: string;
  productType: string;
  brand: string;
  description: string;
  imageUrl: string;
  stores: Array<{
    store: string;
    productUrl: string;
    affiliateUrl?: string;
    rating?: string | number;
    reviewCount?: string | number;
  }>;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialData?: ProductFormData;
  productId?: string;
}

const CATEGORY_SUGGESTIONS = {
  caes: [
    'Ração Seca',
    'Ração Úmida / Sachê',
    'Petiscos & Bifinhos',
    'Antipulgas & Carrapatos',
    'Brinquedos Mordedores',
    'Camas & Tapetes Higiênicos',
    'Shampoos & Higiene',
    'Coleiras & Guias',
  ],
  gatos: [
    'Ração Seca Super Premium',
    'Ração Úmida / Sachê',
    'Areia Sanitária',
    'Arranhadores & Torres',
    'Antipulgas Felino',
    'Petiscos & Catnip',
    'Fontes de Água',
    'Brinquedos Interativos',
  ],
};

export default function ProductForm({ mode, initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<ProductFormData>(() => {
    if (initialData) {
      return {
        ...initialData,
        brand: initialData.brand || '',
        description: initialData.description || '',
        imageUrl: initialData.imageUrl || '',
        stores: initialData.stores && initialData.stores.length > 0
          ? initialData.stores.map((s) => ({
              store: s.store,
              productUrl: s.productUrl || '',
              affiliateUrl: s.affiliateUrl || '',
              rating: s.rating !== undefined && s.rating !== null ? String(s.rating) : '',
              reviewCount: s.reviewCount !== undefined && s.reviewCount !== null ? String(s.reviewCount) : '',
            }))
          : [{ store: 'amazon', productUrl: '', affiliateUrl: '', rating: '', reviewCount: '' }],
      };
    }
    return {
      title: '',
      species: 'caes',
      productType: '',
      brand: '',
      description: '',
      imageUrl: '',
      stores: [
        { store: 'amazon', productUrl: '', affiliateUrl: '', rating: '', reviewCount: '' },
      ],
    };
  });

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState('');

  // Rankings vinculados (apenas no modo de edição)
  const [linkedRankings, setLinkedRankings] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [availableRankings, setAvailableRankings] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Carregar rankings compatíveis se estiver em modo de edição
  const fetchRankings = useCallback(async () => {
    if (mode !== 'edit' || !productId) return;
    try {
      setLoadingLinks(true);
      const res = await fetch(`/api/products/${productId}/rankings`);
      const data = await res.json();
      if (data) {
        setLinkedRankings(data.linkedRankings || []);
        setAvailableRankings(data.availableRankings || []);
      }
    } catch {
      console.error('Erro ao carregar rankings vinculados');
    } finally {
      setLoadingLinks(false);
    }
  }, [mode, productId]);

  useEffect(() => {
    if (mode === 'edit' && productId) {
      fetchRankings();
    }
  }, [mode, productId, fetchRankings]);

  // Alerta nativo de saída se houver alterações não salvas
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

  // Atalho Ctrl+S / Cmd+S para salvar
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

  // Atualizar campo simples
  const updateField = (field: keyof ProductFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setFormError('');
  };

  // Média aritmética calculada em tempo real
  const liveAverage = useMemo(() => {
    const validRatings = formData.stores
      .map((s) => parseFloat(String(s.rating || '')))
      .filter((r) => !isNaN(r) && r >= 0 && r <= 5);

    if (validRatings.length === 0) return null;
    const sum = validRatings.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / validRatings.length).toFixed(2));
  }, [formData.stores]);

  // Total de avaliações somadas
  const totalReviews = useMemo(() => {
    return formData.stores.reduce((acc, s) => {
      const num = parseInt(String(s.reviewCount || ''), 10);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [formData.stores]);

  // Upload de Imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 5 MB.', 'error');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', file);

    setUploadingImage(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro no upload da foto', 'error');
        return;
      }
      updateField('imageUrl', data.url);
      showToast('Foto carregada com sucesso!', 'success');
    } catch {
      showToast('Falha na comunicação ao enviar imagem', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Salvar Produto
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError('');

    // Validações
    if (formData.title.trim().length < 3 || formData.title.trim().length > 220) {
      setFormError('O título do produto deve conter entre 3 e 220 caracteres.');
      showToast('Corrija o título do produto', 'error');
      return;
    }

    if (formData.productType.trim().length < 2 || formData.productType.trim().length > 120) {
      setFormError('Informe a categoria / tipo de produto (mínimo 2 caracteres).');
      showToast('Informe o tipo de produto', 'error');
      return;
    }

    if (formData.stores.length === 0) {
      setFormError('Adicione ao menos uma loja parceira para o produto.');
      showToast('Adicione ao menos 1 loja', 'error');
      return;
    }

    for (const st of formData.stores) {
      if (!st.productUrl.trim()) {
        setFormError(`Informe a URL do produto na loja ${getStoreInfo(st.store)?.name || st.store}.`);
        showToast(`URL obrigatória para ${st.store}`, 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const url = mode === 'edit' ? `/api/products/${productId}` : '/api/products';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Erro ao salvar o produto.');
        showToast(data.error || 'Erro ao salvar', 'error');
        return;
      }

      setIsDirty(false);
      showToast(
        mode === 'edit' ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!',
        'success'
      );

      // Redireciona para o catálogo
      router.push('/admin/produtos');
      router.refresh();
    } catch {
      setFormError('Erro de conexão ao salvar produto.');
      showToast('Erro de conexão', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Ação de Vínculo de Ranking
  const handleToggleLink = async (rankingId: string, action: 'link' | 'unlink') => {
    if (!productId) return;

    try {
      const res = await fetch(`/api/products/${productId}/rankings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankingId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Erro ao atualizar vínculo', 'error');
        return;
      }

      showToast(
        action === 'link' ? 'Produto vinculado ao ranking!' : 'Vínculo removido com sucesso!',
        'success'
      );
      fetchRankings();
    } catch {
      showToast('Erro de conexão ao atualizar vínculo', 'error');
    }
  };

  // Excluir Produto com segurança
  const handleDeleteProduct = async () => {
    if (!productId) return;
    if (!window.confirm(`Tem certeza que deseja excluir o produto "${formData.title}" permanentemente?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Não foi possível excluir o produto.');
        showToast(data.error || 'Exclusão bloqueada', 'error');
        return;
      }

      setIsDirty(false);
      showToast('Produto excluído com sucesso!', 'success');
      router.push('/admin/produtos');
      router.refresh();
    } catch {
      showToast('Erro de conexão ao excluir produto', 'error');
    }
  };

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
              href="/admin/produtos"
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
              <span>Voltar ao Catálogo</span>
            </Link>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--brand-forest-950)' }}>
                  {mode === 'create' ? 'Novo Produto no Catálogo' : 'Editar Informações do Produto'}
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
              <span>{saving ? 'Salvando dados...' : 'Salvar Produto'}</span>
            </button>
          </div>
        </div>

        {/* Mensagem de Erro Geral */}
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

        {/* Formulário Central */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CARD 1: INFORMAÇÕES BÁSICAS */}
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
              1. Informações Básicas & Classificação
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Defina o nome editorial, a espécie, a categoria do produto e a marca fabricante.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Título */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    Título do Produto *
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                    {formData.title.length}/220 caracteres
                  </span>
                </div>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={220}
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Ex: Ração Royal Canin Maxi Adult Cães Adultos Grandes"
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

              {/* Grid: Espécie, Tipo e Marca */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {/* Espécie */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                    Espécie Destinada *
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
                    value={formData.productType}
                    onChange={(e) => updateField('productType', e.target.value)}
                    placeholder="Ex: Ração Seca, Areia Higiênica"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--border-cream)',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>

                {/* Marca */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                    Marca Fabricante (Opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={formData.brand}
                    onChange={(e) => updateField('brand', e.target.value)}
                    placeholder="Ex: Royal Canin, Premier, Pipicat"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--border-cream)',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>
              </div>

              {/* Sugestões rápidas de tipos populares */}
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '6px' }}>
                  Sugestões frequentes para {formData.species === 'caes' ? 'Cães' : 'Gatos'}:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(CATEGORY_SUGGESTIONS[formData.species as 'caes' | 'gatos'] || []).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => updateField('productType', cat)}
                      style={{
                        fontSize: '0.76rem',
                        backgroundColor: formData.productType === cat ? 'var(--brand-forest-800)' : 'var(--bg-cream-subtle)',
                        color: formData.productType === cat ? '#ffffff' : 'var(--brand-forest-900)',
                        border: '1px solid var(--border-cream)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'var(--transition)',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    Descrição e Destaques Editoriais (Opcional)
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
                  placeholder="Resumo editorial sobre formulação, porte indicado, benefícios nutricionais ou pontos de atenção..."
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

          {/* CARD 2: FOTO E MÍDIA */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-cream)',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--brand-forest-950)', margin: 0 }}>
                2. Imagem e Identificação Visual
              </h2>
              {formData.imageUrl && (
                <span style={{ fontSize: '0.8rem', color: 'var(--brand-forest-700)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={15} color="var(--brand-forest-600)" /> Imagem vinculada
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Envie um arquivo de imagem direto do computador ou cole o link direto da foto do produto.
            </p>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Preview da Imagem */}
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px dashed var(--border-cream)',
                  backgroundColor: 'var(--bg-cream-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                {formData.imageUrl ? (
                  <Image
                    src={formData.imageUrl}
                    alt="Pré-visualização da imagem do produto"
                    fill
                    sizes="120px"
                    style={{ objectFit: 'contain', padding: '6px' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.75rem', padding: '8px' }}>
                    <Package size={32} color="#94a3b8" style={{ margin: '0 auto 4px auto' }} />
                    <span>Sem imagem</span>
                  </div>
                )}
              </div>

              {/* Controles de URL e Upload */}
              <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Colar URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                    URL Externa da Imagem:
                  </label>
                  <input
                    type="text"
                    placeholder="https://images.petlove.com.br/... ou /uploads/..."
                    value={formData.imageUrl}
                    onChange={(e) => updateField('imageUrl', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-cream)',
                      fontSize: '0.88rem',
                      backgroundColor: '#ffffff',
                    }}
                  />
                </div>

                {/* Upload Local */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'var(--brand-forest-50)',
                      color: 'var(--brand-forest-900)',
                      border: '1.5px solid var(--brand-forest-200)',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: uploadingImage ? 'not-allowed' : 'pointer',
                      boxShadow: 'var(--shadow-xs)',
                      transition: 'var(--transition)',
                    }}
                  >
                    <Upload size={16} />
                    <span>{uploadingImage ? 'Enviando arquivo...' : 'Escolher foto do computador'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => updateField('imageUrl', '')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#ef4444',
                        backgroundColor: 'transparent',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '6px 10px',
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Remover foto</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: LOJAS VINCULADAS & AVALIAÇÕES */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-cream)',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '6px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', color: 'var(--brand-forest-950)', margin: 0 }}>
                  3. Lojas Parceiras & Avaliações Coletadas
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
                  Cadastre os links e as notas das lojas participantes. A média do produto é calculada automaticamente.
                </p>
              </div>

              {formData.stores.length < VALID_STORES.length && (
                <button
                  type="button"
                  onClick={() => {
                    const existing = formData.stores.map((s) => s.store);
                    const next = VALID_STORES.find((k) => !existing.includes(k)) || 'amazon';
                    setFormData((prev) => ({
                      ...prev,
                      stores: [...prev.stores, { store: next, productUrl: '', affiliateUrl: '', rating: '', reviewCount: '' }],
                    }));
                    setIsDirty(true);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--brand-forest-50)',
                    color: 'var(--brand-forest-900)',
                    border: '1.5px solid var(--brand-forest-200)',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={15} />
                  <span>Adicionar Loja</span>
                </button>
              )}
            </div>

            {/* Painel de Média em Tempo Real */}
            <div
              style={{
                backgroundColor: 'var(--brand-forest-950)',
                color: '#ffffff',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                margin: '18px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Star size={22} fill="var(--gold-500)" color="var(--gold-500)" />
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', display: 'block', color: '#ffffff' }}>
                    Média Aritmética Atual:
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {liveAverage !== null
                      ? `Calculada com base em ${formData.stores.filter((s) => !isNaN(parseFloat(String(s.rating))) && parseFloat(String(s.rating)) >= 0).length} loja(s) com nota`
                      : 'Nenhuma nota informada ainda'}
                    {totalReviews > 0 && ` • ${totalReviews.toLocaleString('pt-BR')} avaliações no total`}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--gold-500)', lineHeight: 1 }}>
                  {liveAverage !== null ? `${liveAverage.toFixed(2)} ★` : '—'}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>Escala de 0.0 a 5.0</span>
              </div>
            </div>

            {/* Lista de Lojas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formData.stores.map((st, idx) => {
                const storeInfo = getStoreInfo(st.store);
                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'var(--bg-cream-subtle)',
                      border: '1px solid var(--border-cream)',
                      borderRadius: 'var(--radius-md)',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Linha 1: Loja e Ações */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <select
                          value={st.store}
                          onChange={(e) => {
                            const updated = [...formData.stores];
                            updated[idx].store = e.target.value;
                            setFormData({ ...formData, stores: updated });
                            setIsDirty(true);
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1.5px solid var(--border-cream)',
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            backgroundColor: '#ffffff',
                          }}
                        >
                          {VALID_STORES.map((k) => (
                            <option key={k} value={k}>
                              {getStoreInfo(k)?.name || k}
                            </option>
                          ))}
                        </select>

                        {st.productUrl && (
                          <a
                            href={st.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.78rem',
                              color: 'var(--brand-forest-700)',
                              textDecoration: 'none',
                              fontWeight: 600,
                              backgroundColor: '#ffffff',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)',
                              border: '1px solid var(--border-cream)',
                            }}
                          >
                            <span>Testar link</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>

                      {formData.stores.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.stores.filter((_, i) => i !== idx);
                            setFormData({ ...formData, stores: updated });
                            setIsDirty(true);
                          }}
                          style={{
                            color: '#ef4444',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            border: '1px solid #fecaca',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            cursor: 'pointer',
                          }}
                        >
                          Remover loja
                        </button>
                      )}
                    </div>

                    {/* Linha 2: URLs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                          URL do Produto na Loja *
                        </label>
                        <input
                          type="url"
                          required
                          placeholder={`https://www.${st.store}.com.br/...`}
                          value={st.productUrl}
                          onChange={(e) => {
                            const updated = [...formData.stores];
                            updated[idx].productUrl = e.target.value;
                            setFormData({ ...formData, stores: updated });
                            setIsDirty(true);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-cream)',
                            fontSize: '0.88rem',
                            backgroundColor: '#ffffff',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                          URL de Afiliado (Opcional - link prioritário)
                        </label>
                        <input
                          type="url"
                          placeholder="https://amzn.to/... ou tag de afiliado"
                          value={st.affiliateUrl || ''}
                          onChange={(e) => {
                            const updated = [...formData.stores];
                            updated[idx].affiliateUrl = e.target.value;
                            setFormData({ ...formData, stores: updated });
                            setIsDirty(true);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-cream)',
                            fontSize: '0.88rem',
                            backgroundColor: '#ffffff',
                          }}
                        />
                      </div>
                    </div>

                    {/* Linha 3: Notas e Contagem */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#ffffff', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-cream)' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                          Nota na Loja (0.0 a 5.0)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          placeholder="Ex: 4.8"
                          value={st.rating !== undefined && st.rating !== null ? st.rating : ''}
                          onChange={(e) => {
                            const updated = [...formData.stores];
                            updated[idx].rating = e.target.value;
                            setFormData({ ...formData, stores: updated });
                            setIsDirty(true);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-cream)',
                            fontSize: '0.92rem',
                            fontWeight: 700,
                            color: 'var(--brand-forest-900)',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                          Total de Avaliações (Desempate)
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Ex: 1450"
                          value={st.reviewCount !== undefined && st.reviewCount !== null ? st.reviewCount : ''}
                          onChange={(e) => {
                            const updated = [...formData.stores];
                            updated[idx].reviewCount = e.target.value;
                            setFormData({ ...formData, stores: updated });
                            setIsDirty(true);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-cream)',
                            fontSize: '0.92rem',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD 4: VÍNCULOS COM RANKINGS (APENAS MODO DE EDIÇÃO) */}
          {mode === 'edit' && productId && (
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-cream)',
                padding: '28px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '1.15rem', color: 'var(--brand-forest-950)', margin: 0 }}>
                  4. Vínculos com Rankings Editoriais
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Compatibilidade: <strong>{formData.species === 'caes' ? 'Cães' : 'Gatos'} • {formData.productType}</strong>
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Associe este produto aos rankings compatíveis. Ele será posicionado automaticamente pela nota média calculada.
              </p>

              {loadingLinks ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Carregando rankings vinculados...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Rankings Vinculados Atualmente */}
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--brand-forest-900)', display: 'block', marginBottom: '8px' }}>
                      Rankings em que participa ({linkedRankings.length}):
                    </strong>
                    {linkedRankings.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {linkedRankings.map((rk) => (
                          <div
                            key={rk.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CheckCircle2 size={16} color="#16a34a" />
                              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534' }}>
                                {rk.title}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Link
                                href={`/admin/rankings/${rk.id}/editar`}
                                target="_blank"
                                style={{
                                  fontSize: '0.78rem',
                                  color: '#166534',
                                  textDecoration: 'underline',
                                }}
                              >
                                Ver ranking
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleToggleLink(rk.id, 'unlink')}
                                style={{
                                  color: '#ef4444',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #fecaca',
                                  cursor: 'pointer',
                                }}
                              >
                                Desvincular
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                        Este produto ainda não está vinculado a nenhum ranking.
                      </p>
                    )}
                  </div>

                  {/* Rankings Disponíveis para Vincular */}
                  {availableRankings.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--brand-forest-900)', display: 'block', marginBottom: '8px' }}>
                        Rankings compatíveis disponíveis ({availableRankings.length}):
                      </strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {availableRankings.map((rk) => (
                          <div
                            key={rk.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              backgroundColor: 'var(--bg-cream-subtle)',
                              border: '1px solid var(--border-cream)',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            <span style={{ fontSize: '0.9rem', color: 'var(--brand-forest-900)' }}>
                              {rk.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleLink(rk.id, 'link')}
                              style={{
                                backgroundColor: 'var(--brand-forest-800)',
                                color: '#ffffff',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-full)',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              + Vincular ao Ranking
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* CARD 5: ZONA DE PERIGO (APENAS MODO DE EDIÇÃO) */}
          {mode === 'edit' && productId && (
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
                  <ShieldAlert size={18} /> Excluir este produto do catálogo
                </strong>
                <p style={{ fontSize: '0.82rem', color: '#b91c1c', margin: '4px 0 0 0' }}>
                  A exclusão só é permitida se o produto não estiver vinculado a rankings ativos.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDeleteProduct}
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
                Excluir Produto
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
              href="/admin/produtos"
              onClick={(e) => {
                if (isDirty && !window.confirm('Deseja descartar as alterações e voltar ao catálogo?')) {
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
              <span>{saving ? 'Gravando dados...' : mode === 'edit' ? 'Atualizar Produto' : 'Cadastrar Produto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
