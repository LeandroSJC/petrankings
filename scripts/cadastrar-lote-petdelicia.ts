import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import * as cheerio from 'cheerio';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel } from './cadastrar-por-url';
import { calcularScoreAnaliseRotulo, generateEditorialOpinionWithGemini } from '../src/lib/audit-engine';
import { generateCustodyHtml } from '../src/lib/custody-template';

interface PetDeliciaMapping {
  officialUrl: string;
  partnerUrl: string;
  commercialName: string;
  slug: string;
  species: 'CAO' | 'GATO';
  lifeStage: 'ADULTO' | 'CRESCIMENTO_INICIAL' | 'CRESCIMENTO_FINAL' | 'SENIOR';
  breedSize: 'MINI_PEQUENO' | 'MEDIO_GRANDE' | 'TODOS';
  foodType: 'UMIDO' | 'COMPLEMENTAR';
  legalCategory: 'ALIMENTO_COMPLETO' | 'ALIMENTO_COMPLEMENTAR';
  coadjuvanteCondition?: 'RENAL' | 'RECUPERACAO' | 'OBESIDADE' | 'HIPOALERGENICO';
  garantias: {
    umidadeMaxPct: number;
    proteinaBrutaMinPct: number;
    extratoEtereoMinPct: number;
    materiaFibrosaMaxPct: number;
    materiaMineralMaxPct: number;
    calcioMinPct: number;
    calcioMaxPct: number;
    fosforoMinPct: number;
    sodioMinPct: number;
  };
  ingredientes: string[];
}

