import { Especie, FaseVida } from './types';

/**
 * Padrões e Perfis Nutricionais do Manual Pet Food Brasil (ABINPET 11ª Edição)
 * Valores mínimos e máximos de segurança expressos em Matéria Seca (MS).
 */

export interface AbinpetNutrientStandard {
  proteinaBrutaMinMS: number;
  proteinaBrutaMargemSegurancaMS: number; // Mínimo + margem técnica de segurança
  extratoEtereoMinMS: number;
  extratoEtereoMargemSegurancaMS: number;
  calcioMinMS: number;
  calcioMaxSeguroMS: number;
  fosforoMinMS: number;
  fosforoMaxSeguroMS: number;
  relacaoCaPIdealMin: number;
  relacaoCaPIdealMax: number;
  relacaoCaPToleranciaMin: number;
  relacaoCaPToleranciaMax: number;
}

export const ABINPET_STANDARDS: Record<string, AbinpetNutrientStandard> = {
  // Cão Adulto (Manutenção)
  'CAO_ADULTO': {
    proteinaBrutaMinMS: 18.0,
    proteinaBrutaMargemSegurancaMS: 20.0,
    extratoEtereoMinMS: 5.5,
    extratoEtereoMargemSegurancaMS: 7.0,
    calcioMinMS: 0.50,
    calcioMaxSeguroMS: 2.50,
    fosforoMinMS: 0.40,
    fosforoMaxSeguroMS: 1.60,
    relacaoCaPIdealMin: 1.1,
    relacaoCaPIdealMax: 1.6,
    relacaoCaPToleranciaMin: 1.0,
    relacaoCaPToleranciaMax: 2.0,
  },
  // Cão Filhote (Crescimento)
  'CAO_FILHOTE': {
    proteinaBrutaMinMS: 22.0,
    proteinaBrutaMargemSegurancaMS: 24.0,
    extratoEtereoMinMS: 8.5,
    extratoEtereoMargemSegurancaMS: 9.5,
    calcioMinMS: 1.00,
    calcioMaxSeguroMS: 1.80,
    fosforoMinMS: 0.80,
    fosforoMaxSeguroMS: 1.60,
    relacaoCaPIdealMin: 1.1,
    relacaoCaPIdealMax: 1.5,
    relacaoCaPToleranciaMin: 1.0,
    relacaoCaPToleranciaMax: 2.0,
  },
  // Gato Adulto (Manutenção)
  'GATO_ADULTO': {
    proteinaBrutaMinMS: 26.0,
    proteinaBrutaMargemSegurancaMS: 28.0,
    extratoEtereoMinMS: 9.0,
    extratoEtereoMargemSegurancaMS: 10.0,
    calcioMinMS: 0.60,
    calcioMaxSeguroMS: 2.00,
    fosforoMinMS: 0.50,
    fosforoMaxSeguroMS: 1.60,
    relacaoCaPIdealMin: 1.1,
    relacaoCaPIdealMax: 1.6,
    relacaoCaPToleranciaMin: 1.0,
    relacaoCaPToleranciaMax: 2.0,
  },
  // Gato Filhote (Crescimento)
  'GATO_FILHOTE': {
    proteinaBrutaMinMS: 30.0,
    proteinaBrutaMargemSegurancaMS: 32.0,
    extratoEtereoMinMS: 9.0,
    extratoEtereoMargemSegurancaMS: 10.0,
    calcioMinMS: 1.00,
    calcioMaxSeguroMS: 2.00,
    fosforoMinMS: 0.80,
    fosforoMaxSeguroMS: 1.60,
    relacaoCaPIdealMin: 1.1,
    relacaoCaPIdealMax: 1.5,
    relacaoCaPToleranciaMin: 1.0,
    relacaoCaPToleranciaMax: 2.0,
  },
};

export function getAbinpetStandard(especie: Especie, faseVida: FaseVida): AbinpetNutrientStandard {
  const isFilhote = faseVida === 'CRESCIMENTO_INICIAL' || faseVida === 'CRESCIMENTO_FINAL';
  const key = `${especie}_${isFilhote ? 'FILHOTE' : 'ADULTO'}`;
  return ABINPET_STANDARDS[key] || ABINPET_STANDARDS['CAO_ADULTO'];
}
