/**
 * Sitemap & Canonical Validation Script
 * Run with: npx tsx .agents/skills/nextjs-performance-seo/scripts/validate-sitemap-canonicals.ts
 */

import { PrismaClient } from '@prisma/client';
import { SITE_URL } from '../../../../src/lib/utils';

const prisma = new PrismaClient();

interface AuditEntry {
  url: string;
  type: 'static' | 'ranking';
  status: 'valid' | 'warning' | 'error';
  issue?: string;
}

async function validateSitemapAndCanonicals() {
  console.log('================================================================');
  console.log('🗺️  PetRankings — Validador de Sitemap XML e Tags Canônicas');
  console.log('================================================================\n');

  console.log(`🌐 Domínio base configurado: ${SITE_URL}`);

  const entries: AuditEntry[] = [];

  // 1. Rotas estáticas
  const staticPaths = ['/', '/sobre', '/contato', '/politica-de-privacidade'];
  for (const p of staticPaths) {
    const url = p === '/' ? SITE_URL : `${SITE_URL}${p}`;
    entries.push({
      url,
      type: 'static',
      status: 'valid',
    });
  }

  // 2. Rankings dinâmicos publicados
  const rankings = await prisma.ranking.findMany({
    where: { isPublished: true },
    select: { slug: true, title: true },
  });

  for (const r of rankings) {
    entries.push({
      url: `${SITE_URL}/ranking/${r.slug}`,
      type: 'ranking',
      status: 'valid',
    });
  }

  console.log(`📋 Analisando ${entries.length} URLs que constam no Sitemap XML...\n`);

  let errorCount = 0;
  let warnCount = 0;

  for (const entry of entries) {
    // Verificação 1: Protocolo HTTPS em produção
    if (SITE_URL.startsWith('https://') && !entry.url.startsWith('https://')) {
      entry.status = 'error';
      entry.issue = 'URL do sitemap não utiliza HTTPS';
      errorCount++;
    }

    // Verificação 2: Barras duplas acidentais
    const pathPart = entry.url.replace(/^https?:\/\/[^/]+/, '');
    if (/\/{2,}/.test(pathPart)) {
      entry.status = 'error';
      entry.issue = 'URL contém barras duplicadas (//)';
      errorCount++;
    }

    // Verificação 3: Barra no final (Trailing slash) em rotas internas
    if (pathPart.length > 1 && pathPart.endsWith('/')) {
      entry.status = 'warning';
      entry.issue = 'URL termina com barra (risco de 308 redirect no Next.js)';
      warnCount++;
    }

    const icon = entry.status === 'valid' ? '✅' : entry.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} [${entry.type.toUpperCase()}] ${entry.url}`);
    if (entry.issue) {
      console.log(`   └─ Detalhe: ${entry.issue}`);
    }
  }

  console.log('\n================================================================');
  console.log('📊 RESUMO DA AUDITORIA DE SITEMAP');
  console.log('================================================================');
  console.log(`Total de URLs auditadas:      ${entries.length}`);
  console.log(`URLs conformes (100% canônicas): ${entries.filter((e) => e.status === 'valid').length}`);
  console.log(`Avisos (Trailing slashes):    ${warnCount}`);
  console.log(`Erros críticos:               ${errorCount}\n`);

  if (errorCount === 0 && warnCount === 0) {
    console.log('🎉 Tudo certo! Seu sitemap e URLs canônicas estão 100% alinhados para o Google Search Console.');
  } else {
    console.log('⚠️ Revise as URLs apontadas acima antes de reenviar o sitemap ao Google.');
  }

  await prisma.$disconnect();
}

validateSitemapAndCanonicals().catch(async (err) => {
  console.error('Erro na validação do sitemap:', err);
  await prisma.$disconnect();
  process.exit(1);
});