const mappings: PetDeliciaMapping[] = [
  // --- 14 ALIMENTOS COMPLETOS PARA CÃES ---
  {
    officialUrl: 'https://petdelicia.com.br/produto/panelinha-de-carne/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-panelinha-de-carne-para-caes-3104882/p',
    commercialName: 'Pet Delícia Panelinha de Carne Cães Adultos',
    slug: 'pet-delicia-panelinha-de-carne-caes-adultos',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 76.0,
      proteinaBrutaMinPct: 7.5,
      extratoEtereoMinPct: 3.8,
      materiaFibrosaMaxPct: 1.2,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.15,
      calcioMaxPct: 0.21,
      fosforoMinPct: 0.12,
      sodioMinPct: 0.03,
    },
    ingredientes: [
      'Carne bovina', 'Coração bovino', 'Língua bovina', 'Arroz parboilizado', 'Arroz integral',
      'Abobrinha', 'Cenoura', 'Inhame', 'Ervilhas', 'Chuchu', 'Óleo de girassol',
      'Lecitina de soja não transgênica', 'Aveia em flocos', 'Semente de linhaça', 'Alecrim',
      'Açafrão-da-terra (cúrcuma)', 'Pimenta preta (piperina)', 'Algas', 'Levedura seca de cervejaria'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/cacarolinha-de-carne/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-cacarolinha-de-carne-para-caes-3104883/p',
    commercialName: 'Pet Delícia Caçarolinha de Carne Cães Adultos',
    slug: 'pet-delicia-cacarolinha-de-carne-caes-adultos',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 77.0,
      proteinaBrutaMinPct: 7.5,
      extratoEtereoMinPct: 3.5,
      materiaFibrosaMaxPct: 1.2,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.16,
      calcioMaxPct: 0.22,
      fosforoMinPct: 0.13,
      sodioMinPct: 0.03,
    },
    ingredientes: [
      'Carne bovina', 'Coração bovino', 'Fígado bovino', 'Arroz parboilizado', 'Abóbora',
      'Chuchu', 'Maçã', 'Beterraba', 'Óleo de girassol', 'Lecitina de soja não transgênica',
      'Aveia em flocos', 'Semente de linhaça', 'Alecrim', 'Cúrcuma', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/papinha-de-frango-caes-filhotes/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-papinha-de-frango-para-caes-filhotes-3104885/p',
    commercialName: 'Pet Delícia Papinha de Frango Cães Filhotes',
    slug: 'pet-delicia-papinha-de-frango-caes-filhotes',
    species: 'CAO',
    lifeStage: 'CRESCIMENTO_INICIAL',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 75.0,
      proteinaBrutaMinPct: 9.5,
      extratoEtereoMinPct: 3.5,
      materiaFibrosaMaxPct: 1.2,
      materiaMineralMaxPct: 2.0,
      calcioMinPct: 0.35,
      calcioMaxPct: 0.47,
      fosforoMinPct: 0.29,
      sodioMinPct: 0.10,
    },
    ingredientes: [
      'Peito de frango', 'Moela de frango', 'Arroz parboilizado', 'Cenoura', 'Mandioquinha',
      'Maçã', 'Óleo de girassol', 'Lecitina de soja não transgênica', 'Aveia em flocos',
      'Semente de linhaça', 'Levedura seca de cervejaria', 'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/jardineira-de-frango-receita-nova/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-jardineira-de-frango-para-caes-3104884/p',
    commercialName: 'Pet Delícia Jardineira de Frango Cães Adultos',
    slug: 'pet-delicia-jardineira-de-frango-caes-adultos',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 78.0,
      proteinaBrutaMinPct: 8.0,
      extratoEtereoMinPct: 3.5,
      materiaFibrosaMaxPct: 1.2,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.16,
      calcioMaxPct: 0.22,
      fosforoMinPct: 0.13,
      sodioMinPct: 0.03,
    },
    ingredientes: [
      'Peito de frango', 'Moela de frango', 'Coração de frango', 'Arroz parboilizado', 'Batata doce',
      'Cenoura', 'Ervilhas', 'Chuchu', 'Abobrinha', 'Óleo de girassol', 'Lecitina de soja não transgênica',
      'Aveia em flocos', 'Semente de linhaça', 'Alecrim', 'Cúrcuma', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/risotinho-de-frango/',
    partnerUrl: 'https://www.petz.com.br/produto/racao-umida-pet-delicia-risotinho-de-frango-para-caes-adultos-128635',
    commercialName: 'Pet Delícia Risotinho de Frango Cães Adultos',
    slug: 'pet-delicia-risotinho-de-frango-caes-adultos',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 78.0,
      proteinaBrutaMinPct: 8.0,
      extratoEtereoMinPct: 3.5,
      materiaFibrosaMaxPct: 1.2,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.16,
      calcioMaxPct: 0.22,
      fosforoMinPct: 0.13,
      sodioMinPct: 0.03,
    },
    ingredientes: [
      'Peito de frango', 'Moela de frango', 'Arroz integral', 'Arroz parboilizado', 'Abóbora',
      'Cenoura', 'Maçã', 'Óleo de girassol', 'Lecitina de soja não transgênica', 'Aveia em flocos',
      'Semente de linhaça', 'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/cordeiro-com-legumes/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-cordeiro-com-legumes-para-caes-3104886/p',
    commercialName: 'Pet Delícia Cordeiro com Legumes Cães Adultos',
    slug: 'pet-delicia-cordeiro-com-legumes-caes-adultos',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 77.0,
      proteinaBrutaMinPct: 7.5,
      extratoEtereoMinPct: 4.0,
      materiaFibrosaMaxPct: 1.2,
      materiaMineralMaxPct: 1.6,
      calcioMinPct: 0.17,
      calcioMaxPct: 0.23,
      fosforoMinPct: 0.13,
      sodioMinPct: 0.03,
    },
    ingredientes: [
      'Carne de cordeiro', 'Coração de cordeiro', 'Arroz parboilizado', 'Abóbora', 'Cenoura',
      'Chuchu', 'Inhame', 'Óleo de girassol', 'Lecitina de soja não transgênica', 'Aveia em flocos',
      'Semente de linhaça', 'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/peixe-com-legumes/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-peixe-com-legumes-para-caes-3104887/p',
    commercialName: 'Pet Delícia Peixe com Legumes Cães Adultos',
    slug: 'pet-delicia-peixe-com-legumes-caes-adultos',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 79.0,
      proteinaBrutaMinPct: 7.5,
      extratoEtereoMinPct: 3.0,
      materiaFibrosaMaxPct: 1.2,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.16,
      calcioMaxPct: 0.22,
      fosforoMinPct: 0.12,
      sodioMinPct: 0.03,
    },
    ingredientes: [
      'Peixe branco (tilápia)', 'Salmão', 'Arroz parboilizado', 'Batata', 'Cenoura',
      'Chuchu', 'Ervilhas', 'Óleo de girassol', 'Lecitina de soja não transgênica', 'Aveia em flocos',
      'Semente de linhaça', 'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/frango-com-maca-light/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-frango-com-maca-light-para-caes-3104888/p',
    commercialName: 'Pet Delícia Frango com Maçã Light Cães Adultos',
    slug: 'pet-delicia-frango-com-maca-light-caes-adultos',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    coadjuvanteCondition: 'OBESIDADE',
    garantias: {
      umidadeMaxPct: 80.0,
      proteinaBrutaMinPct: 8.0,
      extratoEtereoMinPct: 2.5,
      materiaFibrosaMaxPct: 1.8,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.16,
      calcioMaxPct: 0.22,
      fosforoMinPct: 0.12,
      sodioMinPct: 0.03,
    },
    ingredientes: [
      'Peito de frango', 'Moela de frango', 'Arroz parboilizado', 'Maçã', 'Chuchu',
      'Abobrinha', 'Cenoura', 'Óleo de girassol', 'Aveia em flocos', 'Semente de linhaça',
      'Lecitina de soja não transgênica', 'Cúrcuma', 'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/low-carb/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-low-carb-para-caes-3104889/p',
    commercialName: 'Pet Delícia Low Carb Cães Adultos',
    slug: 'pet-delicia-low-carb-caes-adultos',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    coadjuvanteCondition: 'OBESIDADE',
    garantias: {
      umidadeMaxPct: 78.0,
      proteinaBrutaMinPct: 9.0,
      extratoEtereoMinPct: 4.0,
      materiaFibrosaMaxPct: 2.0,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.18,
      calcioMaxPct: 0.24,
      fosforoMinPct: 0.14,
      sodioMinPct: 0.03,
    },
    ingredientes: [
      'Carne bovina', 'Peito de frango', 'Moela de frango', 'Abobrinha', 'Chuchu',
      'Brócolis', 'Cenoura', 'Óleo de girassol', 'Aveia em flocos', 'Semente de linhaça',
      'Cúrcuma', 'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/hipercalorica-para-caes/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-hipercalorica-para-caes-3104890/p',
    commercialName: 'Pet Delícia Hipercalórica Cães',
    slug: 'pet-delicia-hipercalorica-caes',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    coadjuvanteCondition: 'RECUPERACAO',
    garantias: {
      umidadeMaxPct: 74.0,
      proteinaBrutaMinPct: 9.5,
      extratoEtereoMinPct: 6.4,
      materiaFibrosaMaxPct: 1.6,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.19,
      calcioMaxPct: 0.24,
      fosforoMinPct: 0.14,
      sodioMinPct: 0.04,
    },
    ingredientes: [
      'Peito de frango', 'Moela de frango', 'Carne bovina', 'Arroz parboilizado', 'Batata doce',
      'Óleo de girassol', 'Cenoura', 'Aveia em flocos', 'Gema de ovo', 'Semente de linhaça',
      'Lecitina de soja não transgênica', 'Levedura seca de cervejaria', 'Cúrcuma', 'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/control-dog/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-control-dog-para-caes-3104891/p',
    commercialName: 'Pet Delícia Control Dog Cães Adultos',
    slug: 'pet-delicia-control-dog-caes-adultos',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    coadjuvanteCondition: 'RENAL',
    garantias: {
      umidadeMaxPct: 80.0,
      proteinaBrutaMinPct: 5.5,
      extratoEtereoMinPct: 3.5,
      materiaFibrosaMaxPct: 1.5,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.10,
      calcioMaxPct: 0.17,
      fosforoMinPct: 0.07,
      sodioMinPct: 0.023,
    },
    ingredientes: [
      'Peito de frango', 'Clara de ovo', 'Arroz parboilizado', 'Abóbora', 'Chuchu',
      'Maçã', 'Óleo de girassol', 'Aveia em flocos', 'Lecitina de soja não transgênica',
      'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/senior-cachorro/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-senior-para-caes-3104892/p',
    commercialName: 'Pet Delícia Sênior Cães Idosos',
    slug: 'pet-delicia-senior-caes-idosos',
    species: 'CAO',
    lifeStage: 'SENIOR',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 79.0,
      proteinaBrutaMinPct: 7.5,
      extratoEtereoMinPct: 3.2,
      materiaFibrosaMaxPct: 1.5,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.15,
      calcioMaxPct: 0.21,
      fosforoMinPct: 0.11,
      sodioMinPct: 0.03,
    },
    ingredientes: [
      'Peito de frango', 'Carne bovina', 'Arroz integral', 'Aveia em flocos', 'Abóbora',
      'Cenoura', 'Chuchu', 'Óleo de girassol', 'Lecitina de soja não transgênica',
      'Semente de linhaça', 'Alecrim', 'Cúrcuma', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/veggie-dog/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-veggie-dog-para-caes-3104893/p',
    commercialName: 'Pet Delícia Veggie Dog Cães Adultos',
    slug: 'pet-delicia-veggie-dog-caes-adultos',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 80.0,
      proteinaBrutaMinPct: 6.0,
      extratoEtereoMinPct: 2.5,
      materiaFibrosaMaxPct: 1.8,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.15,
      calcioMaxPct: 0.21,
      fosforoMinPct: 0.10,
      sodioMinPct: 0.03,
    },
    ingredientes: [
      'Arroz integral', 'Lentilha', 'Grão-de-bico', 'Ervilhas', 'Batata doce',
      'Cenoura', 'Chuchu', 'Maçã', 'Óleo de girassol', 'Aveia em flocos',
      'Semente de linhaça', 'Lecitina de soja não transgênica', 'Algas', 'Alecrim',
      'Cúrcuma', 'Levedura seca de cervejaria'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/escondidinho-suino-2/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-escondidinho-suino-para-caes-3104894/p',
    commercialName: 'Pet Delícia Escondidinho Suíno Cães Adultos',
    slug: 'pet-delicia-escondidinho-suino-caes-adultos',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 77.0,
      proteinaBrutaMinPct: 8.0,
      extratoEtereoMinPct: 3.8,
      materiaFibrosaMaxPct: 1.2,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.16,
      calcioMaxPct: 0.22,
      fosforoMinPct: 0.13,
      sodioMinPct: 0.03,
    },
    ingredientes: [
      'Lombo suíno', 'Coração suíno', 'Mandioquinha', 'Batata doce', 'Cenoura',
      'Chuchu', 'Arroz parboilizado', 'Óleo de girassol', 'Aveia em flocos',
      'Semente de linhaça', 'Lecitina de soja não transgênica', 'Alecrim', 'Algas'
    ],
  },

  // --- 8 ALIMENTOS COMPLETOS PARA GATOS ---
  {
    officialUrl: 'https://petdelicia.com.br/produto/papinha-de-frango-para-gatos-filhotes/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-papinha-de-frango-para-gatos-filhotes-3104895/p',
    commercialName: 'Pet Delícia Papinha de Frango Gatos Filhotes',
    slug: 'pet-delicia-papinha-de-frango-gatos-filhotes',
    species: 'GATO',
    lifeStage: 'CRESCIMENTO_INICIAL',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 76.0,
      proteinaBrutaMinPct: 12.5,
      extratoEtereoMinPct: 4.5,
      materiaFibrosaMaxPct: 1.0,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.29,
      calcioMaxPct: 0.35,
      fosforoMinPct: 0.24,
      sodioMinPct: 0.07,
    },
    ingredientes: [
      'Peito de frango', 'Moela de frango', 'Fígado de frango', 'Arroz parboilizado', 'Abobrinha',
      'Cenoura', 'Óleo de girassol', 'Aveia em flocos', 'Semente de linhaça',
      'Lecitina de soja não transgênica', 'Taurina', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/hipercalorica-para-gatos/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-hipercalorica-para-gatos-3104896/p',
    commercialName: 'Pet Delícia Hipercalórica Gatos',
    slug: 'pet-delicia-hipercalorica-gatos',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    coadjuvanteCondition: 'RECUPERACAO',
    garantias: {
      umidadeMaxPct: 75.0,
      proteinaBrutaMinPct: 12.0,
      extratoEtereoMinPct: 6.0,
      materiaFibrosaMaxPct: 1.2,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.25,
      calcioMaxPct: 0.31,
      fosforoMinPct: 0.20,
      sodioMinPct: 0.06,
    },
    ingredientes: [
      'Peito de frango', 'Moela de frango', 'Carne bovina', 'Gema de ovo', 'Arroz parboilizado',
      'Batata doce', 'Óleo de girassol', 'Aveia em flocos', 'Lecitina de soja não transgênica',
      'Taurina', 'Levedura seca', 'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/control-cat/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-control-cat-para-gatos-3104897/p',
    commercialName: 'Pet Delícia Control Cat Gatos Adultos',
    slug: 'pet-delicia-control-cat-gatos-adultos',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    coadjuvanteCondition: 'RENAL',
    garantias: {
      umidadeMaxPct: 79.0,
      proteinaBrutaMinPct: 9.0,
      extratoEtereoMinPct: 4.5,
      materiaFibrosaMaxPct: 1.0,
      materiaMineralMaxPct: 1.2,
      calcioMinPct: 0.15,
      calcioMaxPct: 0.21,
      fosforoMinPct: 0.10,
      sodioMinPct: 0.05,
    },
    ingredientes: [
      'Peito de frango', 'Clara de ovo', 'Arroz parboilizado', 'Abóbora', 'Chuchu',
      'Maçã', 'Óleo de girassol', 'Aveia em flocos', 'Lecitina de soja não transgênica',
      'Taurina', 'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/senior-gato/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-senior-para-gatos-3104898/p',
    commercialName: 'Pet Delícia Sênior Gatos Idosos',
    slug: 'pet-delicia-senior-gatos-idosos',
    species: 'GATO',
    lifeStage: 'SENIOR',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 78.0,
      proteinaBrutaMinPct: 10.5,
      extratoEtereoMinPct: 4.0,
      materiaFibrosaMaxPct: 1.2,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.20,
      calcioMaxPct: 0.26,
      fosforoMinPct: 0.16,
      sodioMinPct: 0.05,
    },
    ingredientes: [
      'Peito de frango', 'Moela de frango', 'Carne bovina', 'Arroz integral', 'Aveia em flocos',
      'Abóbora', 'Cenoura', 'Chuchu', 'Óleo de girassol', 'Lecitina de soja não transgênica',
      'Semente de linhaça', 'Taurina', 'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/frango-com-mamao/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-frango-com-mamao-para-gatos-3104899/p',
    commercialName: 'Pet Delícia Frango com Mamão Gatos Adultos',
    slug: 'pet-delicia-frango-com-mamao-gatos-adultos',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 78.0,
      proteinaBrutaMinPct: 11.0,
      extratoEtereoMinPct: 4.0,
      materiaFibrosaMaxPct: 1.0,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.22,
      calcioMaxPct: 0.28,
      fosforoMinPct: 0.18,
      sodioMinPct: 0.05,
    },
    ingredientes: [
      'Peito de frango', 'Moela de frango', 'Coração de frango', 'Mamão', 'Abobrinha',
      'Cenoura', 'Arroz parboilizado', 'Óleo de girassol', 'Aveia em flocos',
      'Semente de linhaça', 'Lecitina de soja não transgênica', 'Taurina', 'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/frango-fit/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-frango-fit-para-gatos-3104900/p',
    commercialName: 'Pet Delícia Frango Fit Gatos Adultos',
    slug: 'pet-delicia-frango-fit-gatos-adultos',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    coadjuvanteCondition: 'OBESIDADE',
    garantias: {
      umidadeMaxPct: 79.0,
      proteinaBrutaMinPct: 11.5,
      extratoEtereoMinPct: 3.0,
      materiaFibrosaMaxPct: 1.5,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.20,
      calcioMaxPct: 0.26,
      fosforoMinPct: 0.17,
      sodioMinPct: 0.05,
    },
    ingredientes: [
      'Peito de frango', 'Moela de frango', 'Abobrinha', 'Chuchu', 'Cenoura',
      'Arroz parboilizado', 'Óleo de girassol', 'Aveia em flocos', 'Semente de linhaça',
      'Lecitina de soja não transgênica', 'Taurina', 'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/file-de-peixe/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-file-de-peixe-para-gatos-3104901/p',
    commercialName: 'Pet Delícia Filé de Peixe Gatos Adultos',
    slug: 'pet-delicia-file-de-peixe-gatos-adultos',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 79.0,
      proteinaBrutaMinPct: 10.5,
      extratoEtereoMinPct: 3.5,
      materiaFibrosaMaxPct: 1.0,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.21,
      calcioMaxPct: 0.27,
      fosforoMinPct: 0.17,
      sodioMinPct: 0.05,
    },
    ingredientes: [
      'Tilápia', 'Salmão', 'Abobrinha', 'Chuchu', 'Cenoura',
      'Arroz parboilizado', 'Óleo de girassol', 'Aveia em flocos', 'Semente de linhaça',
      'Lecitina de soja não transgênica', 'Taurina', 'Alecrim', 'Algas'
    ],
  },
  {
    officialUrl: 'https://petdelicia.com.br/produto/cordeiro/',
    partnerUrl: 'https://www.petlove.com.br/racao-umida-pet-delicia-natural-cordeiro-para-gatos-3104902/p',
    commercialName: 'Pet Delícia Cordeiro Gatos Adultos',
    slug: 'pet-delicia-cordeiro-gatos-adultos',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
    garantias: {
      umidadeMaxPct: 78.0,
      proteinaBrutaMinPct: 10.5,
      extratoEtereoMinPct: 4.5,
      materiaFibrosaMaxPct: 1.0,
      materiaMineralMaxPct: 1.5,
      calcioMinPct: 0.22,
      calcioMaxPct: 0.28,
      fosforoMinPct: 0.18,
      sodioMinPct: 0.05,
    },
    ingredientes: [
      'Carne de cordeiro', 'Coração de cordeiro', 'Abóbora', 'Cenoura', 'Chuchu',
      'Arroz parboilizado', 'Óleo de girassol', 'Aveia em flocos', 'Semente de linhaça',
      'Lecitina de soja não transgênica', 'Taurina', 'Alecrim', 'Algas'
    ],
  },
];

async function downloadAndOptimizePackshot(imageUrl: string, targetPath: string): Promise<boolean> {
  try {
    const resp = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://petdelicia.com.br/',
      },
    });
    if (!resp.ok) {
      console.error(`Falha no download da imagem (${resp.status}): ${imageUrl}`);
      return false;
    }
    const buffer = Buffer.from(await resp.arrayBuffer());
    await sharp(buffer)
      .resize(600, 600, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .webp({ quality: 85 })
      .toFile(targetPath);
    return true;
  } catch (err: any) {
    console.error(`Erro ao processar packshot ${imageUrl}:`, err.message);
    return false;
  }
}

async function main() {
  await ensureTunnelOpen();

  console.log(`\n================================================================`);
  console.log(`🚀 INICIANDO INGESTÃO OFICIAL — PET DELÍCIA (${mappings.length} PRODUTOS)`);
  console.log(`================================================================\n`);

  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  for (let i = 0; i < mappings.length; i++) {
    const item = mappings[i];
    console.log(`\n------------------------------------------------------------`);
    console.log(`👉 [${i + 1}/${mappings.length}] Processando: ${item.commercialName}`);
    console.log(`   URL Oficial: ${item.officialUrl}`);
    console.log(`------------------------------------------------------------`);

    try {
      // 1. Verifica se já existe pelo slug ou URL
      const existing = await prisma.product.findFirst({
        where: {
          OR: [
            { slug: item.slug },
            { sourceUrl: item.officialUrl },
            { sourceUrl: item.officialUrl.replace(/\/$/, '') },
          ],
        },
        select: { id: true, commercialName: true },
      });

      if (existing) {
        console.log(`⏩ Produto já existente no banco: [${existing.id}] ${existing.commercialName}. Pulando.`);
        skippedCount++;
        continue;
      }

      // 2. Busca o HTML oficial do fabricante para custódia e extração da imagem
      const respOfficial = await fetch(item.officialUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const officialHtml = await respOfficial.text();
      const $ = cheerio.load(officialHtml);

      // Extrai imagem oficial de alta definição
      let rawImg = $('.woocommerce-product-gallery__image img').first().attr('src') ||
                   $('meta[property="og:image"]').attr('content') ||
                   $('img.wp-post-image').first().attr('src') || '';
      rawImg = rawImg.split('?')[0];

      // 3. ID único do produto no Prisma
      const newId = 'cmtz' + crypto.randomBytes(10).toString('hex');

      // 4. Salva a imagem WebP
      const packshotFilename = `produto_${newId}.webp`;
      const packshotLocalPath = path.join(process.cwd(), 'public', 'uploads', packshotFilename);
      const packshotPublicUrl = `/uploads/${packshotFilename}`;

      let imgDownloaded = false;
      if (rawImg) {
        imgDownloaded = await downloadAndOptimizePackshot(rawImg, packshotLocalPath);
      }

      // 5. Calcula o Score Técnico Determinístico
      const rotulagemInput = {
        topIngredientes: item.ingredientes,
        containsGmo: false,
        antioxidantType: 'NATURAL' as const,
        meatClaimType: 'CARNE_MECANICAMENTE_SEPARADA' as const, // carnes e cortes frescos
      };

      const scoreResult = calcularScoreAnaliseRotulo(
        item.species,
        item.lifeStage,
        item.garantias,
        rotulagemInput,
        item.foodType
      );

      // 6. Gera Parecer Editorial com IA sem termos proibidos
      const editorialOpinion = await generateEditorialOpinionWithGemini({
        brand: 'Pet Delícia',
        commercialName: item.commercialName,
        species: item.species,
        lifeStage: item.lifeStage,
        breedSize: item.breedSize,
        foodType: item.foodType,
        scoreTotal: scoreResult.scoreTotal,
        classificationTier: scoreResult.classificacaoFaixa,
        extratoPontos: scoreResult.extratoPontos,
        nutrientesMS: scoreResult.nutrientesMS,
        relacaoCaP: scoreResult.relacaoCaP,
        garantias: item.garantias,
        topIngredientes: item.ingredientes,
        containsGmo: false,
        antioxidantType: 'NATURAL',
        meatClaimType: 'CARNE_MECANICAMENTE_SEPARADA',
      });

      // 7. Gera Documento de Custódia HTML
      const custodyHtml = generateCustodyHtml({
        id: newId,
        slug: item.slug,
        commercialName: item.commercialName,
        brand: 'Pet Delícia',
        manufacturerLegalName: 'Pet Delícia Indústria e Comércio de Alimentos Ltda.',
        legalCategory: item.legalCategory,
        species: item.species,
        lifeStage: item.lifeStage,
        breedSize: item.breedSize,
        foodType: item.foodType,
        coadjuvanteCondition: item.coadjuvanteCondition || null,
        sourceUrl: item.officialUrl,
        labelCollectionDate: new Date(),
        curatorResponsible: 'Equipe de Curadoria Técnica',
        frontLabelImageUrl: imgDownloaded ? packshotPublicUrl : null,
        moistureMaxPct: item.garantias.umidadeMaxPct,
        crudeProteinMinPct: item.garantias.proteinaBrutaMinPct,
        etherExtractMinPct: item.garantias.extratoEtereoMinPct,
        crudeFiberMaxPct: item.garantias.materiaFibrosaMaxPct,
        mineralMatterMaxPct: item.garantias.materiaMineralMaxPct,
        calciumMinPct: item.garantias.calcioMinPct,
        calciumMaxPct: item.garantias.calcioMaxPct,
        phosphorusMinPct: item.garantias.fosforoMinPct,
        sodiumMinPct: item.garantias.sodioMinPct,
        meatClaimType: 'CARNE_MECANICAMENTE_SEPARADA',
        containsGmo: false,
        antioxidantType: 'NATURAL',
        topIngredients: item.ingredientes,
        scoreTotal: scoreResult.scoreTotal,
        classificationTier: scoreResult.classificacaoFaixa,
        scoreBreakdown: scoreResult.extratoPontos,
        editorialOpinion,
      });

      const custodyFilename = `ficha_${newId}.html`;
      const custodyLocalPath = path.join(process.cwd(), 'public', 'uploads', 'custodia', custodyFilename);
      const custodyPublicUrl = `/uploads/custodia/${custodyFilename}`;
      fs.writeFileSync(custodyLocalPath, custodyHtml, 'utf-8');

      // 8. Grava no Banco de Dados via Prisma
      await prisma.product.create({
        data: {
          id: newId,
          slug: item.slug,
          commercialName: item.commercialName,
          brand: 'Pet Delícia',
          manufacturerLegalName: 'Pet Delícia Indústria e Comércio de Alimentos Ltda.',
          legalCategory: item.legalCategory,
          species: item.species,
          lifeStage: item.lifeStage,
          breedSize: item.breedSize,
          foodType: item.foodType,
          coadjuvanteCondition: item.coadjuvanteCondition || null,
          sourceUrl: item.officialUrl,
          sourceDocumentUrl: custodyPublicUrl,
          labelCollectionDate: new Date(),
          frontLabelImageUrl: imgDownloaded ? packshotPublicUrl : null,
          curatorResponsible: 'Equipe de Curadoria Técnica',
          moistureMaxPct: item.garantias.umidadeMaxPct,
          crudeProteinMinPct: item.garantias.proteinaBrutaMinPct,
          etherExtractMinPct: item.garantias.extratoEtereoMinPct,
          crudeFiberMaxPct: item.garantias.materiaFibrosaMaxPct,
          mineralMatterMaxPct: item.garantias.materiaMineralMaxPct,
          calciumMinPct: item.garantias.calcioMinPct,
          calciumMaxPct: item.garantias.calcioMaxPct,
          phosphorusMinPct: item.garantias.fosforoMinPct,
          sodiumMinPct: item.garantias.sodioMinPct,
          meatClaimType: 'CARNE_MECANICAMENTE_SEPARADA',
          containsGmo: false,
          antioxidantType: 'NATURAL',
          topIngredients: JSON.stringify(item.ingredientes),
          editorialOpinion: editorialOpinion,
          scoreTotal: scoreResult.scoreTotal,
          classificationTier: scoreResult.classificacaoFaixa,
          scoreBreakdown: scoreResult.extratoPontos as any,
          isPublished: true,
          calculatedAt: new Date(),
        },
      });

      console.log(`✅ [${i + 1}/${mappings.length}] Ingerido com sucesso: "${item.commercialName}" [${scoreResult.classificacaoFaixa} ${scoreResult.scoreTotal}pts]`);
      successCount++;

      // Pausa gentil entre requisições
      await new Promise((r) => setTimeout(r, 800));
    } catch (err: any) {
      console.error(`❌ Erro fatal ao cadastrar "${item.commercialName}":`, err.message);
      failCount++;
    }
  }

  console.log(`\n================================================================`);
  console.log(`🏁 RESUMO DA INGESTÃO — PET DELÍCIA`);
  console.log(`================================================================`);
  console.log(`✅ Sucesso: ${successCount}`);
  console.log(`⏩ Pulados (já cadastrados): ${skippedCount}`);
  console.log(`❌ Falhas: ${failCount}`);
  console.log(`================================================================\n`);

  await closeTunnel();
}

main().catch(async (e) => {
  console.error(e);
  await closeTunnel();
  process.exit(1);
});
