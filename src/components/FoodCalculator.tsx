'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Dog, 
  Cat, 
  Scale, 
  Coins, 
  CalendarDays, 
  Flame, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Info,
  HeartPulse
} from 'lucide-react';

type Species = 'CAO' | 'GATO';

export type BodyConditionScore = 'ABAIXO' | 'IDEAL' | 'SOBREPESO' | 'OBESO';

interface BCSOption {
  id: BodyConditionScore;
  label: string;
  sublabel: string;
  bcsRange: string;
  description: string;
  multiplier: number;
}

const BCS_OPTIONS: BCSOption[] = [
  {
    id: 'ABAIXO',
    label: 'Abaixo do peso',
    sublabel: 'ECC 1 a 3 (Magro)',
    bcsRange: '1 a 3 de 9',
    description: 'Costelas, coluna e ossos do quadril muito evidentes, sem gordura palpável.',
    multiplier: 1.15,
  },
  {
    id: 'IDEAL',
    label: 'Peso ideal',
    sublabel: 'ECC 4 a 5 (Equilibrado)',
    bcsRange: '4 a 5 de 9',
    description: 'Costelas facilmente palpáveis com leve cobertura de gordura, cintura visível atrás das costelas.',
    multiplier: 1.0,
  },
  {
    id: 'SOBREPESO',
    label: 'Sobrepeso',
    sublabel: 'ECC 6 a 7 (Gordinho)',
    bcsRange: '6 a 7 de 9',
    description: 'Costelas difíceis de apalpar com camada de gordura notável, cintura pouco evidente.',
    multiplier: 0.85,
  },
  {
    id: 'OBESO',
    label: 'Obesidade',
    sublabel: 'ECC 8 a 9 (Excessivo)',
    bcsRange: '8 a 9 de 9',
    description: 'Depósitos pesados de gordura sobre tórax e base da cauda, abdômen abaulado e ausência de cintura.',
    multiplier: 0.70,
  },
];

interface ActivityOption {
  id: string;
  label: string;
  description: string;
  factor: number;
  isReproductive?: boolean;
}

const DOG_ACTIVITIES: ActivityOption[] = [
  {
    id: 'castrado_baixa',
    label: 'Adulto Castrado / Pouco Ativo',
    description: 'Rotina em ambiente fechado, caminhadas curtas de até 30 min por dia',
    factor: 95,
  },
  {
    id: 'moderada',
    label: 'Adulto Intacto / Moderadamente Ativo',
    description: 'Passeios diários de 1 a 2 horas, brincadeiras constantes',
    factor: 110,
  },
  {
    id: 'muito_ativo',
    label: 'Adulto Muito Ativo / Cão de Trabalho',
    description: 'Agility, corrida diária, pastoreio ou cães de esporte',
    factor: 130,
  },
  {
    id: 'senior',
    label: 'Sênior / Idoso (7+ anos)',
    description: 'Metabolismo basal reduzido e ritmo de atividade calmo',
    factor: 80,
  },
  {
    id: 'filhote',
    label: 'Filhote em Crescimento (2 a 12 meses)',
    description: 'Fase de alta demanda proteica e formação ósseo-muscular',
    factor: 140,
  },
  {
    id: 'femea_gestacao',
    label: 'Fêmea em Gestação (últimas 5 semanas)',
    description: 'Aporte energético ampliado para formação dos fetos (FEDIAF/NRC)',
    factor: 135,
    isReproductive: true,
  },
  {
    id: 'femea_lactacao',
    label: 'Fêmea em Lactação (amamentação)',
    description: 'Pico de demanda calórica para produção e secreção de leite materno',
    factor: 200,
    isReproductive: true,
  },
];

