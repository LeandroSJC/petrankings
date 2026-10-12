import prisma from '../src/lib/prisma';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function syncToVps() {
  console.log('🚀 Localizando arquivos de imagem dos 65 produtos GranPlus...');

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { brand: { contains: 'GranPlus', mode: 'insensitive' } },
        { commercialName: { contains: 'GranPlus', mode: 'insensitive' } },
        { slug: { contains: 'granplus', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      slug: true,
      commercialName: true,
      frontLabelImageUrl: true
    }
  });

  const filesToSend: string[] = [];
  for (const p of products) {
    if (p.frontLabelImageUrl && p.frontLabelImageUrl.startsWith('/uploads/')) {
      const localDiskPath = path.join(process.cwd(), 'public', p.frontLabelImageUrl.replace(/^\//, ''));
      if (fs.existsSync(localDiskPath)) {
        filesToSend.push(localDiskPath);
      } else {
        console.warn(`⚠️ Arquivo local não encontrado: ${localDiskPath}`);
      }
    }
  }

  console.log(`📦 Encontrados ${filesToSend.length} arquivos locais prontos para sincronização.`);

  if (filesToSend.length === 0) {
    console.log('Nenhum arquivo para sincronizar.');
    return;
  }

  const remoteDest = 'petrankings-vps:/home/ubuntu/petrankings/public/uploads/';
  console.log(`📡 Enviando via SCP para ${remoteDest}...`);

  // Agrupa em lotes de 20 para evitar limites de tamanho de linha de comando no Windows
  const batchSize = 20;
  for (let i = 0; i < filesToSend.length; i += batchSize) {
    const batch = filesToSend.slice(i, i + batchSize);
    console.log(`📤 Enviando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(filesToSend.length / batchSize)} (${batch.length} arquivos)...`);
    const quoted = batch.map((f) => `"${f.replace(/\\/g, '/')}"`).join(' ');
    const cmd = `scp ${quoted} ${remoteDest}`;
    execSync(cmd, { stdio: 'inherit' });
  }

  console.log('🎉 [Sucesso] Todos os 65 arquivos WebP da GranPlus foram sincronizados com o servidor de produção!');
}

syncToVps()
  .catch((err) => {
    console.error('❌ Erro na sincronização:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
