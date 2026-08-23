'use client';

import React from 'react';
import { Dog, Cat, Sparkles, Heart } from 'lucide-react';

interface FilterBarProps {
  selectedSpecies: string;
  onSelectSpecies: (species: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
  availableTypes: string[];
}

export default function FilterBar({
  selectedSpecies,
  onSelectSpecies,
  selectedType,
  onSelectType,
  availableTypes,
}: FilterBarProps) {
  return (
    <section
      aria-label="Filtros de rankings de produtos"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        backgroundColor: '#ffffff',
        padding: '24px 28px',
        borderRadius: 'var(--radius-lg)',
        border: '1.5px solid var(--border-cream)',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
      }}
    >
      {/* Abas Principais de Espécies */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Heart size={18} color="var(--gold-700)" aria-hidden="true" />
          <span
            style={{
              fontSize: '0.88rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: 'var(--brand-forest-900)',
            }}
          >
            Qual pet você quer mimar hoje?
          </span>
        </div>

        {/* Grupo de Abas Segmentadas com ARIA */}
        <div
          role="group"
          aria-label="Seleção de espécie"
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            backgroundColor: 'var(--bg-cream-subtle)',
            padding: '5px',
            borderRadius: 'var(--radius-full)',
            border: '1.5px solid var(--border-cream)',
          }}
        >
          <button
            onClick={() => {
              onSelectSpecies('todos');
              onSelectType('todos');
            }}
            className={`filter-tab ${selectedSpecies === 'todos' ? 'filter-tab-active-todos' : ''}`}
            aria-pressed={selectedSpecies === 'todos'}
          >
            <Sparkles size={16} color={selectedSpecies === 'todos' ? 'var(--gold-400)' : 'currentColor'} aria-hidden="true" />
            <span>Todos os Pets</span>
          </button>

          <button
            onClick={() => {
              onSelectSpecies('caes');
              onSelectType('todos');
            }}
            className={`filter-tab ${selectedSpecies === 'caes' ? 'filter-tab-active-caes' : ''}`}
            aria-pressed={selectedSpecies === 'caes'}
          >
            <Dog size={17} aria-hidden="true" />
            <span>Para Cães</span>
          </button>

          <button
            onClick={() => {
              onSelectSpecies('gatos');
              onSelectType('todos');
            }}
            className={`filter-tab ${selectedSpecies === 'gatos' ? 'filter-tab-active-gatos' : ''}`}
            aria-pressed={selectedSpecies === 'gatos'}
          >
            <Cat size={17} aria-hidden="true" />
            <span>Para Gatos</span>
          </button>
        </div>
      </div>

      {/* Chips de Categorias / Tipos de Produto */}
      {availableTypes.length > 0 && (
        <div
          role="group"
          aria-label="Seleção de categoria de produto"
          style={{
            borderTop: '1px solid var(--border-cream-light)',
            paddingTop: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '0.84rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}
          >
            Escolha o que procura:
          </span>

          <button
            onClick={() => onSelectType('todos')}
            aria-pressed={selectedType === 'todos'}
            className={`filter-chip ${selectedType === 'todos' ? 'filter-chip-active' : ''}`}
          >
            Tudo em destaque ({availableTypes.length})
          </button>

          {availableTypes.map((type) => {
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                onClick={() => onSelectType(type)}
                aria-pressed={isSelected}
                className={`filter-chip ${isSelected ? 'filter-chip-active' : ''}`}
              >
                {type}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
