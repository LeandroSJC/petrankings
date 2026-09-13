/**
 * Automated Store Link Health Watchdog Script
 * Run with: npx tsx .agents/skills/link-health-watchdog/scripts/check-links.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CheckResult {
  store: string;
  product: string;
  urlType: 'affiliate' | 'product';
  url: string;
  status: number;
  ok: boolean;
  hasTag: boolean;
  latencyMs: number;
  error?: string;
}

const GENERIC_AFFILIATE_PATTERNS = [
  /tag=/i,
  /(shp\.ee|af_id=|universal-link)/i,
  /(lomadee|awin|parceiro|utm_source=)/i,
  /(matt_tool|afiliados|tracking)/i,
];

async function checkUrl(url: string, timeoutMs = 8000): Promise<{ status: number; ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 PetRankingsBot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    // Some retail platforms block HEAD requests with 403/405, so retry with GET
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 PetRankingsBot/1.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
    }

    clearTimeout(timer);
    return {
      status: res.status,
      ok: res.ok || (res.status >= 200 && res.status < 400),
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      status: 0,
      ok: false,
      latencyMs: Date.now() - start,
      error: err.name === 'AbortError' ? 'Timeout (>8s)' : err.message || 'Falha de conexão',
    };
  }
}

async function runAudit() {
  console.log('================================================================');
  console.log('🐾 PetRankings — Link Health & Store URL Watchdog');
  console.log('================================================================\n');

  const stores = await prisma.productStore.findMany({
    include: {
      product: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      store: 'asc',
    },
  });

  if (stores.length === 0) {
    console.log('⚠️ Nenhum vínculo de loja encontrado no banco de dados.');
    return;
  }

  console.log(`🔍 Auditando ${stores.length} links cadastrados...\n`);

  const results: CheckResult[] = [];

  for (const item of stores) {
    const targetUrl = item.affiliateUrl || item.productUrl;
    const isAffiliate = Boolean(item.affiliateUrl);
    const hasTag = isAffiliate
      ? GENERIC_AFFILIATE_PATTERNS.some((pattern) => pattern.test(targetUrl))
      : true;

    process.stdout.write(`⏳ Testando [${item.store.toUpperCase()}] ${item.product.title.slice(0, 30)}... `);

    const check = await checkUrl(targetUrl);
    const res: CheckResult = {
      store: item.store,
      product: item.product.title,
      urlType: isAffiliate ? 'affiliate' : 'product',
      url: targetUrl,
      status: check.status,
      ok: check.ok,
      hasTag,
      latencyMs: check.latencyMs,
      error: check.error,
    };

    results.push(res);

    if (res.ok) {
      console.log(`✅ ${res.status} (${res.latencyMs}ms)${!hasTag ? ' ⚠️ Sem tag de afiliado' : ''}`);
    } else {
      console.log(`❌ ${res.status || 'ERR'} - ${res.error || 'Falha'}`);
    }
  }

  console.log('\n================================================================');
  console.log('📊 RESUMO DA AUDITORIA DE LINKS');
  console.log('================================================================');

  const total = results.length;
  const okCount = results.filter((r) => r.ok).length;
  const failCount = total - okCount;
  const missingTagCount = results.filter((r) => !r.hasTag).length;

  console.log(`Total de links testados:   ${total}`);
  console.log(`Links operacionais (2xx):  ${okCount} (${((okCount / total) * 100).toFixed(1)}%)`);
  console.log(`Links com anomalia/erro:   ${failCount}`);
  console.log(`Afiliados sem tracking:    ${missingTagCount}\n`);

  if (failCount > 0) {
    console.log('🚨 LINKS QUE PRECISAM DE ATENÇÃO:');
    results
      .filter((r) => !r.ok)
      .forEach((r) => {
        console.log(`- [${r.store}] ${r.product}: ${r.url}`);
        console.log(`  Motivo: ${r.error || `Status HTTP ${r.status}`}`);
      });
    console.log();
  }

  await prisma.$disconnect();
}

runAudit().catch(async (e) => {
  console.error('Erro na execução da auditoria:', e);
  await prisma.$disconnect();
  process.exit(1);
});
