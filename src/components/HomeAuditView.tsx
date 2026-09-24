'use client';

import React, { useState, useMemo, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import {
  Stethoscope,
  PawPrint,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface ProductItemData {
  id: string;
  slug: string;
  commercialName: string;
  brand: string;
  manufacturerLegalName?: string;
  legalCategory: string;
  species: string;
  lifeStage: string;
  breedSize: string;
  foodType: string;
  coadjuvanteCondition?: string | null;
  sourceUrl?: string;
  sourceArchiveUrl?: string | null;
  sourceDocumentUrl?: string | null;
  analyzedBatch?: string | null;
  labelCollectionDate: string | Date;
  frontLabelImageUrl?: string | null;
  backLabelImageUrl?: string | null;
  moistureMaxPct: number;
  crudeProteinMinPct: number;
  etherExtractMinPct: number;
  crudeFiberMaxPct: number;
  mineralMatterMaxPct: number;
  calciumMinPct: number;
  calciumMaxPct?: number | null;
  phosphorusMinPct: number;
  sodiumMinPct?: number | null;
  omega3MinPct?: number | null;
  meatClaimType: string;
  containsGmo: boolean;
  gmoIngredients?: string | null;
  antioxidantType: string;
  topIngredients: string;
  editorialOpinion?: string | null;
  scoreTotal: number | null;
  classificationTier: string;
  scoreBreakdown?: any;
  affiliateLinks?: Array<{
    store: string;
    productUrl: string;
    affiliateUrl?: string | null;
  }>;
}

interface HomeAuditViewProps {
  initialProducts: ProductItemData[];
}

type SegmentType = 'caes' | 'gatos' | 'prescricao';

export default function HomeAuditView({ initialProducts = [] }: HomeAuditViewProps) {
  // Seletor de Segmento Principal (Pílula Central: Cães | Gatos | Prescrição)
  const [activeSegment, setActiveSegment] = useState<SegmentType>('caes');

  // Campo de Busca Omni Central
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtros Sutis em Chips
  const [selectedLifeStage, setSelectedLifeStage] = useState<string>('TODOS');
  const [selectedFoodType, setSelectedFoodType] = useState<string>('TODOS');
  const [selectedTier, setSelectedTier] = useState<string>('TODOS');
  const [selectedPrescriptionCondition, setSelectedPrescriptionCondition] = useState<string>('TODOS');
  const [selectedPrescriptionSpecies, setSelectedPrescriptionSpecies] = useState<'TODOS' | 'CAO' | 'GATO'>('TODOS');
  const [onlyNaturalAntioxidants, setOnlyNaturalAntioxidants] = useState<boolean>(false);
  const [onlyGmoFree, setOnlyGmoFree] = useState<boolean>(false);

  // Paginação
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Contadores para o Seletor Central
  const dogCount = useMemo(
    () => initialProducts.filter((p) => p.species === 'CAO' && p.legalCategory !== 'ALIMENTO_COADJUVANTE').length,
    [initialProducts]
  );
  const catCount = useMemo(
    () => initialProducts.filter((p) => p.species === 'GATO' && p.legalCategory !== 'ALIMENTO_COADJUVANTE').length,
    [initialProducts]
  );
  const prescricaoCount = useMemo(
    () => initialProducts.filter((p) => p.legalCategory === 'ALIMENTO_COADJUVANTE').length,
    [initialProducts]
  );

  const [isRestored, setIsRestored] = useState<boolean>(false);

  // 1. Restaurar filtros e paginação da URL ou do sessionStorage ao carregar
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();

      let saved: any = null;
      const rawSaved = sessionStorage.getItem('petrankings_catalog_filters');
      if (rawSaved) {
        try {
          saved = JSON.parse(rawSaved);
        } catch {}
      }

      // Segmento: URL param > Hash > sessionStorage
      const segParam = searchParams.get('aba') || (hash ? hash.replace('#', '') : null) || saved?.segment;
      if (segParam === 'caes' || segParam === 'gatos' || segParam === 'prescricao') {
        setActiveSegment(segParam);
      }

      // Busca
      const qParam = searchParams.get('busca') ?? saved?.searchQuery;
      if (qParam !== undefined && qParam !== null) {
        setSearchQuery(qParam);
      }

      // Chips de Filtro
      const faseParam = searchParams.get('fase') ?? saved?.selectedLifeStage;
      if (faseParam) setSelectedLifeStage(faseParam);

      const formatoParam = searchParams.get('formato') ?? saved?.selectedFoodType;
      if (formatoParam) setSelectedFoodType(formatoParam);

      const faixaParam = searchParams.get('faixa') ?? saved?.selectedTier;
      if (faixaParam) setSelectedTier(faixaParam);

      const condParam = searchParams.get('condicao') ?? saved?.selectedPrescriptionCondition;
      if (condParam) setSelectedPrescriptionCondition(condParam);

      const espPrescParam = searchParams.get('esp_presc') ?? saved?.selectedPrescriptionSpecies;
      if (espPrescParam === 'TODOS' || espPrescParam === 'CAO' || espPrescParam === 'GATO') {
        setSelectedPrescriptionSpecies(espPrescParam);
      }

      const natParam = searchParams.get('nat') !== null ? searchParams.get('nat') === '1' : saved?.onlyNaturalAntioxidants;
      if (natParam !== undefined) setOnlyNaturalAntioxidants(Boolean(natParam));

      const gmoParam = searchParams.get('gmo_free') !== null ? searchParams.get('gmo_free') === '1' : saved?.onlyGmoFree;
      if (gmoParam !== undefined) setOnlyGmoFree(Boolean(gmoParam));

      // Quantidade de itens por página
      const itensParam = searchParams.get('itens') ? Number(searchParams.get('itens')) : saved?.itemsPerPage;
      if (itensParam && [12, 24, 48].includes(Number(itensParam))) {
        setItemsPerPage(Number(itensParam));
      }

      // Página atual
      const pParam = searchParams.get('p') ? Number(searchParams.get('p')) : saved?.currentPage;
      if (pParam && Number(pParam) >= 1) {
        setCurrentPage(Number(pParam));
      }
    } catch (e) {
      console.error('Erro ao restaurar filtros salvos:', e);
    } finally {
      setIsRestored(true);
    }
  }, []);

  // 2. Persistir filtros e paginação no sessionStorage e na URL sempre que houver alteração
  useEffect(() => {
    if (!isRestored || typeof window === 'undefined') return;

    const stateToSave = {
      segment: activeSegment,
      searchQuery,
      selectedLifeStage,
      selectedFoodType,
      selectedTier,
      selectedPrescriptionCondition,
      selectedPrescriptionSpecies,
      onlyNaturalAntioxidants,
      onlyGmoFree,
      itemsPerPage,
      currentPage,
    };

    try {
      sessionStorage.setItem('petrankings_catalog_filters', JSON.stringify(stateToSave));
    } catch {}

    // Sincronizar parâmetros na URL sem recarregar a página
    const params = new URLSearchParams();
    if (activeSegment !== 'caes') params.set('aba', activeSegment);
    if (searchQuery.trim()) params.set('busca', searchQuery.trim());
    if (selectedLifeStage !== 'TODOS') params.set('fase', selectedLifeStage);
    if (selectedFoodType !== 'TODOS') params.set('formato', selectedFoodType);
    if (selectedTier !== 'TODOS') params.set('faixa', selectedTier);
    if (selectedPrescriptionCondition !== 'TODOS') params.set('condicao', selectedPrescriptionCondition);
    if (selectedPrescriptionSpecies !== 'TODOS') params.set('esp_presc', selectedPrescriptionSpecies);
    if (onlyNaturalAntioxidants) params.set('nat', '1');
    if (onlyGmoFree) params.set('gmo_free', '1');
    if (itemsPerPage !== 12) params.set('itens', String(itemsPerPage));
    if (currentPage > 1) params.set('p', String(currentPage));

    const qs = params.toString();
    const newUrl = qs ? `?${qs}#${activeSegment}` : `#${activeSegment}`;
    window.history.replaceState(null, '', newUrl);
  }, [
    isRestored,
    activeSegment,
    searchQuery,
    selectedLifeStage,
    selectedFoodType,
    selectedTier,
    selectedPrescriptionCondition,
    selectedPrescriptionSpecies,
    onlyNaturalAntioxidants,
    onlyGmoFree,
    itemsPerPage,
    currentPage,
  ]);

  const handleSegmentChange = (seg: SegmentType) => {
    setActiveSegment(seg);
    setCurrentPage(1);
  };

  // Verificação de filtros ativos
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedLifeStage !== 'TODOS' ||
    selectedFoodType !== 'TODOS' ||
    selectedTier !== 'TODOS' ||
    selectedPrescriptionCondition !== 'TODOS' ||
    selectedPrescriptionSpecies !== 'TODOS' ||
    onlyNaturalAntioxidants ||
    onlyGmoFree;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLifeStage('TODOS');
    setSelectedFoodType('TODOS');
    setSelectedTier('TODOS');
    setSelectedPrescriptionCondition('TODOS');
    setSelectedPrescriptionSpecies('TODOS');
    setOnlyNaturalAntioxidants(false);
    setOnlyGmoFree(false);
    setCurrentPage(1);
    try {
      sessionStorage.removeItem('petrankings_catalog_filters');
    } catch {}
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${activeSegment}`);
    }
  };

  // Filtragem dos produtos
  const filteredProducts = useMemo(() => {
    return (initialProducts || []).filter((p) => {
      // 1. Segmentação Primária
      if (activeSegment === 'caes') {
        if (p.species !== 'CAO') return false;
        if (p.legalCategory === 'ALIMENTO_COADJUVANTE') return false;
      } else if (activeSegment === 'gatos') {
        if (p.species !== 'GATO') return false;
        if (p.legalCategory === 'ALIMENTO_COADJUVANTE') return false;
      } else if (activeSegment === 'prescricao') {
        if (p.legalCategory !== 'ALIMENTO_COADJUVANTE') return false;
        if (
          selectedPrescriptionSpecies !== 'TODOS' &&
          p.species !== selectedPrescriptionSpecies &&
          p.species !== 'CAO_E_GATO'
        ) {
          return false;
        }
        if (selectedPrescriptionCondition !== 'TODOS') {
          const cond = (p.coadjuvanteCondition || '').toUpperCase();
          if (!cond.includes(selectedPrescriptionCondition.toUpperCase())) {
            return false;
          }
        }
      }

      // 2. Busca Omni
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.commercialName.toLowerCase().includes(q);
        const matchBrand = p.brand.toLowerCase().includes(q);
        const matchIngredients = p.topIngredients.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchIngredients) return false;
      }

      // 3. Faixa de Classificação
      if (activeSegment !== 'prescricao' && selectedTier !== 'TODOS') {
        const t = p.classificationTier;
        if (selectedTier === 'NIVEL_OURO' || selectedTier === 'SUPER_PREMIUM') {
          if (t !== 'NIVEL_OURO' && t !== 'SUPER_PREMIUM') return false;
        } else if (selectedTier === 'NIVEL_PRATA' || selectedTier === 'PREMIUM_ESPECIAL') {
          if (t !== 'NIVEL_PRATA' && t !== 'PREMIUM_ESPECIAL') return false;
        } else if (selectedTier === 'NIVEL_BRONZE' || selectedTier === 'ECONOMICO') {
          if (t !== 'NIVEL_BRONZE' && t !== 'ECONOMICO') return false;
        } else if (
          selectedTier === 'SOB_OBSERVACAO' ||
          selectedTier === 'PARAMETRO_LIMITROFE' ||
          selectedTier === 'NAO_CONFORME'
        ) {
          if (t !== 'SOB_OBSERVACAO' && t !== 'PARAMETRO_LIMITROFE' && t !== 'NAO_CONFORME') return false;
        } else if (t !== selectedTier) {
          return false;
        }
      }

      // 4. Fase da Vida (Idade)
      if (selectedLifeStage !== 'TODOS') {
        if (selectedLifeStage === 'ADULTO') {
          const isAdulto = p.lifeStage === 'ADULTO' || p.lifeStage === 'ADULTO_MANUTENCAO';
          if (!isAdulto) return false;
        } else if (selectedLifeStage === 'FILHOTE') {
          const isFilhote =
            p.lifeStage === 'CRESCIMENTO_INICIAL' ||
            p.lifeStage === 'CRESCIMENTO_FINAL' ||
            p.lifeStage === 'FILHOTE';
          if (!isFilhote) return false;
        } else if (selectedLifeStage === 'SENIOR') {
          if (p.lifeStage !== 'SENIOR') return false;
        }
      }

      // 5. Formato (Seco vs Úmido)
      if (selectedFoodType !== 'TODOS') {
        if (p.foodType !== selectedFoodType) return false;
      }

      // 6. Antioxidantes Naturais
      if (onlyNaturalAntioxidants && p.antioxidantType !== 'NATURAL') {
        return false;
      }

      // 7. Sem Transgênicos
      if (onlyGmoFree && p.containsGmo) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Ordenação neutra: pontuação técnica decrescente, desempate alfabético
      const scoreA = a.scoreTotal ?? -1;
      const scoreB = b.scoreTotal ?? -1;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return a.commercialName.localeCompare(b.commercialName, 'pt-BR');
    });
  }, [
    initialProducts,
    activeSegment,
    searchQuery,
    selectedTier,
    selectedLifeStage,
    selectedFoodType,
    selectedPrescriptionCondition,
    selectedPrescriptionSpecies,
    onlyNaturalAntioxidants,
    onlyGmoFree,
  ]);

  // Paginação
  const totalPages = itemsPerPage > 0 ? Math.ceil(filteredProducts.length / itemsPerPage) : 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

  const startIndex = itemsPerPage > 0 ? (safeCurrentPage - 1) * itemsPerPage : 0;
  const endIndex = itemsPerPage > 0 ? Math.min(startIndex + itemsPerPage, filteredProducts.length) : filteredProducts.length;

  const paginatedProducts = useMemo(() => {
    return itemsPerPage > 0 ? filteredProducts.slice(startIndex, endIndex) : filteredProducts;
  }, [filteredProducts, itemsPerPage, startIndex, endIndex]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    const el = document.getElementById('catalogo-produtos');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    if (safeCurrentPage > 3) {
      pages.push('...');
    }
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (safeCurrentPage < totalPages - 2) {
      pages.push('...');
    }
    pages.push(totalPages);
    return pages;
  };

  return (
    <div id="catalogo-produtos" style={{ display: 'flex', flexDirection: 'column', scrollMarginTop: '80px' }}>
      {/* SEÇÃO CENTRAL OMNI — CONCEITO 1 (APROVADO) */}
      <div className="omni-search-section">
        {/* Seletor Central em Pílula (Dogs | Cats | Veterinary Diet) */}
        <div className="omni-segment-bar" role="tablist" aria-label="Segmento de Alimento">
          <button
            type="button"
            role="tab"
            aria-selected={activeSegment === 'caes'}
            onClick={() => handleSegmentChange('caes')}
            className={`omni-segment-pill ${activeSegment === 'caes' ? 'active' : ''}`}
          >
            <span>🐶 Cães</span>
            <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>({dogCount})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSegment === 'gatos'}
            onClick={() => handleSegmentChange('gatos')}
            className={`omni-segment-pill ${activeSegment === 'gatos' ? 'active' : ''}`}
          >
            <span>🐱 Gatos</span>
            <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>({catCount})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSegment === 'prescricao'}
            onClick={() => handleSegmentChange('prescricao')}
            className={`omni-segment-pill ${activeSegment === 'prescricao' ? 'active vet' : ''}`}
          >
            <Stethoscope size={15} />
            <span>Prescrição Veterinária</span>
            <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>({prescricaoCount})</span>
          </button>
        </div>

        {/* Único Campo de Busca Omni da Tela */}
        <div className="omni-search-wrapper">
          <Search size={20} className="omni-search-icon" />
          <input
            type="search"
            placeholder={
              activeSegment === 'caes'
                ? 'Buscar ração para cães por marca (Premier, Royal Canin, Guabi...) ou ingrediente...'
                : activeSegment === 'gatos'
                ? 'Buscar ração para gatos por marca (Royal Canin, Farmina, GranPlus...) ou ingrediente...'
                : 'Buscar por indicação clínica (Renal, Urinário, Obesidade) ou marca...'
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="omni-search-input"
            aria-label="Buscar alimentos avaliados"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="omni-search-clear"
              title="Limpar busca"
            >
              ✕
            </button>
          )}
        </div>

        {/* Chips Sutis de Atalho Logo Abaixo da Busca */}
        <div className="omni-chips-row">
          {activeSegment === 'prescricao' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedPrescriptionSpecies(selectedPrescriptionSpecies === 'CAO' ? 'TODOS' : 'CAO');
                  setCurrentPage(1);
                }}
                className={`omni-chip-btn ${selectedPrescriptionSpecies === 'CAO' ? 'active' : ''}`}
              >
                🐶 Cães
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPrescriptionSpecies(selectedPrescriptionSpecies === 'GATO' ? 'TODOS' : 'GATO');
                  setCurrentPage(1);
                }}
                className={`omni-chip-btn ${selectedPrescriptionSpecies === 'GATO' ? 'active' : ''}`}
              >
                🐱 Gatos
              </button>
              {[
                { id: 'RENAL', label: 'Suporte Renal' },
                { id: 'URINARIO', label: 'Trato Urinário' },
                { id: 'OBESIDADE', label: 'Obesidade & Diabetes' },
                { id: 'GASTRO', label: 'Gastrointestinal' },
                { id: 'HIPOALERGENICO', label: 'Hipoalergênico' },
                { id: 'RECUPERACAO', label: 'Recuperação & Convalescença' },
              ].map((cond) => (
                <button
                  key={cond.id}
                  type="button"
                  onClick={() => {
                    setSelectedPrescriptionCondition(
                      selectedPrescriptionCondition === cond.id ? 'TODOS' : cond.id
                    );
                    setCurrentPage(1);
                  }}
                  className={`omni-chip-btn ${selectedPrescriptionCondition === cond.id ? 'active' : ''}`}
                >
                  {cond.label}
                </button>
              ))}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedFoodType(selectedFoodType === 'SECO' ? 'TODOS' : 'SECO');
                  setCurrentPage(1);
                }}
                className={`omni-chip-btn ${selectedFoodType === 'SECO' ? 'active' : ''}`}
              >
                🥣 Ração Seca
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFoodType(selectedFoodType === 'UMIDO' ? 'TODOS' : 'UMIDO');
                  setCurrentPage(1);
                }}
                className={`omni-chip-btn ${selectedFoodType === 'UMIDO' ? 'active' : ''}`}
              >
                🥫 Sachê / Úmido
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedLifeStage(selectedLifeStage === 'FILHOTE' ? 'TODOS' : 'FILHOTE');
                  setCurrentPage(1);
                }}
                className={`omni-chip-btn ${selectedLifeStage === 'FILHOTE' ? 'active' : ''}`}
              >
                🍼 Filhotes
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedLifeStage(selectedLifeStage === 'ADULTO' ? 'TODOS' : 'ADULTO');
                  setCurrentPage(1);
                }}
                className={`omni-chip-btn ${selectedLifeStage === 'ADULTO' ? 'active' : ''}`}
              >
                {activeSegment === 'gatos' ? '🐈 Adultos & Castrados' : '🐕 Adultos'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedLifeStage(selectedLifeStage === 'SENIOR' ? 'TODOS' : 'SENIOR');
                  setCurrentPage(1);
                }}
                className={`omni-chip-btn ${selectedLifeStage === 'SENIOR' ? 'active' : ''}`}
              >
                🧓 Sênior
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTier(selectedTier === 'NIVEL_OURO' ? 'TODOS' : 'NIVEL_OURO');
                  setCurrentPage(1);
                }}
                className={`omni-chip-btn ${selectedTier === 'NIVEL_OURO' ? 'active' : ''}`}
              >
                🥇 Nível Ouro
              </button>
              <button
                type="button"
                onClick={() => {
                  setOnlyNaturalAntioxidants(!onlyNaturalAntioxidants);
                  setCurrentPage(1);
                }}
                className={`omni-chip-btn ${onlyNaturalAntioxidants ? 'active' : ''}`}
              >
                🌿 Conservação Natural
              </button>
              <button
                type="button"
                onClick={() => {
                  setOnlyGmoFree(!onlyGmoFree);
                  setCurrentPage(1);
                }}
                className={`omni-chip-btn ${onlyGmoFree ? 'active' : ''}`}
              >
                Sem Transgênicos
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerta Contextual Suave para Dietas Coadjuvantes */}
      {activeSegment === 'prescricao' && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            color: '#1e3a8a',
            fontSize: '0.86rem',
            lineHeight: 1.5,
            marginBottom: '20px',
          }}
        >
          <Stethoscope size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#1d4ed8', display: 'block', marginBottom: '2px' }}>
              Isolamento Metodológico de Alimentos Coadjuvantes (Prescrição Veterinária)
            </strong>
            Alimentos coadjuvantes possuem formulações clínicas específicas para suporte terapêutico e não competem em notas comparativas gerais com rações regulares. Seus laudos detalham a conformidade dos níveis de garantia declarados pelos fabricantes oficiais.
          </div>
        </div>
      )}

      {/* Barra de Status e Contagem Limpa */}
      <div className="omni-status-bar">
        <div>
          {filteredProducts.length === 0 ? (
            'Nenhum alimento encontrado'
          ) : (
            <>
              Exibindo <strong>{startIndex + 1}–{Math.min(endIndex, filteredProducts.length)}</strong> de{' '}
              <strong>{filteredProducts.length}</strong> alimentos avaliados
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="toolbar-reset-btn"
              title="Redefinir filtros"
            >
              <RotateCcw size={12} />
              <span>Limpar filtros</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Exibir:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="toolbar-select"
              style={{ padding: '2px 6px', fontSize: '0.78rem' }}
              aria-label="Itens por página"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Produtos Limpo */}
      {paginatedProducts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {paginatedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index === 0}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: '60px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1.5px dashed var(--border-cream)',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <PawPrint size={40} style={{ margin: '0 auto 12px', color: 'var(--brand-forest-600)' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
            Nenhum alimento encontrado para os critérios selecionados
          </h3>
          <p style={{ fontSize: '0.88rem', marginBottom: hasActiveFilters ? '14px' : '0' }}>
            Tente pesquisar por outro termo ou limpar os filtros para visualizar mais alimentos.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="toolbar-reset-btn"
              style={{ display: 'inline-flex', margin: '0 auto' }}
            >
              <RotateCcw size={14} />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      )}

      {/* Paginação do Catálogo */}
      {totalPages > 1 && itemsPerPage > 0 && (
        <div className="pagination-container" style={{ marginTop: '24px' }}>
          <div className="pagination-info">
            Página <strong>{safeCurrentPage}</strong> de <strong>{totalPages}</strong> ({filteredProducts.length} alimentos no total)
          </div>

          <nav className="pagination-nav" aria-label="Navegação de páginas do catálogo">
            <button
              type="button"
              onClick={() => goToPage(safeCurrentPage - 1)}
              disabled={safeCurrentPage <= 1}
              className="pagination-btn"
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
              <span style={{ marginLeft: '2px' }}>Anterior</span>
            </button>

            {getPageNumbers().map((page, idx) => {
              if (typeof page === 'string') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    style={{
                      padding: '0 6px',
                      color: 'var(--text-muted)',
                      fontWeight: 700,
                      userSelect: 'none',
                    }}
                  >
                    …
                  </span>
                );
              }

              const isCurrent = page === safeCurrentPage;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`pagination-btn ${isCurrent ? 'active' : ''}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  aria-label={`Ir para a página ${page}`}
                >
                  {page}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => goToPage(safeCurrentPage + 1)}
              disabled={safeCurrentPage >= totalPages}
              className="pagination-btn"
              aria-label="Próxima página"
            >
              <span style={{ marginRight: '2px' }}>Próxima</span>
              <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