const CAT_ACTIVITIES: ActivityOption[] = [
  {
    id: 'gato_castrado',
    label: 'Adulto Castrado / Apartamento',
    description: 'Vida estritamente interna, tendência a sedentarismo',
    factor: 52,
  },
  {
    id: 'gato_ativo',
    label: 'Adulto Ativo / Acesso a Quintal',
    description: 'Rotina dinâmica, exploração e brincadeiras frequentes',
    factor: 75,
  },
  {
    id: 'gato_senior',
    label: 'Gato Sênior (10+ anos)',
    description: 'Menor taxa de atividade e digestibilidade específica',
    factor: 50,
  },
  {
    id: 'gato_filhote',
    label: 'Gatinho em Crescimento (até 12 meses)',
    description: 'Intensa proliferação celular e desenvolvimento muscular',
    factor: 100,
  },
  {
    id: 'gata_gestacao',
    label: 'Fêmea em Gestação (prenhez)',
    description: 'Crescimento ponderal linear desde o início da gestação (FEDIAF)',
    factor: 140,
    isReproductive: true,
  },
  {
    id: 'gata_lactacao',
    label: 'Fêmea em Lactação (amamentação)',
    description: 'Pico nutricional para produção láctea conforme o tamanho da ninhada',
    factor: 180,
    isReproductive: true,
  },
];

const COMMON_PACKAGE_SIZES = [
  { label: '1 kg', value: 1 },
  { label: '2.5 kg', value: 2.5 },
  { label: '3 kg', value: 3 },
  { label: '7.5 kg', value: 7.5 },
  { label: '10 kg', value: 10 },
  { label: '12 kg', value: 12 },
  { label: '15 kg', value: 15 },
];

const CALORIC_PRESETS = [
  { label: 'Light / Obesidade', value: 3200 },
  { label: 'Manutenção Padrão', value: 3700 },
  { label: 'Filhote / Alta Energia', value: 4100 },
];

