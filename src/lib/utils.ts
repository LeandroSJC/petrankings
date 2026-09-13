const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://petrankings.com.br';
export const SITE_URL = rawSiteUrl.replace(/\/+$/, '');

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
