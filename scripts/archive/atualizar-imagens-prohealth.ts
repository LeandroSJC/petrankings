import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import net from 'net';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';

function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const PRODUCTS_MAP = [
  {
    slug: 'prohealth-gatos-filhote',
    id: 'cmtzaf8b341d6c6f763048b2',
    name: 'ProHealth Gatos Filhotes',
    tempFile: 'public/uploads/temp_prohealth-gatos-filhote.jpg',
    targetRel: '/uploads/produto_cmtzaf8b341d6c6f763048b2.webp',
  },
  {
    slug: 'prohealth-gatos-castradosalmao',
    id: 'cmtzfcb5301879a41676a2eb',
    name: 'ProHealth Gatos Castrados SalmÃ£o',
    tempFile: 'public/uploads/temp_prohealth-gatos-castradosalmao.jpg',
    targetRel: '/uploads/produto_cmtzfcb5301879a41676a2eb.webp',
  },
  {
    slug: 'prohealth-gatos-castradofrango',
    id: 'cmtzc25678e187f445b4edfc',
    name: 'ProHealth Gatos Castrados Frango',
    tempFile: 'public/uploads/temp_prohealth-gatos-castradofrango.jpg',
    targetRel: '/uploads/produto_cmtzc25678e187f445b4edfc.webp',
  },
];

async function main() {
  console.log('ðŸš€ [PetRankings] Iniciando atualizaÃ§Ã£o das imagens dos produtos ProHealth...\n');

  // 1. Processamento e otimizaÃ§Ã£o das imagens com sharp
  console.log('ðŸŽ¨ [Sharp] Processando e convertendo imagens para WebP otimizado...');
  for (const item of PRODUCTS_MAP) {
    const tempFullPath = path.join(process.cwd(), item.tempFile);
    const targetFullPath = path.join(process.cwd(), 'public', item.targetRel.replace(/^\//, ''));

    if (!fs.existsSync(tempFullPath)) {
      throw new Error(`Arquivo temporÃ¡rio nÃ£o encontrado: ${tempFullPath}`);
    }

    const inputBuffer = fs.readFileSync(tempFullPath);
    const optimizedBuffer = await sharp(inputBuffer)
      .rotate()
      .withMetadata({ exif: {} })
      .webp({ quality: 90 })
      .toBuffer();

    fs.writeFileSync(targetFullPath, optimizedBuffer);
    const meta = await sharp(optimizedBuffer).metadata();
    console.log(`   âœ“ ${item.name} (${item.slug}):`);
    console.log(`     Salvo em: ${item.targetRel} | ResoluÃ§Ã£o: ${meta.width}x${meta.height} | Tamanho: ${optimizedBuffer.length} bytes`);
  }

  // 2. ConexÃ£o ao banco de dados via tÃºnel SSH
  let tunnelProcess: any = null;
  const alreadyOpen = await isPortOpen(5433);

  if (alreadyOpen) {
    console.log('\nðŸ“¡ [TÃºnel SSH] Porta 5433 jÃ¡ estÃ¡ ativa. Utilizando conexÃ£o existente.');
  } else {
    console.log('\nðŸ”’ [TÃºnel SSH] Abrindo tÃºnel seguro em segundo plano com a Oracle Cloud...');
    const keyPath = 'caminho/para/chave.key';
    tunnelProcess = spawn('ssh', [
      '-i', keyPath,
      '-L', '5433:127.0.0.1:5432',
      '-N',
      'ubuntu@petrankings-vps',
    ], { stdio: 'ignore', windowsHide: true });

    let ready = false;
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      if (await isPortOpen(5433)) {
        ready = true;
        break;
      }
    }

    if (!ready) {
      console.error('âŒ Falha ao estabelecer o tÃºnel SSH.');
      if (tunnelProcess) tunnelProcess.kill();
      process.exit(1);
    }
    console.log('âœ“ [TÃºnel SSH] ConexÃ£o segura estabelecida com sucesso na porta 5433!');
  }

  const rawUrl = process.env.DATABASE_URL || '';
  const normalizedUrl = rawUrl.replace('localhost', '127.0.0.1');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: normalizedUrl,
      },
    },
  });

  try {
    console.log('\nðŸ“¦ [Banco de Dados] Atualizando registros no PostgreSQL...');
    for (const item of PRODUCTS_MAP) {
      const updated = await prisma.product.update({
        where: { id: item.id },
        data: {
          frontLabelImageUrl: item.targetRel,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          slug: true,
          commercialName: true,
          frontLabelImageUrl: true,
          updatedAt: true,
        },
      });
      console.log(`   âœ“ Atualizado: "${updated.commercialName}" -> ${updated.frontLabelImageUrl}`);
    }
    console.log('âœ“ [Banco de Dados] Todos os registros atualizados com sucesso!');
  } finally {
    await prisma.$disconnect();
    if (tunnelProcess) {
      console.log('ðŸ”Œ [TÃºnel SSH] Encerrando tÃºnel temporÃ¡rio.');
      tunnelProcess.kill();
    }
  }

  // 3. Limpeza de arquivos temporÃ¡rios
  console.log('\nðŸ§¹ [Limpeza] Removendo arquivos temporÃ¡rios de download...');
  for (const item of PRODUCTS_MAP) {
    const tempFullPath = path.join(process.cwd(), item.tempFile);
    if (fs.existsSync(tempFullPath)) {
      fs.unlinkSync(tempFullPath);
      console.log(`   âœ“ Removido: ${item.tempFile}`);
    }
  }

  console.log('\nðŸŽ‰ [Sucesso] Todas as imagens foram processadas, salvas e atualizadas com sucesso!');
}

main().catch((err) => {
  console.error('\nâŒ Erro durante o processo:', err);
  process.exit(1);
});
