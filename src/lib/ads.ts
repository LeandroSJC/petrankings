import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export interface AdSlotConfig {
  id: string;
  slotKey: string;
  name: string;
  description: string | null;
  code: string;
  isActive: boolean;
}

export const DEFAULT_SLOT_DEFINITIONS: Array<{
  slotKey: string;
  name: string;
  description: string;
}> = [
  {
    slotKey: 'topo',
    name: 'Publicidade Topo (Header)',
    description: 'Exibida no topo das páginas logo abaixo do cabeçalho ou após a introdução principal.',
  },
  {
    slotKey: 'meio_produtos',
    name: 'Publicidade Meio dos Produtos (In-Feed)',
    description: 'Exibida de forma contextual entre os itens das listas de rankings comparativos.',
  },
  {
    slotKey: 'rodape',
    name: 'Publicidade Rodapé (Footer)',
    description: 'Exibida na parte inferior das páginas de rankings e institucionais antes do rodapé.',
  },
  {
    slotKey: 'lateral_artigo',
    name: 'Publicidade Lateral / Artigos',
    description: 'Exibida em barras laterais ou entre parágrafos de artigos informativos e institucionais.',
  },
  {
    slotKey: 'global_head',
    name: 'Script Global AdSense (Head)',
    description: 'Código de script assíncrono mestre do Google AdSense (ex: verificação do site / auto ads).',
  },
];

/**
 * Garante que os slots padrão existam no banco de dados sem conflito de concorrência.
 */
export async function ensureDefaultAdSlots() {
  try {
    await prisma.adSlot.createMany({
      data: DEFAULT_SLOT_DEFINITIONS.map((def) => ({
        slotKey: def.slotKey,
        name: def.name,
        description: def.description,
        isActive: false,
        code: '',
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    // Ignora conflitos pontuais em workers paralelos
  }
}

/**
 * Busca todos os slots de anúncio cadastrados no banco de dados.
 */
export async function fetchAllAdSlots(): Promise<AdSlotConfig[]> {
  try {
    await ensureDefaultAdSlots();
    const slots = await prisma.adSlot.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return slots.map((s) => ({
      id: s.id,
      slotKey: s.slotKey,
      name: s.name,
      description: s.description,
      code: s.code,
      isActive: s.isActive,
    }));
  } catch (error) {
    console.error('Erro ao buscar slots de publicidade:', error);
    return [];
  }
}

/**
 * Versão em cache dos slots de anúncio para alto desempenho no frontend.
 */
export const getCachedAdSlots = unstable_cache(
  async () => {
    return fetchAllAdSlots();
  },
  ['ad-slots-cache'],
  {
    revalidate: 60, // revalida a cada 60s ou imediatamente via revalidateTag/revalidatePath
    tags: ['ad-slots'],
  }
);

/**
 * Retorna um mapa de slots por slotKey indexado para acesso O(1).
 */
export async function getAdSlotsMap(): Promise<Record<string, AdSlotConfig>> {
  const slots = await getCachedAdSlots();
  const map: Record<string, AdSlotConfig> = {};
  for (const slot of slots) {
    map[slot.slotKey] = slot;
  }
  return map;
}

/**
 * Retorna um slot de publicidade individual por slotKey.
 */
export async function getAdSlot(slotKey: string): Promise<AdSlotConfig | null> {
  const map = await getAdSlotsMap();
  return map[slotKey] || null;
}
