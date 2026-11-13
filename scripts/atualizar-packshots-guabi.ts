import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { execSync } from 'child_process';
import { ensureTunnelOpen, closeTunnel } from './cadastrar-por-url';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('🚀 [Guabi Natural] Iniciando substituição das imagens de grão/placeholder pelos PACKSHOTS OFICIAIS (Embalagens)...\n');

  const mappingPath = path.join(process.cwd(), 'scratch', 'guabi-listing-packshots.json');
  if (!fs.existsSync(mappingPath)) {
    throw new Error('Arquivo scratch/guabi-listing-packshots.json não encontrado!');
  }

  const listingData: Record<string, { href: string; slug: string; imgUrl: string; alt: string }> = JSON.parse(
    fs.readFileSync(mappingPath, 'utf-8')
  );

  await ensureTunnelOpen();

  const updatedFilesForScp: string[] = [];

  try {
    const products = await prisma.product.findMany({
      where: { brand: 'Guabi Natural' },
      select: {
        id: true,
        commercialName: true,
        slug: true,
        sourceUrl: true,
        frontLabelImageUrl: true,
      },
      orderBy: { commercialName: 'asc' },
    });

    console.log(`📦 Encontrados ${products.length} produtos Guabi Natural no catálogo do PetRankings.\n`);

    for (let i = 0; i < products.length; i++) {
      const prod = products[i];
      console.log(`----------------------------------------------------------------`);
      console.log(`👉 [${i + 1}/${products.length}] ${prod.commercialName}`);
      console.log(`   ID: ${prod.id} | Slug: ${prod.slug}`);

      // Procura o packshot correspondente por slug ou por sourceUrl
      let packshotItem = Object.values(listingData).find(
        (x) => x.slug === prod.slug || x.href === prod.sourceUrl || prod.sourceUrl?.includes(x.slug)
      );

      // Fallback: match por similaridade de slug
      if (!packshotItem) {
        const prodSlugClean = prod.slug.replace(/^guabi-natural-/, '');
        packshotItem = Object.values(listingData).find((x) => x.slug.includes(prodSlugClean) || prodSlugClean.includes(x.slug));
      }

      if (!packshotItem) {
        console.warn(`   ⚠️ Packshot NÃO encontrado no mapeamento para "${prod.slug}"!`);
        continue;
      }

      console.log(`   🖼️ Packshot oficial localizado: ${packshotItem.imgUrl}`);

      // Faz download da imagem oficial
      const res = await fetch(packshotItem.imgUrl);
      if (!res.ok) {
        console.error(`   ❌ Erro HTTP ${res.status} ao baixar imagem: ${packshotItem.imgUrl}`);
        continue;
      }

      const inputBuffer = Buffer.from(await res.arrayBuffer());
      if (inputBuffer.length < 500) {
        console.error(`   ❌ Imagem baixada muito pequena (${inputBuffer.length} bytes), abortando este item.`);
        continue;
      }

      // Converte para WebP de alta qualidade
      const targetRel = `/uploads/produto_${prod.id}.webp`;
      const targetDiskPath = path.join(process.cwd(), 'public', 'uploads', `produto_${prod.id}.webp`);

      const optimizedBuffer = await sharp(inputBuffer)
        .rotate()
        .webp({ quality: 90 })
        .toBuffer();

      fs.writeFileSync(targetDiskPath, optimizedBuffer);
      const meta = await sharp(optimizedBuffer).metadata();
      console.log(`   ✅ Embalagem WebP salva: ${targetDiskPath} (${meta.width}x${meta.height}, ${optimizedBuffer.length} bytes)`);

      // Garante atualização no banco
      await prisma.product.update({
        where: { id: prod.id },
        data: {
          frontLabelImageUrl: targetRel,
          updatedAt: new Date(),
        },
      });
      console.log(`   💾 Banco atualizado: frontLabelImageUrl = "${targetRel}"`);

      updatedFilesForScp.push(targetDiskPath);
    }

    console.log(`\n================================================================`);
    console.log(`🎉 PROCESSAMENTO CONCLUÍDO!`);
    console.log(`✅ Imagens de embalagem atualizadas localmente: ${updatedFilesForScp.length}/${products.length}`);
    console.log(`================================================================\n`);

  } finally {
    await prisma.$disconnect();
    closeTunnel();
  }

  // Sincroniza com o servidor Oracle VPS
  if (updatedFilesForScp.length > 0) {
    console.log(`\n🚀 [Sincronização] Enviando ${updatedFilesForScp.length} packshots oficiais para a VPS Oracle Cloud...`);
    const sshTarget = process.env.SSH_TARGET || 'petrankings-vps';
    const remoteDest = `${sshTarget}:/home/ubuntu/petrankings/public/uploads/`;

    const quotedFiles = updatedFilesForScp.map((p) => `"${p.replace(/\\/g, '/')}"`).join(' ');
    const scpCmd = `scp ${quotedFiles} ${remoteDest}`;

    try {
      execSync(scpCmd, { stdio: 'inherit' });
      console.log('✓ [Sincronização] Todas as imagens das embalagens foram sincronizadas na produção!');
    } catch (scpErr: any) {
      console.error('❌ Erro na sincronização SCP com a VPS:', scpErr.message);
    }
  }
}

main().catch(console.error);

