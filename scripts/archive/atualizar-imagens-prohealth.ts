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
    name: 'ProHealth Gatos Castrados Salmão',
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
  console.log('🚀 [PetRankings] Iniciando atualização das imagens dos produtos ProHealth...\n');

  // 1. Processamento e otimização das imagens com sharp
  console.log('🎨 [Sharp] Processando e convertendo imagens para WebP otimizado...');
  for (const item of PRODUCTS_MAP) {
    const tempFullPath = path.join(process.cwd(), item.tempFile);
    const targetFullPath = path.join(process.cwd(), 'public', item.targetRel.replace(/^\//, ''));

    if (!fs.existsSync(tempFullPath)) {
      throw new Error(`Arquivo temporário não encontrado: ${tempFullPath}`);
    }

    const inputBuffer = fs.readFileSync(tempFullPath);
    const optimizedBuffer = await sharp(inputBuffer)
      .rotate()
      .withMetadata({ exif: {} })
      .webp({ quality: 90 })
      .toBuffer();

    fs.writeFileSync(targetFullPath, optimizedBuffer);
    const meta = await sharp(optimizedBuffer).metadata();
    console.log(`   ✓ ${item.name} (${item.slug}):`);
    console.log(`     Salvo em: ${item.targetRel} | Resolução: ${meta.width}x${meta.height} | Tamanho: ${optimizedBuffer.length} bytes`);
  }

  // 2. Conexão ao banco de dados via túnel SSH
  let tunnelProcess: any = null;
  const alreadyOpen = await isPortOpen(5433);

  if (alreadyOpen) {
    console.log('\n📡 [Túnel SSH] Porta 5433 já está ativa. Utilizando conexão existente.');
  } else {
    console.log('\n🔒 [Túnel SSH] Abrindo túnel seguro em segundo plano com a Oracle Cloud...');
    const keyPath = 'D:/Projetos/ssh-key-2026-10-03.key';
    tunnelProcess = spawn('ssh', [
      '-i', keyPath,
      '-L', '5433:127.0.0.1:5432',
      '-N',
      'ubuntu@168.138.144.63',
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
      console.error('❌ Falha ao estabelecer o túnel SSH.');
      if (tunnelProcess) tunnelProcess.kill();
      process.exit(1);
    }
    console.log('✓ [Túnel SSH] Conexão segura estabelecida com sucesso na porta 5433!');
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
    console.log('\n📦 [Banco de Dados] Atualizando registros no PostgreSQL...');
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
      console.log(`   ✓ Atualizado: "${updated.commercialName}" -> ${updated.frontLabelImageUrl}`);
    }
    console.log('✓ [Banco de Dados] Todos os registros atualizados com sucesso!');
  } finally {
    await prisma.$disconnect();
    if (tunnelProcess) {
      console.log('🔌 [Túnel SSH] Encerrando túnel temporário.');
      tunnelProcess.kill();
    }
  }

  // 3. Limpeza de arquivos temporários
  console.log('\n🧹 [Limpeza] Removendo arquivos temporários de download...');
  for (const item of PRODUCTS_MAP) {
    const tempFullPath = path.join(process.cwd(), item.tempFile);
    if (fs.existsSync(tempFullPath)) {
      fs.unlinkSync(tempFullPath);
      console.log(`   ✓ Removido: ${item.tempFile}`);
    }
  }

  console.log('\n🎉 [Sucesso] Todas as imagens foram processadas, salvas e atualizadas com sucesso!');
}

main().catch((err) => {
  console.error('\n❌ Erro durante o processo:', err);
  process.exit(1);
});
