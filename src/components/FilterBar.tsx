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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 20px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.9rem',
              fontWeight: selectedSpecies === 'todos' ? 800 : 600,
              backgroundColor: selectedSpecies === 'todos' ? 'var(--brand-forest-900)' : 'transparent',
              color: selectedSpecies === 'todos' ? '#ffffff' : 'var(--text-body)',
              boxShadow: selectedSpecies === 'todos' ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition-fast)',
              minHeight: '44px',
            }}
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 20px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.9rem',
              fontWeight: selectedSpecies === 'caes' ? 800 : 600,
              backgroundColor: selectedSpecies === 'caes' ? 'var(--dog-accent-solid)' : 'transparent',
              color: selectedSpecies === 'caes' ? '#ffffff' : 'var(--dog-accent-text)',
              boxShadow: selectedSpecies === 'caes' ? '0 3px 10px rgba(180, 83, 9, 0.3)' : 'none',
              transition: 'var(--transition-fast)',
              minHeight: '44px',
            }}
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 20px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.9rem',
              fontWeight: selectedSpecies === 'gatos' ? 800 : 600,
              backgroundColor: selectedSpecies === 'gatos' ? 'var(--cat-accent-solid)' : 'transparent',
              color: selectedSpecies === 'gatos' ? '#ffffff' : 'var(--cat-accent-text)',
              boxShadow: selectedSpecies === 'gatos' ? '0 3px 10px rgba(67, 56, 202, 0.3)' : 'none',
              transition: 'var(--transition-fast)',
              minHeight: '44px',
            }}
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
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.88rem',
              fontWeight: selectedType === 'todos' ? 800 : 600,
              backgroundColor: selectedType === 'todos' ? 'var(--brand-forest-800)' : 'var(--bg-cream-subtle)',
              color: selectedType === 'todos' ? '#ffffff' : 'var(--text-body)',
              border: selectedType === 'todos' ? '1.5px solid var(--brand-forest-900)' : '1.5px solid var(--border-cream)',
              boxShadow: selectedType === 'todos' ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition-fast)',
              minHeight: '38px',
            }}
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
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.88rem',
                  fontWeight: isSelected ? 800 : 600,
                  backgroundColor: isSelected ? 'var(--brand-forest-800)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--text-body)',
                  border: isSelected ? '1.5px solid var(--brand-forest-900)' : '1.5px solid var(--border-cream)',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                  transition: 'var(--transition-fast)',
                  minHeight: '38px',
                }}
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
