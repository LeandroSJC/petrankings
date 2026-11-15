import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { ensureTunnelOpen, closeTunnel, processUrl, closePlaywright } from './cadastrar-por-url';
import prisma from '../src/lib/prisma';

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('================================================================');
  console.log('🐾 PETRANKINGS — CADASTRO AUTOMÁTICO PETLOVE / NUTRILUS');
  console.log('================================================================\n');

  const filePath = path.join(process.cwd(), 'produtos_cadastro', 'petlove_bloqueados_cloudflare.txt');
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const rawLines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const urls = Array.from(
    new Set(
      rawLines
        .map((l) => l.trim())
        .filter((l) => l.startsWith('https://www.petlove.com.br/'))
    )
  );

  console.log(`📋 Total de produtos Petlove / Nutrilus a processar: ${urls.length}\n`);

  await ensureTunnelOpen();

  const results: { url: string; success: boolean; error?: string }[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const indexStr = `[${i + 1}/${urls.length}]`;
    console.log(`\n----------------------------------------------------------------`);
    console.log(`🚀 ${indexStr} Processando: ${url}`);
    console.log(`----------------------------------------------------------------`);

    try {
      const ok = await processUrl(url);
      results.push({ url, success: ok });
    } catch (err: any) {
      console.error(`❌ Erro no processamento de ${url}:`, err.message);
      results.push({ url, success: false, error: err.message });
    }

    // Intervalo humanizado de 2.5 a 4.0 segundos entre requisições
    if (i < urls.length - 1) {
      const delay = Math.floor(Math.random() * 1500) + 2500;
      console.log(`⏳ Aguardando ${(delay / 1000).toFixed(1)}s antes do próximo produto...`);
      await sleep(delay);
    }
  }

  console.log('\n================================================================');
  console.log('📊 RESUMO DA INGESTÃO PETLOVE / NUTRILUS:');
  console.log('================================================================');
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Sucessos: ${successful.length}/${urls.length}`);
  console.log(`❌ Falhas: ${failed.length}/${urls.length}`);

  if (failed.length > 0) {
    console.log('\n⚠️ URLs que falharam:');
    failed.forEach((f) => console.log(`   - ${f.url} (${f.error || 'Erro desconhecido'})`));
  }

  console.log('================================================================\n');
}

main()
  .catch(console.error)
  .finally(async () => {
    await closePlaywright();
    await prisma.$disconnect();
    closeTunnel();
  });