export default function FoodCalculator() {
  const [species, setSpecies] = useState<Species>('CAO');
  const [weight, setWeight] = useState<number>(10);
  const [activityId, setActivityId] = useState<string>('castrado_baixa');
  const [bcs, setBcs] = useState<BodyConditionScore>('IDEAL');
  const [caloricDensity, setCaloricDensity] = useState<number>(3700); // kcal/kg
  const [packageWeight, setPackageWeight] = useState<number>(15); // kg
  const [packagePrice, setPackagePrice] = useState<number>(289.9); // R$
  const [mealsPerDay, setMealsPerDay] = useState<number>(2);

  // Troca de espécie ajusta os limites e defaults
  const handleSpeciesChange = (newSpecies: Species) => {
    setSpecies(newSpecies);
    if (newSpecies === 'GATO') {
      setWeight(4);
      setActivityId('gato_castrado');
      setPackageWeight(3);
      setPackagePrice(129.9);
      setCaloricDensity(3800);
    } else {
      setWeight(10);
      setActivityId('castrado_baixa');
      setPackageWeight(15);
      setPackagePrice(289.9);
      setCaloricDensity(3700);
    }
  };

  const currentActivities = species === 'CAO' ? DOG_ACTIVITIES : CAT_ACTIVITIES;
  const currentActivity = currentActivities.find((a) => a.id === activityId) || currentActivities[0];
  const currentBCS = BCS_OPTIONS.find((b) => b.id === bcs) || BCS_OPTIONS[1];

  // Cálculo zootécnico determinístico (FEDIAF 2025 / NRC 2006 / WSAVA)
  const calculation = useMemo(() => {
    const validWeight = Math.max(0.5, Math.min(weight, 100));
    
    // Peso metabólico: Cães = Peso^0.75 | Gatos = Peso^0.67
    const metabolicWeight = species === 'CAO'
      ? Math.pow(validWeight, 0.75)
      : Math.pow(validWeight, 0.67);

    // Necessidade Energética de Manutenção (NEM / MER) em kcal/dia:
    // Fator de atividade * Peso metabólico * Multiplicador do Escore de Condição Corporal
    const baseKcal = currentActivity.factor * metabolicWeight;
    const dailyKcal = Math.round(baseKcal * currentBCS.multiplier);

    // Gramas por dia = (kcal/dia / (kcal/kg)) * 1000
    const safeCaloricDensity = Math.max(2500, Math.min(caloricDensity, 5000));
    const dailyGrams = Math.round((dailyKcal / safeCaloricDensity) * 1000);
    const gramsPerMeal = Math.round(dailyGrams / mealsPerDay);

    // Rendimento da embalagem
    const totalPackageGrams = packageWeight * 1000;
    const daysDuration = dailyGrams > 0 ? Math.floor(totalPackageGrams / dailyGrams) : 0;

    // Custo por dia e por mês
    const costPerDay = daysDuration > 0 ? packagePrice / daysDuration : 0;
    const costPerMonth = costPerDay * 30;

    // Estimativa de Peso Ideal para animais fora do ECC 4-5
    let estimatedIdealWeight: number | null = null;
    if (bcs === 'SOBREPESO') {
      estimatedIdealWeight = Number((validWeight / 1.15).toFixed(1));
    } else if (bcs === 'OBESO') {
      estimatedIdealWeight = Number((validWeight / 1.30).toFixed(1));
    } else if (bcs === 'ABAIXO') {
      estimatedIdealWeight = Number((validWeight / 0.90).toFixed(1));
    }

    return {
      dailyKcal,
      dailyGrams,
      gramsPerMeal,
      daysDuration,
      costPerDay,
      costPerMonth,
      estimatedIdealWeight,
    };
  }, [species, weight, currentActivity, currentBCS, caloricDensity, packageWeight, packagePrice, mealsPerDay, bcs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Formulário Interativo de Parâmetros */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--border-cream)',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(8, 33, 21, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
          }}
        >
          <div style={{ borderBottom: '1px solid var(--border-cream)', paddingBottom: '14px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: 'var(--brand-forest-700)',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Passo 1 de 2
            </span>
            <h2
              style={{
                margin: 0,
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
              }}
            >
              Dados zootécnicos do pet
            </h2>
          </div>

          {/* Seletor Cão vs Gato */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--brand-forest-900)',
                marginBottom: '8px',
              }}
            >
              Espécie
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleSpeciesChange('CAO')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: species === 'CAO' ? '2px solid var(--brand-forest-700)' : '1px solid var(--border-cream)',
                  backgroundColor: species === 'CAO' ? 'var(--brand-forest-50)' : '#ffffff',
                  color: species === 'CAO' ? 'var(--brand-forest-900)' : 'var(--text-body)',
                  fontWeight: 700,
                  fontSize: '0.90rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
              >
                <Dog size={18} style={{ color: species === 'CAO' ? 'var(--brand-forest-700)' : 'var(--text-muted)' }} />
                Cão
              </button>
              <button
                type="button"
                onClick={() => handleSpeciesChange('GATO')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: species === 'GATO' ? '2px solid var(--brand-forest-700)' : '1px solid var(--border-cream)',
                  backgroundColor: species === 'GATO' ? 'var(--brand-forest-50)' : '#ffffff',
                  color: species === 'GATO' ? 'var(--brand-forest-900)' : 'var(--text-body)',
                  fontWeight: 700,
                  fontSize: '0.90rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
              >
                <Cat size={18} style={{ color: species === 'GATO' ? 'var(--brand-forest-700)' : 'var(--text-muted)' }} />
                Gato
              </button>
            </div>
          </div>

          {/* Slider de Peso Corporal */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <label
                htmlFor="weight-input"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--brand-forest-900)',
                }}
              >
                Peso Corporal Atual
              </label>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-700)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {weight} <span style={{ fontSize: '0.80rem', fontWeight: 600 }}>kg</span>
              </span>
            </div>
            <input
              id="weight-input"
              type="range"
              min={species === 'CAO' ? 1 : 1}
              max={species === 'CAO' ? 70 : 12}
              step={species === 'CAO' ? (weight < 5 ? 0.5 : 1) : 0.2}
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'var(--brand-forest-700)',
                cursor: 'pointer',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>{species === 'CAO' ? '1 kg (Mini)' : '1 kg (Pequeno)'}</span>
              <span>{species === 'CAO' ? '25 kg (Médio)' : '5 kg (Médio)'}</span>
              <span>{species === 'CAO' ? '70 kg (Gigante)' : '12 kg (Grande)'}</span>
            </div>
          </div>

          {/* Escore de Condição Corporal (ECC / BCS 1 a 9) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--brand-forest-900)',
                }}
              >
                Condição Corporal (ECC / WSAVA)
              </label>
              <span
                style={{
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  color: 'var(--brand-forest-700)',
                  backgroundColor: 'var(--brand-forest-50)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-cream)',
                }}
              >
                {currentBCS.bcsRange}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
              {BCS_OPTIONS.map((opt) => {
                const isSelected = bcs === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBcs(opt.id)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid var(--brand-forest-700)' : '1px solid var(--border-cream)',
                      backgroundColor: isSelected ? 'var(--brand-forest-50)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isSelected ? 'var(--brand-forest-900)' : 'var(--text-body)' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                      {opt.sublabel}
                    </div>
                  </button>
                );
              })}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {currentBCS.description}
            </p>
          </div>

          {/* Nível de Atividade / Fase de Vida / Reprodução */}
          <div>
            <label
              htmlFor="activity-select"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--brand-forest-900)',
                marginBottom: '8px',
              }}
            >
              Fase de Vida &amp; Rotina de Exercícios
            </label>
            <select
              id="activity-select"
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-cream)',
                backgroundColor: '#ffffff',
                fontSize: '0.88rem',
                color: 'var(--brand-forest-900)',
                fontWeight: 600,
                outline: 'none',
              }}
            >
              {currentActivities.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.label}
                </option>
              ))}
            </select>
            <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {currentActivity.description}
            </p>
          </div>

          <div style={{ borderBottom: '1px solid var(--border-cream)', paddingBottom: '14px', paddingTop: '8px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: 'var(--brand-forest-700)',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Passo 2 de 2
            </span>
            <h2
              style={{
                margin: 0,
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--brand-forest-900)',
              }}
            >
              Dados da ração e embalagem
            </h2>
          </div>

          {/* Densidade Calórica Editável */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <label
                htmlFor="caloric-density-input"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--brand-forest-900)',
                }}
              >
                Densidade Calórica (kcal/kg)
              </label>
              <span
                style={{
                  fontSize: '0.90rem',
                  fontWeight: 800,
                  color: 'var(--brand-forest-700)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {caloricDensity} <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>kcal/kg</span>
              </span>
            </div>

            {/* Presets de Densidade */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {CALORIC_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setCaloricDensity(preset.value)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: caloricDensity === preset.value ? '2px solid var(--brand-forest-700)' : '1px solid var(--border-cream)',
                    backgroundColor: caloricDensity === preset.value ? 'var(--brand-forest-50)' : '#ffffff',
                    color: caloricDensity === preset.value ? 'var(--brand-forest-900)' : 'var(--text-body)',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <input
              id="caloric-density-input"
              type="number"
              min={2500}
              max={5000}
              step={50}
              value={caloricDensity}
              onChange={(e) => setCaloricDensity(parseInt(e.target.value) || 3700)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-cream)',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--brand-forest-900)',
                outline: 'none',
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Consulte o verso da embalagem no item <em>Energia Metabolizável</em>. O padrão comum é ~3.700 kcal/kg.
            </p>
          </div>

          {/* Tamanho da Embalagem */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--brand-forest-900)',
                marginBottom: '8px',
              }}
            >
              Tamanho do Pacote
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {COMMON_PACKAGE_SIZES.map((sz) => (
                <button
                  key={sz.value}
                  type="button"
                  onClick={() => setPackageWeight(sz.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: packageWeight === sz.value ? '2px solid var(--brand-forest-700)' : '1px solid var(--border-cream)',
                    backgroundColor: packageWeight === sz.value ? 'var(--brand-forest-50)' : '#ffffff',
                    color: packageWeight === sz.value ? 'var(--brand-forest-900)' : 'var(--text-body)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preço Pago na Embalagem */}
          <div>
            <label
              htmlFor="price-input"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--brand-forest-900)',
                marginBottom: '8px',
              }}
            >
              Preço da Embalagem (R$)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                }}
              >
                R$
              </span>
              <input
                id="price-input"
                type="number"
                min={1}
                max={2000}
                step={0.5}
                value={packagePrice}
                onChange={(e) => setPackagePrice(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 40px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-cream)',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: 'var(--brand-forest-900)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Refeições por Dia */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--brand-forest-900)',
                marginBottom: '8px',
              }}
            >
              Frequência de Alimentação Diária
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMealsPerDay(num)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: mealsPerDay === num ? '2px solid var(--brand-forest-700)' : '1px solid var(--border-cream)',
                    backgroundColor: mealsPerDay === num ? 'var(--brand-forest-50)' : '#ffffff',
                    color: mealsPerDay === num ? 'var(--brand-forest-900)' : 'var(--text-body)',
                    fontWeight: 700,
                    fontSize: '0.80rem',
                    cursor: 'pointer',
                  }}
                >
                  {num}x ao dia
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Painel de Resultados & Métricas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card Principal: Porção Diária */}
          <div
            style={{
              backgroundColor: 'var(--brand-forest-900)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 12px 30px rgba(8, 33, 21, 0.16)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: 'rgba(5, 150, 105, 0.15)',
                filter: 'blur(30px)',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: 'var(--brand-forest-300)',
                }}
              >
                <Sparkles size={14} /> Recomendação Zootécnica Estimada
              </span>
              {bcs !== 'IDEAL' && (
                <span
                  style={{
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: bcs === 'ABAIXO' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                    color: bcs === 'ABAIXO' ? '#93c5fd' : '#fef08a',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  {bcs === 'ABAIXO' ? 'Ajustado para ganho' : 'Ajustado para déficit'}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '3.2rem',
                  fontWeight: 900,
                  lineHeight: 1,
                  color: '#ffffff',
                }}
              >
                {calculation.dailyGrams}
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--brand-forest-200)' }}>
                gramas / dia
              </span>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.85)' }}>
              Para o peso de <strong>{weight} kg</strong>, forneça <strong>{calculation.gramsPerMeal}g</strong> em cada uma das <strong>{mealsPerDay} refeições diárias</strong>.
            </p>

            {calculation.estimatedIdealWeight && (
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '18px',
                  fontSize: '0.80rem',
                  color: 'rgba(255, 255, 255, 0.90)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <HeartPulse size={16} style={{ color: 'var(--brand-forest-300)', flexShrink: 0 }} />
                <span>
                  Peso ideal estimado: <strong>~{calculation.estimatedIdealWeight} kg</strong>. A porção diária já contempla o ajuste calórico gradual conforme diretrizes da WSAVA e FEDIAF.
                </span>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.14)',
                paddingTop: '18px',
              }}
            >
              <div>
                <span style={{ display: 'block', fontSize: '0.70rem', color: 'rgba(255, 255, 255, 0.65)', fontWeight: 600 }}>
                  Energia Diária Necessária
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                  {calculation.dailyKcal} <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>kcal/dia</span>
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.70rem', color: 'rgba(255, 255, 255, 0.65)', fontWeight: 600 }}>
                  Densidade da Ração
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                  {caloricDensity} <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>kcal/kg</span>
                </span>
              </div>
            </div>
          </div>

          {/* Cards Secundários: Duração e Economia */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Duração do Pacote */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid var(--border-cream)',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(8, 33, 21, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-forest-700)', marginBottom: '8px' }}>
                <CalendarDays size={18} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Rendimento
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--brand-forest-900)' }}>
                  {calculation.daysDuration}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>dias</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                O pacote de {packageWeight}kg dura aprox. {Math.round(calculation.daysDuration / 30)} meses.
              </p>
            </div>

            {/* Custo por Dia */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid var(--border-cream)',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(8, 33, 21, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', marginBottom: '8px' }}>
                <Coins size={18} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Custo Diário
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '0.90rem', fontWeight: 700, color: 'var(--text-muted)' }}>R$</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--brand-forest-900)' }}>
                  {calculation.costPerDay.toFixed(2).replace('.', ',')}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>/dia</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Equivalente a R$ {calculation.costPerMonth.toFixed(2).replace('.', ',')} por mês (30 dias).
              </p>
            </div>
          </div>

          {/* Card Informativo com Dica Zootécnica */}
          <div
            style={{
              backgroundColor: 'var(--bg-muted)',
              borderRadius: '14px',
              border: '1px solid var(--border-cream)',
              padding: '16px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={20} style={{ color: 'var(--brand-forest-700)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.80rem', color: 'var(--text-body)', lineHeight: 1.5 }}>
              <strong>Dica de Manejo (ABINPET / FEDIAF):</strong> Utilize sempre uma <strong>balança de cozinha digital</strong> em vez de copos medidores plásticos. O tamanho e a densidade dos croquetes variam entre marcas, gerando variações de até 25% na porção real fornecida.
            </div>
          </div>

          {/* Links Rápidos */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href="/catalogo"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-forest-700)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.84rem',
                textDecoration: 'none',
              }}
            >
              Explorar Catálogo de Alimentos <ArrowRight size={14} />
            </Link>
            <Link
              href="/comparar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-cream)',
                color: 'var(--brand-forest-900)',
                fontWeight: 700,
                fontSize: '0.84rem',
                textDecoration: 'none',
              }}
            >
              <Scale size={15} /> Comparar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
