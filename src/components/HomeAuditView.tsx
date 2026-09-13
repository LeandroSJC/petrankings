'use client';

import React, { useState, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import {
  Filter,
  Stethoscope,
  PawPrint,
  Leaf,
  Layers,
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
  const [activeTab, setActiveTab] = useState<string>('TODOS');
  const [selectedTier, setSelectedTier] = useState<string>('TODOS');
  const [selectedFoodType, setSelectedFoodType] = useState<string>('TODOS');
  const [onlyNaturalAntioxidants, setOnlyNaturalAntioxidants] = useState<boolean>(false);
  const [onlyGmoFree, setOnlyGmoFree] = useState<boolean>(false);

  // Filtragem dos produtos
  const filteredProducts = useMemo(() => {
    return (initialProducts || []).filter((p) => {
      // Filtro por Aba de Segmentação Estrita
      if (activeTab === 'CAO_ADULTO') {
        if (p.legalCategory === 'ALIMENTO_COADJUVANTE' || p.species !== 'CAO' || p.lifeStage !== 'ADULTO') return false;
      } else if (activeTab === 'CAO_FILHOTE') {
        if (p.legalCategory === 'ALIMENTO_COADJUVANTE' || p.species !== 'CAO' || (p.lifeStage !== 'CRESCIMENTO_INICIAL' && p.lifeStage !== 'CRESCIMENTO_FINAL')) return false;
      } else if (activeTab === 'GATO_ADULTO') {
        if (p.legalCategory === 'ALIMENTO_COADJUVANTE' || p.species !== 'GATO' || p.lifeStage !== 'ADULTO') return false;
      } else if (activeTab === 'GATO_FILHOTE') {
        if (p.legalCategory === 'ALIMENTO_COADJUVANTE' || p.species !== 'GATO' || (p.lifeStage !== 'CRESCIMENTO_INICIAL' && p.lifeStage !== 'CRESCIMENTO_FINAL')) return false;
      } else if (activeTab === 'COADJUVANTE') {
        if (p.legalCategory !== 'ALIMENTO_COADJUVANTE') return false;
      } else {
        // TODOS: por padrão exibe alimentos completos de manutenção
        if (p.legalCategory === 'ALIMENTO_COADJUVANTE') return false;
      }

      // Filtro por Faixa
      if (selectedTier !== 'TODOS') {
        const t = p.classificationTier;
        if (selectedTier === 'NIVEL_OURO' || selectedTier === 'SUPER_PREMIUM') {
          if (t !== 'NIVEL_OURO' && t !== 'SUPER_PREMIUM') return false;
        } else if (selectedTier === 'NIVEL_PRATA' || selectedTier === 'PREMIUM_ESPECIAL') {
          if (t !== 'NIVEL_PRATA' && t !== 'PREMIUM_ESPECIAL') return false;
        } else if (selectedTier === 'NIVEL_BRONZE' || selectedTier === 'ECONOMICO') {
          if (t !== 'NIVEL_BRONZE' && t !== 'ECONOMICO') return false;
        } else if (selectedTier === 'SOB_OBSERVACAO' || selectedTier === 'PARAMETRO_LIMITROFE' || selectedTier === 'NAO_CONFORME') {
          if (t !== 'SOB_OBSERVACAO' && t !== 'PARAMETRO_LIMITROFE' && t !== 'NAO_CONFORME') return false;
        } else if (t !== selectedTier) {
          return false;
        }
      }

      // Filtro por Formato / Tipo de Alimento
      if (selectedFoodType !== 'TODOS') {
        if (p.foodType !== selectedFoodType) return false;
      }

      // Filtro Antioxidantes Naturais
      if (onlyNaturalAntioxidants && p.antioxidantType !== 'NATURAL') {
        return false;
      }

      // Filtro Transgênicos
      if (onlyGmoFree && p.containsGmo) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Ordenação neutra (DRS 8.0 - Seção 5.3): Score decrescente, desempate alfabético
      const scoreA = a.scoreTotal ?? 0;
      const scoreB = b.scoreTotal ?? 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return a.commercialName.localeCompare(b.commercialName, 'pt-BR');
    });
  }, [initialProducts, activeTab, selectedTier, selectedFoodType, onlyNaturalAntioxidants, onlyGmoFree]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Barra Consolidada de Filtros & Navegação */}
      <div className="toolbar-container">
        {/* Linha de Abas Segmentadas */}
        <div
          role="tablist"
          aria-label="Segmentação Nutricional"
          className="toolbar-nav-row"
        >
          {[
            { id: 'TODOS', label: 'Todos os Alimentos' },
            { id: 'CAO_ADULTO', label: '🐶 Cães Adultos' },
            { id: 'CAO_FILHOTE', label: '🐶 Cães Filhotes' },
            { id: 'GATO_ADULTO', label: '🐱 Gatos Adultos' },
            { id: 'GATO_FILHOTE', label: '🐱 Gatos Filhotes' },
            { id: 'COADJUVANTE', label: '🏥 Dietas Coadjuvantes', isSpecial: true },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'COADJUVANTE') setSelectedTier('TODOS');
                }}
                className={`toolbar-tab ${isActive ? 'active' : ''} ${tab.isSpecial ? 'special' : ''}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Linha de Filtros Compactos */}
        {activeTab !== 'COADJUVANTE' && (
          <div className="toolbar-filter-row">
            <div className="toolbar-filter-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                <Filter size={14} />
                <span>Faixa:</span>
              </div>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="toolbar-select"
                aria-label="Filtrar por Faixa de Classificação"
              >
                <option value="TODOS">Todas as Faixas</option>
                <option value="NIVEL_OURO">🥇 Nível Ouro (90 a 100 pts)</option>
                <option value="NIVEL_PRATA">🥈 Nível Prata (75 a 89 pts)</option>
                <option value="NIVEL_BRONZE">🥉 Nível Bronze (60 a 74 pts)</option>
                <option value="SOB_OBSERVACAO">⚠️ Sob Observação (&lt; 60 pts)</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                <Layers size={14} />
                <span>Formato:</span>
              </div>
              <select
                value={selectedFoodType}
                onChange={(e) => setSelectedFoodType(e.target.value)}
                className="toolbar-select"
                aria-label="Filtrar por Formato de Alimento"
              >
                <option value="TODOS">Todos os Formatos</option>
                <option value="SECO">🥣 Ração Seca</option>
                <option value="UMIDO">🥫 Ração Úmida (Sachê / Patê)</option>
              </select>

              <label className="toolbar-checkbox">
                <input
                  type="checkbox"
                  checked={onlyNaturalAntioxidants}
                  onChange={(e) => setOnlyNaturalAntioxidants(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: 'var(--brand-forest-700)', cursor: 'pointer' }}
                />
                <Leaf size={14} color="var(--brand-forest-600)" />
                <span>Conservantes Naturais</span>
              </label>

              <label className="toolbar-checkbox">
                <input
                  type="checkbox"
                  checked={onlyGmoFree}
                  onChange={(e) => setOnlyGmoFree(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: 'var(--brand-forest-700)', cursor: 'pointer' }}
                />
                <span>Sem Transgênicos</span>
              </label>
            </div>

            <div className="toolbar-count">
              Exibindo <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'produto' : 'produtos'}
            </div>
          </div>
        )}
      </div>

      {/* Aviso Metodológico ao visualizar Alimentos Coadjuvantes */}
      {activeTab === 'COADJUVANTE' && (
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

      {/* Grid de Cards dos Produtos Analisados */}
      {filteredProducts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredProducts.map((product) => (
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
          <p style={{ fontSize: '0.88rem' }}>
            {initialProducts.length === 0
              ? 'O catálogo foi zerado e está pronto para receber os novos produtos oficiais.'
              : 'Tente redefinir os filtros para visualizar mais alimentos avaliados.'}
          </p>
        </div>
      )}
    </div>
  );
}
