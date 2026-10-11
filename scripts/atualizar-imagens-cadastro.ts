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

async function main() {
  console.log('🚀 [PetRankings] Atualização de imagens em lote da pasta "produtos_cadastro"...\n');

  const dir = path.join(process.cwd(), 'produtos_cadastro');
  if (!fs.existsSync(dir)) {
    throw new Error(`Pasta ${dir} não encontrada.`);
  }

  const files = fs.readdirSync(dir);
  const imageExtensions = ['.webp', '.png', '.jpg', '.jpeg', '.avif'];
  const imageFiles = files.filter((f) => imageExtensions.includes(path.extname(f).toLowerCase()));

  console.log(`📁 Encontradas ${imageFiles.length} imagens na pasta "produtos_cadastro":`);
  imageFiles.forEach((f) => console.log(`   - ${f}`));

  if (imageFiles.length === 0) {
    console.log('Nenhuma imagem encontrada para processar.');
    return;
  }

  // Abre túnel SSH seguro se necessário
  let tunnelProcess: any = null;
  const alreadyOpen = await isPortOpen(5433);

  if (alreadyOpen) {
    console.log('\n📡 [Túnel SSH] Porta 5433 já está ativa. Utilizando conexão existente.');
  } else {
    console.log('\n🔒 [Túnel SSH] Abrindo túnel seguro em segundo plano com a Oracle Cloud...');
    const sshTarget = process.env.SSH_TARGET || 'petrankings-vps';
    tunnelProcess = spawn('ssh', [
      '-L', '5433:127.0.0.1:5432',
      '-N',
      sshTarget,
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
      console.error('❌ Falha ao estabelecer o túnel SSH com a Oracle Cloud.');
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

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const updatedFilesForScp: string[] = [];

  try {
    console.log('\n🔍 [Processamento] Cruzando arquivos com produtos no banco de dados...\n');

    for (const file of imageFiles) {
      const ext = path.extname(file);
      const slug = path.basename(file, ext);
      const sourcePath = path.join(dir, file);

      // Busca produto no banco
      const product = await prisma.product.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          commercialName: true,
          frontLabelImageUrl: true,
        },
      });

      if (!product) {
        console.warn(`⚠️ Produto NÃO encontrado para o slug: "${slug}" (arquivo: ${file})`);
        continue;
      }

      console.log(`👉 Processando: ${product.commercialName} (ID: ${product.id} | Slug: ${slug})`);

      // Determina caminho de destino
      const targetRel = `/uploads/produto_${product.id}.webp`;
      const targetDiskPath = path.join(process.cwd(), 'public', targetRel.replace(/^\//, ''));

      // Processa com Sharp
      const inputBuffer = fs.readFileSync(sourcePath);
      const optimizedBuffer = await sharp(inputBuffer)
        .rotate()
        .withMetadata({ exif: {} })
        .webp({ quality: 90 })
        .toBuffer();

      fs.writeFileSync(targetDiskPath, optimizedBuffer);
      const meta = await sharp(optimizedBuffer).metadata();
      console.log(`   🎨 Imagem otimizada salva em: ${targetRel} (${meta.width}x${meta.height}, ${optimizedBuffer.length} bytes)`);

      // Atualiza banco de dados
      await prisma.product.update({
        where: { id: product.id },
        data: {
          frontLabelImageUrl: targetRel,
          updatedAt: new Date(),
        },
      });
      console.log(`   💾 Banco atualizado com sucesso: frontLabelImageUrl = ${targetRel}`);

      updatedFilesForScp.push(targetDiskPath);
    }

    console.log(`\n✅ Total de produtos atualizados no banco e no disco local: ${updatedFilesForScp.length}`);

  } finally {
    await prisma.$disconnect();
    if (tunnelProcess) {
      console.log('\n🔌 [Túnel SSH] Fechando túnel temporário.');
      tunnelProcess.kill();
    }
  }

  // Sincronização com o servidor Oracle Cloud
  if (updatedFilesForScp.length > 0) {
    console.log('\n🚀 [Sincronização] Enviando imagens atualizadas para a Oracle Cloud...');
    const sshTarget = process.env.SSH_TARGET || 'petrankings-vps';
    const remoteDest = `${sshTarget}:/home/ubuntu/petrankings/public/uploads/`;

    // Cria comando scp com todos os arquivos
    const quotedFiles = updatedFilesForScp.map((p) => `"${p.replace(/\\/g, '/')}"`).join(' ');
    const scpCmd = `scp ${quotedFiles} ${remoteDest}`;

    const { execSync } = require('child_process');
    try {
      execSync(scpCmd, { stdio: 'inherit' });
      console.log('✓ [Sincronização] Todas as imagens sincronizadas com o servidor de produção da Oracle Cloud!');
    } catch (scpErr: any) {
      console.error('❌ Erro na sincronização SCP:', scpErr.message);
    }
  }

  console.log('\n🎉 [Concluído] Processo finalizado com sucesso!');
}

main().catch((err) => {
  console.error('\n❌ Erro geral:', err);
  process.exit(1);
});
