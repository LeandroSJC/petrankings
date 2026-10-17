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
  ChevronDown,
  ArrowUpDown,
  Filter,
  SlidersHorizontal,
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
type SortOption = 'SCORE_DESC' | 'PROTEIN_DESC' | 'FAT_ASC' | 'NAME_ASC';

function normalizeSearchText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function HomeAuditView({ initialProducts = [] }: HomeAuditViewProps) {
  // Seletor de Segmento Principal (Pílula Central: Cães | Gatos | Prescrição)
  const [activeSegment, setActiveSegment] = useState<SegmentType>('caes');

  // Campo de Busca Inteligente (Tokenizada & Sem Acentos)
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtros Estruturados
  const [selectedBrand, setSelectedBrand] = useState<string>('TODOS');
  const [selectedBreedSize, setSelectedBreedSize] = useState<string>('TODOS');
  const [onlyCastrados, setOnlyCastrados] = useState<boolean>(false);
  const [selectedLifeStage, setSelectedLifeStage] = useState<string>('TODOS');
  const [selectedFoodType, setSelectedFoodType] = useState<string>('TODOS');
  const [selectedTier, setSelectedTier] = useState<string>('TODOS');
  const [onlyNaturalAntioxidants, setOnlyNaturalAntioxidants] = useState<boolean>(false);
  const [onlyGmoFree, setOnlyGmoFree] = useState<boolean>(false);

  // Controle da Gaveta de Filtros Secundários
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Filtros Prescrição Veterinária
  const [selectedPrescriptionCondition, setSelectedPrescriptionCondition] = useState<string>('TODOS');
  const [selectedPrescriptionSpecies, setSelectedPrescriptionSpecies] = useState<'TODOS' | 'CAO' | 'GATO'>('TODOS');

  // Ordenação
  const [sortBy, setSortBy] = useState<SortOption>('SCORE_DESC');

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

  // Marcas disponíveis no segmento ativo (com contagem de produtos)
  const availableBrands = useMemo(() => {
    const counts = new Map<string, number>();
    (initialProducts || []).forEach((p) => {
      if (activeSegment === 'caes') {
        if (p.species !== 'CAO' || p.legalCategory === 'ALIMENTO_COADJUVANTE') return;
      } else if (activeSegment === 'gatos') {
        if (p.species !== 'GATO' || p.legalCategory === 'ALIMENTO_COADJUVANTE') return;
      } else if (activeSegment === 'prescricao') {
        if (p.legalCategory !== 'ALIMENTO_COADJUVANTE') return;
      }
      if (p.brand && p.brand.trim()) {
        counts.set(p.brand.trim(), (counts.get(p.brand.trim()) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [initialProducts, activeSegment]);

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

      // Marca
      const marcaParam = searchParams.get('marca') ?? saved?.selectedBrand;
      if (marcaParam) setSelectedBrand(marcaParam);

      // Porte
      const porteParam = searchParams.get('porte') ?? saved?.selectedBreedSize;
      if (porteParam) setSelectedBreedSize(porteParam);

      // Castrado
      const castradoParam = searchParams.get('castrado') !== null ? searchParams.get('castrado') === '1' : saved?.onlyCastrados;
      if (castradoParam !== undefined) setOnlyCastrados(Boolean(castradoParam));

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

      // Ordenação
      const ordemParam = searchParams.get('ordem') ?? saved?.sortBy;
      if (ordemParam && ['SCORE_DESC', 'PROTEIN_DESC', 'FAT_ASC', 'NAME_ASC'].includes(ordemParam)) {
        setSortBy(ordemParam as SortOption);
      }

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

      // Se houver qualquer filtro secundário ativo vindo de URL ou storage, expande a gaveta
      if (
        (faseParam && faseParam !== 'TODOS') ||
        (formatoParam && formatoParam !== 'TODOS') ||
        (faixaParam && faixaParam !== 'TODOS') ||
        (condParam && condParam !== 'TODOS') ||
        Boolean(natParam) ||
        Boolean(gmoParam)
      ) {
        setShowAdvancedFilters(true);
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
      selectedBrand,
      selectedBreedSize,
      onlyCastrados,
      selectedLifeStage,
      selectedFoodType,
      selectedTier,
      selectedPrescriptionCondition,
      selectedPrescriptionSpecies,
      onlyNaturalAntioxidants,
      onlyGmoFree,
      sortBy,
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
    if (selectedBrand !== 'TODOS') params.set('marca', selectedBrand);
    if (selectedBreedSize !== 'TODOS') params.set('porte', selectedBreedSize);
    if (onlyCastrados) params.set('castrado', '1');
    if (selectedLifeStage !== 'TODOS') params.set('fase', selectedLifeStage);
    if (selectedFoodType !== 'TODOS') params.set('formato', selectedFoodType);
    if (selectedTier !== 'TODOS') params.set('faixa', selectedTier);
    if (selectedPrescriptionCondition !== 'TODOS') params.set('condicao', selectedPrescriptionCondition);
    if (selectedPrescriptionSpecies !== 'TODOS') params.set('esp_presc', selectedPrescriptionSpecies);
    if (onlyNaturalAntioxidants) params.set('nat', '1');
    if (onlyGmoFree) params.set('gmo_free', '1');
    if (sortBy !== 'SCORE_DESC') params.set('ordem', sortBy);
    if (itemsPerPage !== 12) params.set('itens', String(itemsPerPage));
    if (currentPage > 1) params.set('p', String(currentPage));

    const qs = params.toString();
    const newUrl = qs ? `?${qs}#${activeSegment}` : `#${activeSegment}`;
    window.history.replaceState(null, '', newUrl);
  }, [
    isRestored,
    activeSegment,
    searchQuery,
    selectedBrand,
    selectedBreedSize,
    onlyCastrados,
    selectedLifeStage,
    selectedFoodType,
    selectedTier,
    selectedPrescriptionCondition,
    selectedPrescriptionSpecies,
    onlyNaturalAntioxidants,
    onlyGmoFree,
    sortBy,
    itemsPerPage,
    currentPage,
  ]);

  const handleSegmentChange = (seg: SegmentType) => {
    setActiveSegment(seg);
    setSelectedBrand('TODOS');
    setSelectedBreedSize('TODOS');
    setCurrentPage(1);
  };

  // Contagem de filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== '') count++;
    if (selectedBrand !== 'TODOS') count++;
    if (selectedBreedSize !== 'TODOS') count++;
    if (onlyCastrados) count++;
    if (selectedLifeStage !== 'TODOS') count++;
    if (selectedFoodType !== 'TODOS') count++;
    if (selectedTier !== 'TODOS') count++;
    if (onlyNaturalAntioxidants) count++;
    if (onlyGmoFree) count++;
    if (activeSegment === 'prescricao') {
      if (selectedPrescriptionCondition !== 'TODOS') count++;
      if (selectedPrescriptionSpecies !== 'TODOS') count++;
    }
    return count;
  }, [
    searchQuery,
    selectedBrand,
    selectedBreedSize,
    onlyCastrados,
    selectedLifeStage,
    selectedFoodType,
    selectedTier,
    onlyNaturalAntioxidants,
    onlyGmoFree,
    activeSegment,
    selectedPrescriptionCondition,
    selectedPrescriptionSpecies,
  ]);

  // Contagem específica de filtros secundários (dentro da gaveta)
  const advancedFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedLifeStage !== 'TODOS') count++;
    if (selectedFoodType !== 'TODOS') count++;
    if (selectedTier !== 'TODOS') count++;
    if (onlyNaturalAntioxidants) count++;
    if (onlyGmoFree) count++;
    if (activeSegment === 'prescricao') {
      if (selectedPrescriptionCondition !== 'TODOS') count++;
    }
    return count;
  }, [
    selectedLifeStage,
    selectedFoodType,
    selectedTier,
    onlyNaturalAntioxidants,
    onlyGmoFree,
    activeSegment,
    selectedPrescriptionCondition,
  ]);

  const hasActiveFilters = activeFiltersCount > 0;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('TODOS');
    setSelectedBreedSize('TODOS');
    setOnlyCastrados(false);
    setSelectedLifeStage('TODOS');
    setSelectedFoodType('TODOS');
    setSelectedTier('TODOS');
    setSelectedPrescriptionCondition('TODOS');
    setSelectedPrescriptionSpecies('TODOS');
    setOnlyNaturalAntioxidants(false);
    setOnlyGmoFree(false);
    setSortBy('SCORE_DESC');
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
    return (initialProducts || [])
      .filter((p) => {
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

        // 2. Busca Inteligente Tokenizada & Sem Acentos (Todas as palavras digitadas devem casar)
        if (searchQuery.trim()) {
          const normQuery = normalizeSearchText(searchQuery);
          const tokens = normQuery.split(/\s+/).filter(Boolean);
          const normName = normalizeSearchText(p.commercialName);
          const normBrand = normalizeSearchText(p.brand);
          const normIngredients = normalizeSearchText(p.topIngredients);

          const matchesAll = tokens.every(
            (token) => normName.includes(token) || normBrand.includes(token) || normIngredients.includes(token)
          );
          if (!matchesAll) return false;
        }

        // 3. Marca Comercial
        if (selectedBrand !== 'TODOS') {
          if (p.brand !== selectedBrand) return false;
        }

        // 4. Porte do Animal (Cães)
        if (activeSegment === 'caes' && selectedBreedSize !== 'TODOS') {
          if (p.breedSize !== selectedBreedSize) return false;
        }

        // 5. Especialidade: Castrados
        if (onlyCastrados) {
          const isCastrado =
            /castrad|sterili/i.test(p.commercialName) ||
            /castrad|sterili/i.test(p.slug) ||
            /castrad|sterili/i.test(p.topIngredients);
          if (!isCastrado) return false;
        }

        // 6. Faixa de Classificação (Ouro, Prata, Bronze)
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

        // 7. Fase da Vida (Idade)
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

        // 8. Formato (Seco vs Úmido)
        if (selectedFoodType !== 'TODOS') {
          if (p.foodType !== selectedFoodType) return false;
        }

        // 9. Antioxidantes Naturais
        if (onlyNaturalAntioxidants && p.antioxidantType !== 'NATURAL') {
          return false;
        }

        // 10. Sem Transgênicos
        if (onlyGmoFree && p.containsGmo) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Ordenação Dinâmica
        if (sortBy === 'PROTEIN_DESC') {
          const msA = a.moistureMaxPct < 100 ? (a.crudeProteinMinPct / (100 - a.moistureMaxPct)) * 100 : a.crudeProteinMinPct;
          const msB = b.moistureMaxPct < 100 ? (b.crudeProteinMinPct / (100 - b.moistureMaxPct)) * 100 : b.crudeProteinMinPct;
          if (msB !== msA) return msB - msA;
        } else if (sortBy === 'FAT_ASC') {
          const msFatA = a.moistureMaxPct < 100 ? (a.etherExtractMinPct / (100 - a.moistureMaxPct)) * 100 : a.etherExtractMinPct;
          const msFatB = b.moistureMaxPct < 100 ? (b.etherExtractMinPct / (100 - b.moistureMaxPct)) * 100 : b.etherExtractMinPct;
          if (msFatA !== msFatB) return msFatA - msFatB;
        } else if (sortBy === 'NAME_ASC') {
          return a.commercialName.localeCompare(b.commercialName, 'pt-BR');
        } else {
          // Padrão: SCORE_DESC (maior pontuação técnica)
          const scoreA = a.scoreTotal ?? -1;
          const scoreB = b.scoreTotal ?? -1;
          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }
        }
        return a.commercialName.localeCompare(b.commercialName, 'pt-BR');
      });
  }, [
    initialProducts,
    activeSegment,
    searchQuery,
    selectedBrand,
    selectedBreedSize,
    onlyCastrados,
    selectedTier,
    selectedLifeStage,
    selectedFoodType,
    selectedPrescriptionCondition,
    selectedPrescriptionSpecies,
    onlyNaturalAntioxidants,
    onlyGmoFree,
    sortBy,
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
      {/* SEÇÃO CENTRAL OMNI — PESQUISA & FILTROS AVANÇADOS */}
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
                ? 'Buscar por marca (Premier, Royal Canin, Golden...) ou ingrediente (frango, arroz...)'
                : activeSegment === 'gatos'
                ? 'Buscar por marca (Royal Canin, Farmina, GranPlus...) ou ingrediente (salmão, atum...)'
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

        {/* PAINEL ESTRUTURADO DE FILTROS & SELETORES */}
        <div className="omni-filters-panel">
          {/* Linha Principal Enxuta: Apenas os Controles Essenciais */}
          <div className="omni-chips-row">
            {/* Dropdown de Marca Comercial */}
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setCurrentPage(1);
              }}
              className={`omni-filter-dropdown ${selectedBrand !== 'TODOS' ? 'active' : ''}`}
              aria-label="Filtrar por marca comercial"
            >
              <option value="TODOS">
                🏷️ Todas as Marcas ({availableBrands.length})
              </option>
              {availableBrands.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} ({b.count})
                </option>
              ))}
            </select>

            {/* Porte (apenas para Cães) */}
            {activeSegment === 'caes' && (
              <select
                value={selectedBreedSize}
                onChange={(e) => {
                  setSelectedBreedSize(e.target.value);
                  setCurrentPage(1);
                }}
                className={`omni-filter-dropdown ${selectedBreedSize !== 'TODOS' ? 'active' : ''}`}
                aria-label="Filtrar por porte do cão"
                style={{ maxWidth: '175px' }}
              >
                <option value="TODOS">🐾 Todos os Portes</option>
                <option value="MINI_PEQUENO">Mini e Pequeno</option>
                <option value="MEDIO_GRANDE">Médio e Grande</option>
              </select>
            )}

            {/* Especialidade: Castrados (Cães e Gatos) */}
            {activeSegment !== 'prescricao' && (
              <button
                type="button"
                onClick={() => {
                  setOnlyCastrados(!onlyCastrados);
                  setCurrentPage(1);
                }}
                className={`omni-chip-btn ${onlyCastrados ? 'active' : ''}`}
              >
                ✂️ Castrados
              </button>
            )}

            {/* Prescrição: Seleção de Espécie */}
            {activeSegment === 'prescricao' && (
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
              </>
            )}

            {/* Botão Sanfona: Mais Filtros */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`omni-chip-btn ${showAdvancedFilters || advancedFiltersCount > 0 ? 'active' : ''}`}
              aria-expanded={showAdvancedFilters}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <SlidersHorizontal size={13} />
              <span>Mais Filtros</span>
              {advancedFiltersCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--brand-forest-700)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-full)',
                    padding: '0 6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    lineHeight: '16px',
                  }}
                >
                  {advancedFiltersCount}
                </span>
              )}
              <ChevronDown
                size={13}
                style={{
                  transform: showAdvancedFilters ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>
          </div>

          {/* Gaveta Expansível de Filtros Secundários */}
          {showAdvancedFilters && (
            <div className="omni-advanced-drawer">
              {activeSegment === 'prescricao' ? (
                <div className="advanced-filter-group">
                  <span className="advanced-group-title">Indicação:</span>
                  <div className="advanced-group-chips">
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
                  </div>
                </div>
              ) : (
                <>
                  <div className="advanced-filter-group">
                    <span className="advanced-group-title">Formato:</span>
                    <div className="advanced-group-chips">
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
                        🥫 Sachê / Úmida
                      </button>
                    </div>
                  </div>

                  <div className="advanced-filter-group">
                    <span className="advanced-group-title">Fase:</span>
                    <div className="advanced-group-chips">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLifeStage(selectedLifeStage === 'FILHOTE' ? 'TODOS' : 'FILHOTE');
                          setCurrentPage(1);
                        }}
                        className={`omni-chip-btn ${selectedLifeStage === 'FILHOTE' ? 'active' : ''}`}
                      >
                        🍼 Filhote
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLifeStage(selectedLifeStage === 'ADULTO' ? 'TODOS' : 'ADULTO');
                          setCurrentPage(1);
                        }}
                        className={`omni-chip-btn ${selectedLifeStage === 'ADULTO' ? 'active' : ''}`}
                      >
                        Adulto
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
                    </div>
                  </div>

                  <div className="advanced-filter-group">
                    <span className="advanced-group-title">Padrão:</span>
                    <div className="advanced-group-chips">
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
                          setSelectedTier(selectedTier === 'NIVEL_PRATA' ? 'TODOS' : 'NIVEL_PRATA');
                          setCurrentPage(1);
                        }}
                        className={`omni-chip-btn ${selectedTier === 'NIVEL_PRATA' ? 'active' : ''}`}
                      >
                        🥈 Nível Prata
                      </button>
                    </div>
                  </div>

                  <div className="advanced-filter-group">
                    <span className="advanced-group-title">Fórmula:</span>
                    <div className="advanced-group-chips">
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
                    </div>
                  </div>
                </>
              )}
            </div>
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

      {/* Barra de Status, Ordenação e Contagem */}
      <div className="omni-status-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--brand-forest-700)" />
          {filteredProducts.length === 0 ? (
            'Nenhum alimento encontrado'
          ) : (
            <>
              Exibindo <strong>{startIndex + 1}–{Math.min(endIndex, filteredProducts.length)}</strong> de{' '}
              <strong>{filteredProducts.length}</strong> alimentos avaliados
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Seletor de Ordenação */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '0.80rem', fontWeight: 600 }}>Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setCurrentPage(1);
              }}
              style={{
                padding: '4px 8px',
                fontSize: '0.80rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-cream-dark)',
                backgroundColor: '#ffffff',
                color: 'var(--text-body)',
                cursor: 'pointer',
              }}
              aria-label="Critério de ordenação dos produtos"
            >
              <option value="SCORE_DESC">Maior Avaliação Técnica</option>
              <option value="PROTEIN_DESC">Maior Proteína (% Matéria Seca)</option>
              <option value="FAT_ASC">Menor Gordura (% Matéria Seca)</option>
              <option value="NAME_ASC">Nome Comercial (A–Z)</option>
            </select>
          </div>

          {/* Botão de Limpar Filtros com Contador */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="toolbar-reset-btn"
              title="Redefinir todos os filtros aplicados"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <RotateCcw size={12} />
              <span>Limpar filtros ({activeFiltersCount})</span>
            </button>
          )}

          {/* Quantidade por Página */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.80rem' }}>Exibir:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '3px 6px',
                fontSize: '0.78rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-cream-dark)',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
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
            Tente pesquisar por outro termo, escolher outra marca ou limpar os filtros para visualizar mais alimentos.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="toolbar-reset-btn"
              style={{ display: 'inline-flex', margin: '0 auto' }}
            >
              <RotateCcw size={14} />
              <span>Limpar filtros ({activeFiltersCount})</span>
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

            <div className="pagination-pages">
              {getPageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={`page-${page}`}
                    type="button"
                    onClick={() => goToPage(Number(page))}
                    className={`pagination-page-btn ${safeCurrentPage === page ? 'active' : ''}`}
                    aria-label={`Ir para página ${page}`}
                    aria-current={safeCurrentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

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
