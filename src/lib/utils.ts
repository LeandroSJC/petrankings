export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export type StoreKey = 'amazon' | 'mercadolivre' | 'petlove' | 'cobasi' | 'shopee';

export interface StoreInfo {
  key: StoreKey;
  name: string;
  domain: string;
  themeColor: string;
  accentColor: string;
  bgLight: string;
  logo: string;
}

export const STORES_INFO: Record<StoreKey, StoreInfo> = {
  amazon: {
    key: 'amazon',
    name: 'Amazon',
    domain: 'amazon.com.br',
    themeColor: '#FF9900',
    accentColor: '#131921',
    bgLight: '#FFF8ED',
    logo: '/stores/amazon.svg',
  },
  mercadolivre: {
    key: 'mercadolivre',
    name: 'Mercado Livre',
    domain: 'mercadolivre.com.br',
    themeColor: '#FFE600',
    accentColor: '#2D3277',
    bgLight: '#FFFDEB',
    logo: '/stores/mercadolivre.svg',
  },
  petlove: {
    key: 'petlove',
    name: 'Petlove',
    domain: 'petlove.com.br',
    themeColor: '#7B2CBF',
    accentColor: '#5A189A',
    bgLight: '#F7EDFF',
    logo: '/stores/petlove.svg',
  },
  cobasi: {
    key: 'cobasi',
    name: 'Cobasi',
    domain: 'cobasi.com.br',
    themeColor: '#008037',
    accentColor: '#005926',
    bgLight: '#EDF9F1',
    logo: '/stores/cobasi.svg',
  },
  shopee: {
    key: 'shopee',
    name: 'Shopee',
    domain: 'shopee.com.br',
    themeColor: '#EE4D2D',
    accentColor: '#C43618',
    bgLight: '#FFF0ED',
    logo: '/stores/shopee.svg',
  },
};

export const VALID_STORES: StoreKey[] = ['amazon', 'mercadolivre', 'petlove', 'cobasi', 'shopee'];

export function getStoreInfo(key: string): StoreInfo | undefined {
  return STORES_INFO[key as StoreKey];
}

export function validateStoreUrl(storeKey: string, url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const info = getStoreInfo(storeKey);
    if (!info) return false;
    return parsed.hostname.toLowerCase().includes(info.domain) || parsed.hostname.toLowerCase().includes(storeKey.replace('mercadolivre', 'mercadolivre'));
  } catch {
    return false;
  }
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Não revisado';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Data inválida';
  return d.toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return 'Sem dados';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Data inválida';
  return d.toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function isOlderThanDays(date: Date | string | null | undefined, days: number = 30): boolean {
  if (!date) return true;
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > days;
}

export function getRankBadgeClass(rank: number): string {
  if (rank === 1) return 'rank-gold';
  if (rank === 2) return 'rank-silver';
  if (rank === 3) return 'rank-bronze';
  return 'rank-standard';
}
