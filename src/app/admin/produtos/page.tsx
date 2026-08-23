'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Package, Plus, Edit2, Star, Link as LinkIcon, Trash2,
  RefreshCw, AlertTriangle, AlertCircle, ExternalLink, CheckCircle2,
  Upload, X, Check, Search, Filter, ShieldAlert, Download, FileSpreadsheet, FileDown, FileUp
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate, formatShortDate, isOlderThanDays, VALID_STORES, StoreKey, getStoreInfo } from '@/lib/utils';
import { parseCsv, serializeToCsv, downloadCsvFile, PRODUCT_CSV_HEADERS, PRODUCT_CSV_TEMPLATE, ParsedCsvRow } from '@/lib/csv-helper';

interface ProductItem {
  id: string;
  title: string;
  species: string;
  productType: string;
  brand?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  averageRating: number | null;
  ratingUpdatedAt?: Date | string | null;
  createdAt: Date | string;
  stores: Array<{
    id: string;
    store: string;
    productUrl: string;
    affiliateUrl?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
  }>;
  rankings: Array<{
    rankingId: string;
    ranking: {
      id: string;
      title: string;
      slug: string;
      species: string;
      productType: string;
    };
  }>;
}

function AdminProductsContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const editReviewParam = searchParams.get('editReview');

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsReviewCount, setNeedsReviewCount] = useState(0);

  // Filtros e Ordenação
  const [selectedSpecies, setSelectedSpecies] = useState('todos');
  const [selectedType, setSelectedType] = useState('todos');
  const [sortOrder, setSortOrder] = useState('recent'); // recent | oldest | unreviewed | name
  const [searchQuery, setSearchQuery] = useState('');

  // Modais
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<ProductItem | null>(null);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkProduct, setLinkProduct] = useState<ProductItem | null>(null);
  const [linkedRankings, setLinkedRankings] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [availableRankings, setAvailableRankings] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Form de Produto
  const [productForm, setProductForm] = useState({
    title: '',
    species: 'caes',
    productType: '',
    brand: '',
    description: '',
    imageUrl: '',
    stores: [
      { store: 'amazon', productUrl: '', affiliateUrl: '', rating: '', reviewCount: '' },
    ],
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productFormError, setProductFormError] = useState('');

  // Form de Avaliações
  const [reviewForm, setReviewForm] = useState<Array<{ storeId: string; store: string; productUrl: string; rating: string; reviewCount: string }>>([]);
  const [savingReviews, setSavingReviews] = useState(false);

  // Média aritmética calculada em tempo real no cliente
  const liveAverage = useMemo(() => {
    const validRatings = reviewForm
      .map((rf) => parseFloat(rf.rating))
      .filter((r) => !isNaN(r) && r >= 0 && r <= 5);
    if (validRatings.length === 0) return null;
    const sum = validRatings.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / validRatings.length).toFixed(2));
  }, [reviewForm]);

  // Modal de Importação CSV
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedCsvRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // Baixar Modelo CSV
  const handleDownloadTemplate = () => {
    downloadCsvFile('modelo-produtos-petrankings.csv', PRODUCT_CSV_TEMPLATE);
    showToast('Modelo de planilha CSV baixado com sucesso!', 'info');
  };

  // Exportação do Catálogo para CSV em conformidade total com o modelo de importação
  const exportProductsToCsv = () => {
    if (products.length === 0) {
      showToast('Nenhum produto para exportar', 'info');
      return;
    }

    const rows = products.map((p) => {
      const getStoreData = (key: string) => {
        const found = (p.stores || []).find((s) => s.store === key);
        return {
          url: found?.productUrl || '',
          rating: found?.rating !== null && found?.rating !== undefined ? String(found.rating) : '',
          reviewCount: found?.reviewCount !== null && found?.reviewCount !== undefined ? String(found.reviewCount) : '',
        };
      };

      const amz = getStoreData('amazon');
      const pet = getStoreData('petlove');
      const cob = getStoreData('cobasi');
      const ml = getStoreData('mercadolivre');
      const shp = getStoreData('shopee');

      const linkedRankingsStr = (p.rankings || []).map((r) => r.ranking.title).join('; ');

      return [
        p.id,
        p.title,
        p.brand || '',
        p.species,
        p.productType,
        p.description || '',
        p.imageUrl || '',
        amz.url,
        amz.rating,
        amz.reviewCount,
        pet.url,
        pet.rating,
        pet.reviewCount,
        cob.url,
        cob.rating,
        cob.reviewCount,
        ml.url,
        ml.rating,
        ml.reviewCount,
        shp.url,
        shp.rating,
        shp.reviewCount,
        linkedRankingsStr,
      ];
    });

    const csvContent = serializeToCsv(PRODUCT_CSV_HEADERS, rows);
    downloadCsvFile(`petrankings-produtos-${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    showToast('Planilha CSV do catálogo exportada com sucesso!', 'success');
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
          setImportError('O arquivo CSV parece estar vazio ou com formato de colunas incorreto.');
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
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsedPreview }),
      });

      const data = await res.json();

      if (!res.ok) {
        setImportError(data.error || 'Erro durante a importação.');
        showToast(data.error || 'Erro ao importar', 'error');
        return;
      }

      showToast(`Importação concluída: ${data.created} criados, ${data.updated} atualizados!`, 'success');
      if (data.errors && data.errors.length > 0) {
        showToast(`${data.errors.length} alertas durante o processamento`, 'info');
      }
      setIsImportModalOpen(false);
      setImportFile(null);
      setParsedPreview([]);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setImportError('Erro de conexão ao enviar dados de importação.');
    } finally {
      setImporting(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSpecies !== 'todos') params.set('species', selectedSpecies);
      if (selectedType !== 'todos') params.set('productType', selectedType);
      if (sortOrder) params.set('sort', sortOrder);
      if (searchQuery) params.set('q', searchQuery);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
        setNeedsReviewCount(data.needsReviewCount || 0);

        // Se veio query param para abrir modal de review
        if (editReviewParam) {
          const target = data.products.find((p: ProductItem) => p.id === editReviewParam);
          if (target) {
            openReviewModal(target);
          }
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar catálogo', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedSpecies, selectedType, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  // Tipos disponíveis para o filtro
  const availableTypes = useMemo(() => {
    const relevant = selectedSpecies === 'todos' ? products : products.filter((p) => p.species === selectedSpecies);
    return Array.from(new Set(relevant.map((p) => p.productType))).filter(Boolean);
  }, [products, selectedSpecies]);

  // Modal Produto: Abrir Novo
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      species: 'caes',
      productType: '',
      brand: '',
      description: '',
      imageUrl: '',
      stores: [
        { store: 'amazon', productUrl: '', affiliateUrl: '', rating: '', reviewCount: '' },
      ],
    });
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  // Modal Produto: Abrir Edição
  const openEditProduct = (prod: ProductItem) => {
    setEditingProduct(prod);
    setProductForm({
      title: prod.title,
      species: prod.species,
      productType: prod.productType,
      brand: prod.brand || '',
      description: prod.description || '',
      imageUrl: prod.imageUrl || '',
      stores: prod.stores.map((s) => ({
        store: s.store,
        productUrl: s.productUrl,
        affiliateUrl: s.affiliateUrl || '',
        rating: s.rating !== null && s.rating !== undefined ? s.rating.toString() : '',
        reviewCount: s.reviewCount !== null && s.reviewCount !== undefined ? s.reviewCount.toString() : '',
      })),
    });
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  // Upload de Imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 5 MB.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingImage(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro no upload', 'error');
        return;
      }
      setProductForm((prev) => ({ ...prev, imageUrl: data.url }));
      showToast('Imagem carregada com sucesso!', 'success');
    } catch {
      showToast('Falha no upload da imagem', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Salvar Produto
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError('');

    if (productForm.title.trim().length < 3 || productForm.title.trim().length > 220) {
      setProductFormError('O título deve conter entre 3 e 220 caracteres.');
      return;
    }
    if (productForm.productType.trim().length < 2 || productForm.productType.trim().length > 120) {
      setProductFormError('O tipo de produto deve conter entre 2 e 120 caracteres.');
      return;
    }

    if (productForm.stores.length === 0) {
      setProductFormError('Adicione ao menos uma loja participante.');
      return;
    }

    for (const st of productForm.stores) {
      if (!st.productUrl.trim()) {
        setProductFormError(`Informe a URL do produto para a loja ${st.store}.`);
        return;
      }
    }

    setSavingProduct(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setProductFormError(data.error || 'Erro ao salvar produto.');
        showToast(data.error || 'Erro ao salvar', 'error');
        return;
      }

      showToast(editingProduct ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!', 'success');
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setProductFormError('Erro ao conectar com o servidor.');
    } finally {
      setSavingProduct(false);
    }
  };

  // Modal Avaliações: Abrir
  const openReviewModal = (prod: ProductItem) => {
    setReviewProduct(prod);
    setReviewForm(
      prod.stores.map((s) => ({
        storeId: s.id,
        store: s.store,
        productUrl: s.productUrl,
        rating: s.rating !== null && s.rating !== undefined ? s.rating.toString() : '',
        reviewCount: s.reviewCount !== null && s.reviewCount !== undefined ? s.reviewCount.toString() : '',
      }))
    );
    setIsReviewModalOpen(true);
  };

  // Salvar Avaliações Manuais
  const handleSaveReviews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewProduct) return;

    setSavingReviews(true);
    try {
      const res = await fetch(`/api/products/${reviewProduct.id}/reviews`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: reviewForm }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Erro ao salvar avaliações', 'error');
        return;
      }

      showToast('Avaliações salvas e média propagada para os rankings!', 'success');
      setIsReviewModalOpen(false);
      fetchProducts();
    } catch {
      showToast('Erro de conexão ao salvar avaliações', 'error');
    } finally {
      setSavingReviews(false);
    }
  };

  // Modal Vínculos: Abrir
  const openLinkModal = async (prod: ProductItem) => {
    setLinkProduct(prod);
    setIsLinkModalOpen(true);
    setLoadingLinks(true);

    try {
      const res = await fetch(`/api/products/${prod.id}/rankings`);
      const data = await res.json();
      if (data) {
        setLinkedRankings(data.linkedRankings || []);
        setAvailableRankings(data.availableRankings || []);
      }
    } catch {
      showToast('Erro ao carregar rankings compatíveis', 'error');
    } finally {
      setLoadingLinks(false);
    }
  };

  // Ação Vínculo: Adicionar / Remover
  const handleToggleLink = async (rankingId: string, action: 'link' | 'unlink') => {
    if (!linkProduct) return;

    try {
      const res = await fetch(`/api/products/${linkProduct.id}/rankings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankingId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Erro ao atualizar vínculo', 'error');
        return;
      }

      showToast(action === 'link' ? 'Produto vinculado ao ranking!' : 'Vínculo removido com sucesso!', 'success');

      // Atualizar lista modal
      const resUpdated = await fetch(`/api/products/${linkProduct.id}/rankings`);
      const dataUpdated = await resUpdated.json();
      if (dataUpdated) {
        setLinkedRankings(dataUpdated.linkedRankings || []);
        setAvailableRankings(dataUpdated.availableRankings || []);
      }

      fetchProducts();
    } catch {
      showToast('Erro de conexão', 'error');
    }
  };

  // Exclusão Protegida
  const handleDeleteProduct = async (prod: ProductItem) => {
    if (!window.confirm(`Tem certeza que deseja excluir o produto "${prod.title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${prod.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Não foi possível excluir o produto.');
        showToast(data.error || 'Exclusão bloqueada', 'error');
        return;
      }

      showToast('Produto excluído com sucesso!', 'success');
      fetchProducts();
    } catch {
      showToast('Erro de conexão ao excluir', 'error');
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
            marginBottom: '24px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>
              Catálogo Central de Produtos
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Cadastre produtos, lance avaliações manuais por loja e controle os vínculos com os rankings compatíveis.
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
              title="Baixar modelo de planilha CSV pré-formatado para preenchimento"
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
              title="Importar catálogo em massa a partir de arquivo CSV"
            >
              <FileUp size={16} color="var(--brand-forest-800)" />
              <span>Importar CSV</span>
            </button>

            <button
              onClick={exportProductsToCsv}
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
              title="Exportar catálogo completo em formato CSV compatível com reimportação"
            >
              <Download size={16} color="var(--brand-forest-700)" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={openCreateProduct}
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
              }}
            >
              <Plus size={18} />
              <span>Novo Produto</span>
            </button>
          </div>
        </div>

        {/* Alerta de Produtos Desatualizados (>30 dias ou sem nota) - Seção 7.2 */}
        {needsReviewCount > 0 && (
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={22} color="#d97706" />
              <div>
                <strong style={{ color: '#92400e', fontSize: '0.92rem' }}>
                  {needsReviewCount} produto(s) precisam de revisão editorial
                </strong>
                <span style={{ color: '#b45309', fontSize: '0.82rem', display: 'block' }}>
                  Itens sem avaliações lançadas ou com mais de 30 dias desde a última checagem de notas.
                </span>
              </div>
            </div>

            <button
              onClick={() => setSortOrder('unreviewed')}
              style={{
                backgroundColor: '#b45309',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              Filtrar Pendentes
            </button>
          </div>
        )}

        {/* Barra de Filtros, Pesquisa e Ordenação */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-cream)',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Linha 1: Pesquisa e Ordenação */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px', maxWidth: '480px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  placeholder="Buscar por título, marca ou categoria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-cream)',
                    fontSize: '0.88rem',
                  }}
                />
                <Search size={16} color="var(--text-subtle)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: 'var(--brand-forest-800)',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                Buscar
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Ordenar por:
              </span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-cream)',
                  fontSize: '0.85rem',
                  backgroundColor: '#ffffff',
                  fontWeight: 600,
                  color: 'var(--brand-forest-900)',
                }}
              >
                <option value="recent">Última atualização: mais recente</option>
                <option value="oldest">Última atualização: mais antiga</option>
                <option value="unreviewed">Sem revisão primeiro</option>
                <option value="name">Nome do produto (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Linha 2: Espécies e Tipos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border-cream-light)', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-forest-800)' }}>
              Filtro:
            </span>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => { setSelectedSpecies('todos'); setSelectedType('todos'); }}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: selectedSpecies === 'todos' ? 700 : 500,
                  backgroundColor: selectedSpecies === 'todos' ? 'var(--brand-forest-800)' : 'var(--bg-cream-subtle)',
                  color: selectedSpecies === 'todos' ? '#ffffff' : 'var(--text-main)',
                }}
              >
                Todos
              </button>

              <button
                onClick={() => { setSelectedSpecies('caes'); setSelectedType('todos'); }}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: selectedSpecies === 'caes' ? 700 : 500,
                  backgroundColor: selectedSpecies === 'caes' ? '#92400e' : '#fef3c7',
                  color: selectedSpecies === 'caes' ? '#ffffff' : '#92400e',
                }}
              >
                🐕 Cães
              </button>

              <button
                onClick={() => { setSelectedSpecies('gatos'); setSelectedType('todos'); }}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: selectedSpecies === 'gatos' ? 700 : 500,
                  backgroundColor: selectedSpecies === 'gatos' ? '#3730a3' : '#e0e7ff',
                  color: selectedSpecies === 'gatos' ? '#ffffff' : '#3730a3',
                }}
              >
                🐈 Gatos
              </button>
            </div>

            {availableTypes.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedType('todos')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: selectedType === 'todos' ? 700 : 500,
                    backgroundColor: selectedType === 'todos' ? 'var(--gold-500)' : 'transparent',
                    color: selectedType === 'todos' ? '#453300' : 'var(--text-muted)',
                    border: '1px solid var(--border-cream)',
                  }}
                >
                  Todas categorias
                </button>
                {availableTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.78rem',
                      fontWeight: selectedType === t ? 700 : 500,
                      backgroundColor: selectedType === t ? 'var(--gold-500)' : 'transparent',
                      color: selectedType === t ? '#453300' : 'var(--text-muted)',
                      border: '1px solid var(--border-cream)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lista de Produtos do Catálogo */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px', gap: '10px', color: 'var(--text-muted)' }}>
            <RefreshCw size={20} className="animate-spin" />
            <span>Carregando catálogo de produtos...</span>
          </div>
        ) : products.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {products.map((prod) => {
              const needsReview = !prod.ratingUpdatedAt || isOlderThanDays(prod.ratingUpdatedAt, 30);

              return (
                <div
                  key={prod.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: needsReview ? '1px solid #fde68a' : '1px solid var(--border-cream)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    {/* Imagem + Info */}
                    <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '280px' }}>
                      <div
                        style={{
                          position: 'relative',
                          width: '72px',
                          height: '72px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-cream)',
                          overflow: 'hidden',
                          backgroundColor: '#ffffff',
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src={prod.imageUrl || (prod.species === 'caes' ? '/mascots/dog-mascot.jpg' : '/mascots/cat-mascot.jpg')}
                          alt={prod.title}
                          fill
                          sizes="72px"
                          style={{ objectFit: 'contain', padding: '4px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span className={`tag-pill ${prod.species === 'caes' ? 'tag-caes' : 'tag-gatos'}`}>
                            {prod.species === 'caes' ? '🐕 Cães' : '🐈 Gatos'}
                          </span>
                          <span className="tag-pill tag-type">
                            {prod.productType}
                          </span>
                          {prod.brand && (
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-forest-600)' }}>
                              • {prod.brand}
                            </span>
                          )}
                        </div>

                        <strong style={{ fontSize: '1.05rem', color: 'var(--brand-forest-900)' }}>
                          {prod.title}
                        </strong>

                        {prod.description && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {prod.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Média e Status de Revisão */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'block' }}>
                          Nota Média:
                        </span>
                        {prod.averageRating !== null ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-forest-900)' }}>
                            {prod.averageRating.toFixed(2)}
                            <Star size={15} fill="var(--gold-500)" color="var(--gold-600)" />
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                            Sem nota
                          </span>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'block' }}>
                          Última Revisão:
                        </span>
                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: needsReview ? '#b45309' : 'var(--text-main)',
                            backgroundColor: needsReview ? '#fef3c7' : 'transparent',
                            padding: needsReview ? '2px 6px' : '0',
                            borderRadius: '4px',
                          }}
                        >
                          {formatDate(prod.ratingUpdatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lojas e Vínculos */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border-cream-light)',
                      paddingTop: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    {/* Vínculos Ativos */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                        Rankings vinculados ({prod.rankings.length}):
                      </span>
                      {prod.rankings.length > 0 ? (
                        prod.rankings.map((r) => (
                          <span
                            key={r.rankingId}
                            style={{
                              backgroundColor: 'var(--brand-forest-50)',
                              color: 'var(--brand-forest-800)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: '1px solid var(--brand-forest-200)',
                            }}
                          >
                            {r.ranking.title}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                          Nenhum ranking vinculado
                        </span>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Lançar Avaliações */}
                      <button
                        onClick={() => openReviewModal(prod)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'var(--gold-500)',
                          color: '#453300',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        <Star size={13} fill="#453300" />
                        <span>Lançar Avaliações</span>
                      </button>

                      {/* Gerenciar Vínculos */}
                      <button
                        onClick={() => openLinkModal(prod)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'var(--bg-cream-subtle)',
                          color: 'var(--brand-forest-900)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          border: '1px solid var(--border-cream)',
                        }}
                      >
                        <LinkIcon size={13} />
                        <span>Vínculos</span>
                      </button>

                      {/* Editar Produto */}
                      <button
                        onClick={() => openEditProduct(prod)}
                        title="Editar Informações do Produto"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-cream-subtle)',
                          color: 'var(--brand-forest-900)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Excluir Produto (com verificação de segurança) */}
                      <button
                        onClick={() => handleDeleteProduct(prod)}
                        title="Excluir Produto"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#fef2f2',
                          color: '#ef4444',
                          fontSize: '0.8rem',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-cream)' }}>
            <Package size={36} color="var(--brand-forest-700)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Nenhum produto encontrado</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Tente alterar os termos de busca ou cadastre um novo produto.
            </p>
            <button
              onClick={openCreateProduct}
              style={{
                backgroundColor: 'var(--brand-forest-800)',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.88rem',
              }}
            >
              Cadastrar Produto
            </button>
          </div>
        )}

        {/* MODAL 1: CADASTRO / EDIÇÃO DE PRODUTO (Seção 7.3) */}
        {isProductModalOpen && (
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
            onClick={() => setIsProductModalOpen(false)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-cream)',
                padding: '32px',
                maxWidth: '720px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>
                {editingProduct ? 'Editar Produto do Catálogo' : 'Novo Produto'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Cadastre informações editoriais e ao menos uma loja vinculada.
              </p>

              {productFormError && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px',
                    color: '#991b1b',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{productFormError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                    Título do Produto * (3 a 220 caracteres)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={220}
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    placeholder="Ex: Ração Royal Canin Maxi Adult Cães Adultos"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-cream)', fontSize: '0.92rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                      Espécie *
                    </label>
                    <select
                      value={productForm.species}
                      onChange={(e) => setProductForm({ ...productForm, species: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-cream)', fontSize: '0.92rem', backgroundColor: '#fff' }}
                    >
                      <option value="caes">Cães</option>
                      <option value="gatos">Gatos</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                      Tipo de Produto *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={120}
                      value={productForm.productType}
                      onChange={(e) => setProductForm({ ...productForm, productType: e.target.value })}
                      placeholder="Ex: Ração seca, Areia"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-cream)', fontSize: '0.92rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                      Marca (Opcional)
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={productForm.brand}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                      placeholder="Ex: Royal Canin"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-cream)', fontSize: '0.92rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                    Descrição Pública (Opcional, até 3.000 caracteres)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={3000}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Descrição objetiva das características do produto..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-cream)', fontSize: '0.92rem', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Upload de Imagem */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
                    Imagem do Produto (Máx 5 MB, JPG/PNG/WebP)
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      style={{ fontSize: '0.85rem' }}
                    />
                    {uploadingImage && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enviando foto...</span>}
                    {productForm.imageUrl && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--brand-forest-700)', fontWeight: 600 }}>✓ Imagem configurada</span>
                    )}
                  </div>
                </div>

                {/* Lojas Vinculadas */}
                <div style={{ borderTop: '1px solid var(--border-cream-light)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--brand-forest-900)' }}>
                      Lojas Vinculadas (Ao menos 1 loja obrigatória)
                    </strong>

                    {productForm.stores.length < VALID_STORES.length && (
                      <button
                        type="button"
                        onClick={() => {
                          const existingKeys = productForm.stores.map((s) => s.store);
                          const nextStore = VALID_STORES.find((k) => !existingKeys.includes(k)) || 'amazon';
                          setProductForm({
                            ...productForm,
                            stores: [...productForm.stores, { store: nextStore, productUrl: '', affiliateUrl: '', rating: '', reviewCount: '' }],
                          });
                        }}
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--brand-forest-800)',
                          fontWeight: 700,
                          backgroundColor: 'var(--brand-forest-50)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        + Adicionar Loja
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {productForm.stores.map((st, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'var(--bg-cream-subtle)',
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-cream)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <select
                            value={st.store}
                            onChange={(e) => {
                              const updated = [...productForm.stores];
                              updated[idx].store = e.target.value;
                              setProductForm({ ...productForm, stores: updated });
                            }}
                            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-cream)', fontWeight: 700 }}
                          >
                            {VALID_STORES.map((k) => (
                              <option key={k} value={k}>
                                {getStoreInfo(k)?.name || k}
                              </option>
                            ))}
                          </select>

                          {productForm.stores.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = productForm.stores.filter((_, i) => i !== idx);
                                setProductForm({ ...productForm, stores: updated });
                              }}
                              style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              Remover loja
                            </button>
                          )}
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>URL do Produto *</label>
                          <input
                            type="url"
                            required
                            placeholder="https://..."
                            value={st.productUrl}
                            onChange={(e) => {
                              const updated = [...productForm.stores];
                              updated[idx].productUrl = e.target.value;
                              setProductForm({ ...productForm, stores: updated });
                            }}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-cream)', fontSize: '0.85rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>URL de Afiliado (Opcional - destino prioritário do botão)</label>
                          <input
                            type="url"
                            placeholder="https://..."
                            value={st.affiliateUrl}
                            onChange={(e) => {
                              const updated = [...productForm.stores];
                              updated[idx].affiliateUrl = e.target.value;
                              setProductForm({ ...productForm, stores: updated });
                            }}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-cream)', fontSize: '0.85rem' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    style={{ padding: '10px 20px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-cream)', fontWeight: 600, fontSize: '0.88rem' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingProduct}
                    style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--brand-forest-800)', color: '#ffffff', fontWeight: 700, fontSize: '0.88rem', opacity: savingProduct ? 0.7 : 1 }}
                  >
                    {savingProduct ? 'Salvando...' : 'Salvar Produto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: LANÇAMENTO MANUAL DE AVALIAÇÕES (Seção 7.5) */}
        {isReviewModalOpen && reviewProduct && (
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
            onClick={() => setIsReviewModalOpen(false)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-cream)',
                padding: '32px',
                maxWidth: '640px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '1.35rem', marginBottom: '4px' }}>
                Lançamento Manual de Avaliações
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--brand-forest-800)', fontWeight: 700, marginBottom: '16px' }}>
                {reviewProduct.title}
              </p>
              {/* Banner de Média em Tempo Real (admin-dashboard-engineer) */}
              <div
                style={{
                  backgroundColor: 'var(--brand-forest-50)',
                  border: '1.5px solid var(--brand-forest-200)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Star size={22} fill="var(--gold-500)" color="var(--gold-600)" />
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--brand-forest-900)', fontWeight: 700, display: 'block' }}>
                      Nova Média Calculada em Tempo Real:
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Baseada em {reviewForm.filter((rf) => !isNaN(parseFloat(rf.rating)) && parseFloat(rf.rating) >= 0).length} loja(s) com notas válidas
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--brand-forest-900)', fontFamily: 'var(--font-serif)' }}>
                  {liveAverage !== null ? `${liveAverage.toFixed(2)} ★` : '—'}
                </div>
              </div>

              <form onSubmit={handleSaveReviews} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviewForm.map((rf, idx) => {
                  const storeInfo = getStoreInfo(rf.store);
                  return (
                    <div
                      key={rf.storeId}
                      style={{
                        backgroundColor: 'var(--bg-cream-subtle)',
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-cream)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--brand-forest-900)' }}>
                          {storeInfo?.name || rf.store}
                        </strong>

                        <a
                          href={rf.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                            color: 'var(--brand-forest-700)',
                            textDecoration: 'underline',
                          }}
                        >
                          <span>Abrir página na loja</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                            Nota Manual (0.0 a 5.0)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            placeholder="Ex: 4.8"
                            value={rf.rating}
                            onChange={(e) => {
                              const updated = [...reviewForm];
                              updated[idx].rating = e.target.value;
                              setReviewForm(updated);
                            }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-cream)', fontSize: '0.9rem' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-forest-900)', marginBottom: '4px' }}>
                            Qtd. Avaliações (Opcional - desempate)
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="Ex: 1420"
                            value={rf.reviewCount}
                            onChange={(e) => {
                              const updated = [...reviewForm];
                              updated[idx].reviewCount = e.target.value;
                              setReviewForm(updated);
                            }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-cream)', fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    style={{ padding: '10px 20px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-cream)', fontWeight: 600, fontSize: '0.88rem' }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={savingReviews}
                    style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--brand-forest-800)', color: '#ffffff', fontWeight: 700, fontSize: '0.88rem', opacity: savingReviews ? 0.7 : 1 }}
                  >
                    {savingReviews ? 'Gravando e recalculando...' : 'Salvar Avaliações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: GERENCIAR VÍNCULOS COM RANKINGS COMPATÍVEIS (Seção 7.4) */}
        {isLinkModalOpen && linkProduct && (
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
            onClick={() => setIsLinkModalOpen(false)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-cream)',
                padding: '32px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: '1.35rem', marginBottom: '4px' }}>
                Gerenciar Vínculos de Ranking
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--brand-forest-800)', fontWeight: 700, marginBottom: '6px' }}>
                {linkProduct.title}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Compatibilidade: <strong>{linkProduct.species === 'caes' ? 'Cães' : 'Gatos'} • {linkProduct.productType}</strong>
              </p>

              {loadingLinks ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Carregando rankings...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Rankings Vinculados Atualmente */}
                  <div>
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', color: 'var(--brand-forest-900)' }}>
                      Rankings em que participa ({linkedRankings.length}):
                    </h3>
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
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#166534' }}>
                              {rk.title}
                            </span>
                            <button
                              onClick={() => handleToggleLink(rk.id, 'unlink')}
                              style={{
                                color: '#ef4444',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #fecaca',
                              }}
                            >
                              Remover Vínculo
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                        Este produto ainda não participa de nenhum ranking.
                      </p>
                    )}
                  </div>

                  {/* Rankings Disponíveis Compatíveis */}
                  <div style={{ borderTop: '1px solid var(--border-cream-light)', paddingTop: '16px' }}>
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', color: 'var(--brand-forest-900)' }}>
                      Rankings compatíveis disponíveis ({availableRankings.length}):
                    </h3>
                    {availableRankings.length > 0 ? (
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
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                              {rk.title}
                            </span>
                            <button
                              onClick={() => handleToggleLink(rk.id, 'link')}
                              style={{
                                backgroundColor: 'var(--brand-forest-800)',
                                color: '#ffffff',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: 'var(--radius-full)',
                              }}
                            >
                              + Vincular
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                        Não há outros rankings compatíveis para esta espécie e categoria. Crie um novo ranking na aba &quot;Rankings&quot;.
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      onClick={() => setIsLinkModalOpen(false)}
                      style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--brand-forest-800)', color: '#ffffff', fontWeight: 600, fontSize: '0.88rem' }}
                    >
                      Concluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 4: IMPORTAÇÃO DE PRODUTOS EM CSV (admin-dashboard-engineer) */}
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
            onClick={() => {
              if (!importing) setIsImportModalOpen(false);
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                border: '1.5px solid var(--border-cream)',
                padding: '32px',
                maxWidth: '820px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-xl)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header do Modal */}
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
                    <h2 style={{ fontSize: '1.4rem', color: 'var(--brand-forest-900)' }}>
                      Importação de Catálogo em Lote (CSV)
                    </h2>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Cadastre ou atualize múltiplos produtos e notas simultaneamente via planilha.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
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

              {/* Botão de Ajuda para Baixar o Modelo */}
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
                  Precisa de um arquivo de exemplo? Baixe nosso modelo pré-formatado com todas as colunas necessárias.
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
                  id="csv-file-input"
                  accept=".csv,text/csv,application/vnd.ms-excel"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="csv-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Upload size={32} color="var(--brand-forest-700)" />
                  <span style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--brand-forest-900)' }}>
                    {importFile ? `Arquivo selecionado: ${importFile.name}` : 'Clique para selecionar o arquivo CSV ou arraste aqui'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Formato .csv codificado em UTF-8 (separado por vírgula ou ponto-e-vírgula)
                  </span>
                </label>
              </div>

              {/* Pré-visualização dos Registros */}
              {parsedPreview.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--brand-forest-900)' }}>
                      Pré-visualização dos Dados ({parsedPreview.length} produtos encontrados):
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
                          <th style={{ padding: '8px 12px' }}>Marca</th>
                          <th style={{ padding: '8px 12px' }}>Espécie</th>
                          <th style={{ padding: '8px 12px' }}>Tipo</th>
                          <th style={{ padding: '8px 12px' }}>Lojas Preenchidas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPreview.slice(0, 10).map((row, idx) => {
                          const title = row.titulo || row.title || '—';
                          const brand = row.marca || row.brand || '—';
                          const species = row.especie || row.species || '—';
                          const pType = row.tipo_produto || row.productType || row.tipo || '—';

                          const storesCount = ['amazon', 'petlove', 'cobasi', 'mercadolivre', 'shopee'].filter(
                            (k) => (row[`${k}_url`] || row[`${k}Url`] || '').trim().length > 0
                          ).length;

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-cream-light)' }}>
                              <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--brand-forest-900)' }}>{title}</td>
                              <td style={{ padding: '8px 12px' }}>{brand}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ textTransform: 'capitalize', color: species.includes('gato') ? 'var(--cat-accent-text)' : 'var(--dog-accent-text)' }}>
                                  {species}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px' }}>{pType}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ backgroundColor: 'var(--brand-forest-50)', color: 'var(--brand-forest-800)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                  {storesCount} loja(s)
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
                    boxShadow: 'var(--shadow-emerald)',
                  }}
                >
                  {importing ? 'Importando e recalculando...' : `Confirmar e Importar (${parsedPreview.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '64px', textAlign: 'center' }}>Carregando catálogo...</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}
