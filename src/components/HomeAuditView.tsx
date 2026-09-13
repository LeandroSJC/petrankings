'use client';

import React, { useState, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import {
  Filter,
  Stethoscope,
  PawPrint,
  Leaf,
  Layers,
  Sparkles,
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

export default function HomeAuditView({ initialProducts = [] }: HomeAuditViewProps) {
  // Filtros Ortogonais Desacoplados
  const [selectedSpecies, setSelectedSpecies] = useState<'TODOS' | 'CAO' | 'GATO'>('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [selectedLifeStage, setSelectedLifeStage] = useState<string>('TODOS');
  const [selectedTier, setSelectedTier] = useState<string>('TODOS');
  const [selectedFoodType, setSelectedFoodType] = useState<string>('TODOS');
  const [onlyNaturalAntioxidants, setOnlyNaturalAntioxidants] = useState<boolean>(false);
  const [onlyGmoFree, setOnlyGmoFree] = useState<boolean>(false);

  // Paginação
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Verificação de filtros ativos
  const hasActiveFilters =
    selectedSpecies !== 'TODOS' ||
    selectedCategory !== 'TODOS' ||
    selectedLifeStage !== 'TODOS' ||
    selectedTier !== 'TODOS' ||
    selectedFoodType !== 'TODOS' ||
    onlyNaturalAntioxidants ||
    onlyGmoFree;

  const handleResetFilters = () => {
    setSelectedSpecies('TODOS');
    setSelectedCategory('TODOS');
    setSelectedLifeStage('TODOS');
    setSelectedTier('TODOS');
    setSelectedFoodType('TODOS');
    setOnlyNaturalAntioxidants(false);
    setOnlyGmoFree(false);
    setCurrentPage(1);
  };

  // Filtragem dos produtos
  const filteredProducts = useMemo(() => {
    return (initialProducts || []).filter((p) => {
      // 1. Filtro de Espécie (Cão vs Gato vs Todos)
      if (selectedSpecies !== 'TODOS') {
        if (p.species !== selectedSpecies) return false;
      }

      // 2. Filtro de Categoria Legal (Completo vs Coadjuvante vs Complementar vs Todos)
      // Quando selectedCategory === 'TODOS', NENHUM alimento é omitido.
      if (selectedCategory !== 'TODOS') {
        if (p.legalCategory !== selectedCategory) return false;
      }

      // 3. Filtro por Fase da Vida
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

      // 4. Filtro por Faixa de Classificação (apenas quando não é coadjuvante nem complementar)
      if (selectedTier !== 'TODOS') {
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

      // 5. Filtro por Formato / Tipo de Alimento (Seco vs Úmido)
      if (selectedFoodType !== 'TODOS') {
        if (p.foodType !== selectedFoodType) return false;
      }

      // 6. Filtro Antioxidantes Naturais
      if (onlyNaturalAntioxidants && p.antioxidantType !== 'NATURAL') {
        return false;
      }

      // 7. Filtro Transgênicos
      if (onlyGmoFree && p.containsGmo) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Ordenação neutra (DRS 8.0 - Seção 5.3): Score decrescente, desempate alfabético
      const scoreA = a.scoreTotal ?? -1;
      const scoreB = b.scoreTotal ?? -1;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return a.commercialName.localeCompare(b.commercialName, 'pt-BR');
    });
  }, [
    initialProducts,
    selectedSpecies,
    selectedCategory,
    selectedLifeStage,
    selectedTier,
    selectedFoodType,
    onlyNaturalAntioxidants,
    onlyGmoFree,
  ]);

  // Cálculos de Paginação
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Barra Consolidada de Filtros & Navegação */}
      <div className="toolbar-container" id="catalogo-produtos">
        {/* Linha 1: Espécie do Pet */}
        <div
          role="tablist"
          aria-label="Espécie do Pet"
          className="toolbar-nav-row"
        >
          {[
            { id: 'TODOS', label: '🐾 Todos os Pets' },
            { id: 'CAO', label: '🐶 Cães' },
            { id: 'GATO', label: '🐱 Gatos' },
          ].map((sp) => {
            const isActive = selectedSpecies === sp.id;
            return (
              <button
                key={sp.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setSelectedSpecies(sp.id as any);
                  setCurrentPage(1);
                }}
                className={`toolbar-tab ${isActive ? 'active' : ''}`}
              >
                {sp.label}
              </button>
            );
          })}
        </div>

        {/* Linha 2: Categorias Oficiais (MAPA) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            paddingTop: '2px',
          }}
        >
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginRight: '2px',
            }}
          >
            Categoria:
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory('TODOS');
              setCurrentPage(1);
            }}
            className={`toolbar-category-pill ${selectedCategory === 'TODOS' ? 'active' : ''}`}
          >
            Todas as Categorias
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALIMENTO_COMPLETO');
              setCurrentPage(1);
            }}
            className={`toolbar-category-pill ${selectedCategory === 'ALIMENTO_COMPLETO' ? 'active' : ''}`}
          >
            🥣 Alimentos Completos
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALIMENTO_COADJUVANTE');
              setSelectedTier('TODOS');
              setCurrentPage(1);
            }}
            className={`toolbar-category-pill special ${selectedCategory === 'ALIMENTO_COADJUVANTE' ? 'active' : ''}`}
          >
            🏥 Dietas Coadjuvantes
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALIMENTO_COMPLEMENTAR');
              setSelectedTier('TODOS');
              setCurrentPage(1);
            }}
            className={`toolbar-category-pill purple ${selectedCategory === 'ALIMENTO_COMPLEMENTAR' ? 'active' : ''}`}
          >
            ⭐ Alimentos Complementares
          </button>
        </div>

        {/* Linha 3: Filtros Principais (Dropdowns) + Seletor de Quantidade & Contagem */}
        <div className="toolbar-filter-row">
          <div className="toolbar-filter-group">
            {/* Faixa / Tier (Apenas para Alimentos Completos ou Todos) */}
            {selectedCategory !== 'ALIMENTO_COADJUVANTE' && selectedCategory !== 'ALIMENTO_COMPLEMENTAR' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  <Filter size={14} />
                  <span>Faixa:</span>
                </div>
                <select
                  value={selectedTier}
                  onChange={(e) => {
                    setSelectedTier(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="toolbar-select"
                  aria-label="Filtrar por Faixa de Classificação"
                >
                  <option value="TODOS">Todas as Faixas</option>
                  <option value="NIVEL_OURO">🥇 Nível Ouro (90 a 100 pts)</option>
                  <option value="NIVEL_PRATA">🥈 Nível Prata (75 a 89 pts)</option>
                  <option value="NIVEL_BRONZE">🥉 Nível Bronze (60 a 74 pts)</option>
                  <option value="SOB_OBSERVACAO">⚠️ Sob Observação (&lt; 60 pts)</option>
                </select>
              </div>
            )}

            {/* Fase da Vida */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Idade:</span>
              <select
                value={selectedLifeStage}
                onChange={(e) => {
                  setSelectedLifeStage(e.target.value);
                  setCurrentPage(1);
                }}
                className="toolbar-select"
                aria-label="Filtrar por Fase da Vida"
              >
                <option value="TODOS">Todas as Idades</option>
                <option value="ADULTO">🐕 Adultos</option>
                <option value="FILHOTE">🍼 Filhotes</option>
                <option value="SENIOR">🧓 Sênior (Idosos)</option>
              </select>
            </div>

            {/* Formato / Textura */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                <Layers size={14} />
                <span>Formato:</span>
              </div>
              <select
                value={selectedFoodType}
                onChange={(e) => {
                  setSelectedFoodType(e.target.value);
                  setCurrentPage(1);
                }}
                className="toolbar-select"
                aria-label="Filtrar por Formato de Alimento"
              >
                <option value="TODOS">Todos os Formatos</option>
                <option value="SECO">🥣 Ração Seca</option>
                <option value="UMIDO">🥫 Ração Úmida (Sachê / Patê)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Linha 4: Atributos de Composição (Checkboxes) & Limpar Filtros */}
        <div className="toolbar-attributes-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.76rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Filtros Adicionais:
            </span>

            {/* Checkbox Conservantes Naturais */}
            <label className="toolbar-checkbox" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={onlyNaturalAntioxidants}
                onChange={(e) => {
                  setOnlyNaturalAntioxidants(e.target.checked);
                  setCurrentPage(1);
                }}
                style={{ width: '15px', height: '15px', accentColor: 'var(--brand-forest-700)', cursor: 'pointer' }}
              />
              <Leaf size={14} color="var(--brand-forest-600)" />
              <span>Conservantes Naturais</span>
            </label>

            {/* Checkbox Transgênicos */}
            <label className="toolbar-checkbox" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={onlyGmoFree}
                onChange={(e) => {
                  setOnlyGmoFree(e.target.checked);
                  setCurrentPage(1);
                }}
                style={{ width: '15px', height: '15px', accentColor: 'var(--brand-forest-700)', cursor: 'pointer' }}
              />
              <span>Sem Transgênicos</span>
            </label>
          </div>

          {/* Botão de Limpar Filtros */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="toolbar-reset-btn"
              title="Redefinir todos os filtros"
            >
              <RotateCcw size={13} />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>

        {/* Linha 5: Seletor de Quantidade de Itens por Página & Contagem (Abaixo de Filtros Adicionais) */}
        <div className="toolbar-display-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 700 }}>Exibir:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="toolbar-select"
              style={{ padding: '4px 8px', fontSize: '0.80rem' }}
              aria-label="Número de itens por página"
            >
              <option value={12}>12 por página</option>
              <option value={24}>24 por página</option>
              <option value={48}>48 por página</option>
            </select>
          </div>

          <div className="toolbar-count">
            {filteredProducts.length === 0 ? (
              '0 produtos'
            ) : (
              <>
                Exibindo <strong>{startIndex + 1}–{Math.min(endIndex, filteredProducts.length)}</strong> de <strong>{filteredProducts.length}</strong>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Aviso Metodológico ao visualizar Alimentos Coadjuvantes */}
      {selectedCategory === 'ALIMENTO_COADJUVANTE' && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1.5px solid #93c5fd',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            color: '#1e3a8a',
            fontSize: '0.88rem',
            lineHeight: 1.5,
          }}
        >
          <Stethoscope size={22} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.92rem', marginBottom: '3px', color: '#1d4ed8' }}>
              Isolamento Metodológico de Alimentos Coadjuvantes (Prescrição Veterinária)
            </strong>
            Rações coadjuvantes (renais, urinárias, obesidade) possuem formulações terapêuticas específicas e não competem em rankings com alimentos de manutenção regular. Elas não recebem pontuação comparativa, exibindo a análise das garantias declaradas.
          </div>
        </div>
      )}

      {/* Aviso Regulatório ao visualizar Alimentos Complementares */}
      {selectedCategory === 'ALIMENTO_COMPLEMENTAR' && (
        <div
          style={{
            backgroundColor: '#fdf4ff',
            border: '1.5px solid #f5d0fe',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            color: '#701a75',
            fontSize: '0.88rem',
            lineHeight: 1.5,
          }}
        >
          <Sparkles size={22} color="#a21caf" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.92rem', marginBottom: '3px', color: '#86198f' }}>
              Diretriz Regulatória: Alimento Complementar (MAPA)
            </strong>
            Alimentos complementares (petiscos, sachês tipo sopa, caldos e toppers) não atendem sozinhos à totalidade das necessidades nutricionais diárias do pet. Por determinação normativa, não recebem pontuação comparativa de alimentos completos e devem ser servidos combinados à dieta regular.
          </div>
        </div>
      )}

      {/* Grid de Cards dos Produtos Analisados */}
      {paginatedProducts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
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
          <PawPrint size={40} style={{ margin: '0 auto 12px', color: 'var(--gold-600)' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-forest-900)', marginBottom: '6px' }}>
            {initialProducts.length === 0
              ? 'Nenhum produto cadastrado no momento'
              : 'Nenhum produto atende aos filtros selecionados'}
          </h3>
          <p style={{ fontSize: '0.88rem', marginBottom: hasActiveFilters ? '14px' : '0' }}>
            {initialProducts.length === 0
              ? 'O catálogo foi zerado e está pronto para receber os novos produtos oficiais.'
              : 'Tente redefinir os filtros para visualizar mais alimentos avaliados.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="toolbar-reset-btn"
              style={{ display: 'inline-flex', margin: '0 auto' }}
            >
              <RotateCcw size={14} />
              <span>Redefinir filtros</span>
            </button>
          )}
        </div>
      )}

      {/* Paginação do Catálogo */}
      {totalPages > 1 && itemsPerPage > 0 && (
        <div className="pagination-container">
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
