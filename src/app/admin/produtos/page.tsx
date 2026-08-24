'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Package, Plus, Edit2, Star, Link as LinkIcon, Trash2,
  AlertTriangle, AlertCircle, ExternalLink,
  Upload, X, Search, Filter, Download, FileSpreadsheet, FileDown, FileUp
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatDate, isOlderThanDays, VALID_STORES, getStoreInfo } from '@/lib/utils';
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

  // Modal Rápido de Avaliações
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<ProductItem | null>(null);
  const [reviewForm, setReviewForm] = useState<Array<{ storeId: string; store: string; productUrl: string; rating: string; reviewCount: string }>>([]);
  const [savingReviews, setSavingReviews] = useState(false);

  // Modal Rápido de Vínculos
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkProduct, setLinkProduct] = useState<ProductItem | null>(null);
  const [linkedRankings, setLinkedRankings] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [availableRankings, setAvailableRankings] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Média aritmética calculada em tempo real no modal rápido
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

  // Exportação do Catálogo para CSV
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

  const availableTypes = useMemo(() => {
    const relevant = selectedSpecies === 'todos' ? products : products.filter((p) => p.species === selectedSpecies);
    return Array.from(new Set(relevant.map((p) => p.productType))).filter(Boolean);
  }, [products, selectedSpecies]);

  // Modal Rápido de Avaliações
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

      showToast('Avaliações salvas e média recalculada com sucesso!', 'success');
      setIsReviewModalOpen(false);
      fetchProducts();
    } catch {
      showToast('Erro de conexão ao salvar avaliações', 'error');
    } finally {
      setSavingReviews(false);
    }
  };

  // Modal Rápido de Vínculos
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
              Cadastre produtos em tela cheia, lance avaliações por loja e controle os vínculos com os rankings compatíveis.
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

            {/* Novo Produto -> Redireciona para /admin/produtos/novo */}
            <Link
              href="/admin/produtos/novo"
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
              <span>Novo Produto</span>
            </Link>
          </div>
        </div>

        {/* Alerta de Produtos Desatualizados */}
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
                border: 'none',
                cursor: 'pointer',
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
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Espécie */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => { setSelectedSpecies('todos'); setSelectedType('todos'); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  backgroundColor: selectedSpecies === 'todos' ? 'var(--brand-forest-800)' : 'var(--bg-cream-subtle)',
                  color: selectedSpecies === 'todos' ? '#ffffff' : 'var(--brand-forest-900)',
                  border: '1px solid var(--border-cream)',
                  cursor: 'pointer',
                }}
              >
                Todas as Espécies
              </button>
              <button
                onClick={() => { setSelectedSpecies('caes'); setSelectedType('todos'); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  backgroundColor: selectedSpecies === 'caes' ? 'var(--brand-forest-800)' : 'var(--bg-cream-subtle)',
                  color: selectedSpecies === 'caes' ? '#ffffff' : 'var(--brand-forest-900)',
                  border: '1px solid var(--border-cream)',
                  cursor: 'pointer',
                }}
              >
                🐕 Cães
              </button>
              <button
                onClick={() => { setSelectedSpecies('gatos'); setSelectedType('todos'); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  backgroundColor: selectedSpecies === 'gatos' ? 'var(--brand-forest-800)' : 'var(--bg-cream-subtle)',
                  color: selectedSpecies === 'gatos' ? '#ffffff' : 'var(--brand-forest-900)',
                  border: '1px solid var(--border-cream)',
                  cursor: 'pointer',
                }}
              >
                🐈 Gatos
              </button>
            </div>

            {/* Ordenação */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Ordenar:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-cream)',
                  fontSize: '0.82rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="recent">Mais Recentes</option>
                <option value="oldest">Mais Antigos</option>
                <option value="unreviewed">Pendentes de Revisão</option>
                <option value="name">Ordem Alfabética</option>
              </select>
            </div>
          </div>

          {/* Linha 2: Busca e Filtro de Tipo */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
              <input
                type="text"
                placeholder="Buscar por título, marca ou categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-cream)',
                  fontSize: '0.88rem',
                }}
              />
            </form>

            {availableTypes.length > 0 && (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-cream)',
                  fontSize: '0.85rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="todos">Todos os Tipos ({availableTypes.length})</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Listagem de Produtos */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
            Carregando catálogo de produtos...
          </div>
        ) : products.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {products.map((prod) => {
              const needsReview = !prod.ratingUpdatedAt || isOlderThanDays(prod.ratingUpdatedAt, 30);

              return (
                <div
                  key={prod.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-cream)',
                    padding: '18px 24px',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    transition: 'var(--transition)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    {/* Imagem e Dados Principais */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1, minWidth: '280px' }}>
                      <Link
                        href={`/admin/produtos/${prod.id}/editar`}
                        style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-cream)',
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          flexShrink: 0,
                          textDecoration: 'none',
                        }}
                      >
                        {prod.imageUrl ? (
                          <Image
                            src={prod.imageUrl}
                            alt={prod.title}
                            fill
                            sizes="72px"
                            style={{ objectFit: 'contain', padding: '4px' }}
                          />
                        ) : (
                          <Package size={28} color="#94a3b8" />
                        )}
                      </Link>

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

                        <Link
                          href={`/admin/produtos/${prod.id}/editar`}
                          style={{
                            fontSize: '1.05rem',
                            color: 'var(--brand-forest-950)',
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          {prod.title}
                        </Link>

                        {prod.description && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
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
                      {/* Lançar Avaliações (Rápido) */}
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
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Star size={13} fill="#453300" />
                        <span>Lançar Avaliações</span>
                      </button>

                      {/* Gerenciar Vínculos (Rápido) */}
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
                          cursor: 'pointer',
                        }}
                      >
                        <LinkIcon size={13} />
                        <span>Vínculos</span>
                      </button>

                      {/* Editar Produto (Página Dedicada) */}
                      <Link
                        href={`/admin/produtos/${prod.id}/editar`}
                        title="Editar Informações do Produto em Tela Dedicada"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-cream-subtle)',
                          color: 'var(--brand-forest-900)',
                          fontSize: '0.8rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          textDecoration: 'none',
                          border: '1px solid var(--border-cream)',
                        }}
                      >
                        <Edit2 size={14} />
                      </Link>

                      {/* Excluir Produto */}
                      <button
                        onClick={() => handleDeleteProduct(prod)}
                        title="Excluir Produto"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#fef2f2',
                          color: '#ef4444',
                          fontSize: '0.8rem',
                          border: '1px solid #fecaca',
                          cursor: 'pointer',
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
            <Link
              href="/admin/produtos/novo"
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
              <span>Cadastrar Produto</span>
            </Link>
          </div>
        )}

        {/* MODAL 2: LANÇAMENTO MANUAL RÁPIDO DE AVALIAÇÕES (Sem fechamento acidental por backdrop) */}
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
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
                  Lançamento de Avaliações
                </h2>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '4px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--brand-forest-800)', fontWeight: 700, marginBottom: '16px' }}>
                {reviewProduct.title}
              </p>

              {/* Banner de Média em Tempo Real */}
              <div
                style={{
                  backgroundColor: 'var(--brand-forest-50)',
                  border: '1.5px solid var(--brand-forest-200)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
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

                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--brand-forest-900)' }}>
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
                            Qtd. Avaliações (Desempate)
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
                    style={{ padding: '10px 20px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-cream)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={savingReviews}
                    style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--brand-forest-800)', color: '#ffffff', fontWeight: 700, fontSize: '0.88rem', opacity: savingReviews ? 0.7 : 1, border: 'none', cursor: 'pointer' }}
                  >
                    {savingReviews ? 'Gravando...' : 'Salvar Avaliações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: GERENCIAR VÍNCULOS COM RANKINGS (Sem fechamento acidental por backdrop) */}
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
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
                  Vínculos de Ranking
                </h2>
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '4px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
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
                                cursor: 'pointer',
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
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              + Vincular
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                        Não há outros rankings compatíveis para esta espécie e categoria.
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      onClick={() => setIsLinkModalOpen(false)}
                      style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--brand-forest-800)', color: '#ffffff', fontWeight: 600, fontSize: '0.88rem', border: 'none', cursor: 'pointer' }}
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 4: IMPORTAÇÃO DE PRODUTOS EM CSV (Sem fechamento acidental por backdrop) */}
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
                maxWidth: '820px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                boxShadow: 'var(--shadow-xl)',
              }}
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
                    <h2 style={{ fontSize: '1.4rem', color: 'var(--brand-forest-900)', margin: 0 }}>
                      Importação de Catálogo em Lote (CSV)
                    </h2>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Cadastre ou atualize múltiplos produtos e notas simultaneamente via planilha.
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
                    border: 'none',
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
