import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import * as cheerio from 'cheerio';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel } from './cadastrar-por-url';

function getVbMasterImage($: cheerio.CheerioAPI): { masterUrl: string; candidateUrl: string } | null {
  const isExcluded = (s: string) => {
    if (!s || s.startsWith('data:')) return true;
    if (s.includes('/70x70/')) return true;
    if (s.includes('/claims/')) return true;
    if (s.includes('icone') || s.includes('/icones/')) return true;
    if (s.includes('grao') || s.includes('/graos/')) return true;
    if (s.includes('pellet') || s.includes('pellets')) return true;
    if (s.includes('mais-ou-nenos')) return true;
    if (s.includes('tabelas') || s.includes('as-tabelas')) return true;
    if (
      s.includes('logo') ||
      s.includes('flags') ||
      s.includes('selos') ||
      s.includes('modal_') ||
      s.includes('/marcas/') ||
      s.includes('/banners-')
    ) {
      return true;
    }
    return false;
  };

  // 1. Slider / Carrossel principal da página
  const sliderImgs: string[] = [];
  $('.slider img, .owl-carousel img, .slider-for img, [class*="slider"] img, .produto-detalhes img').each((_, el) => {
    const s = $(el).attr('src');
    if (s) sliderImgs.push(s);
  });

  // 2. Todas as imagens da página
  const allImgs: string[] = [];
  $('img').each((_, el) => {
    const s = $(el).attr('src');
    if (s) allImgs.push(s);
  });

  // Prioriza imagens do slider em 570x500 ou packshot 3D
  let candidate = sliderImgs.find(
    (s) => !isExcluded(s) && (s.includes('/570x500/') || s.includes('3d') || s.includes('/produtos/'))
  );
  if (!candidate) {
    candidate = sliderImgs.find((s) => !isExcluded(s));
  }
  if (!candidate) {
    candidate = allImgs.find((s) => !isExcluded(s) && s.includes('/570x500/'));
  }
  if (!candidate) {
    candidate = allImgs.find((s) => !isExcluded(s) && s.includes('/uploads/'));
  }

  if (!candidate) return null;

  let master = candidate.replace(/\/uploads\/thumbs\/\d+x\d+\//, '/uploads/');
  if (!master.startsWith('http')) {
    master = `https://www.vbalimentos.com.br${master.startsWith('/') ? '' : '/'}${master}`;
  }
  let candidateFull = candidate.startsWith('http')
    ? candidate
    : `https://www.vbalimentos.com.br${candidate.startsWith('/') ? '' : '/'}${candidate}`;

  return { masterUrl: master, candidateUrl: candidateFull };
}

async function main() {
  await ensureTunnelOpen();

  const prods = await prisma.product.findMany({
    where: {
      manufacturerLegalName: 'VB Alimentos Indústria e Comércio Ltda.',
    },
    select: {
      id: true,
      slug: true,
      commercialName: true,
      brand: true,
      frontLabelImageUrl: true,
      sourceDocumentUrl: true,
    },
    orderBy: { slug: 'asc' },
  });

  console.log(`\n================================================================`);
  console.log(`🛠️ REPARO DE IMAGENS E SLUGS — VB ALIMENTOS`);
  console.log(`📦 Total de produtos para verificação: ${prods.length}`);
  console.log(`================================================================\n`);

  let imagesUpdated = 0;
  let slugsUpdated = 0;

  for (let i = 0; i < prods.length; i++) {
    const p = prods[i];
    console.log(`\n[${i + 1}/${prods.length}] "${p.commercialName}" (${p.slug})`);

    // 1. REPARO DE IMAGEM
    if (p.sourceDocumentUrl) {
      const custodyPath = path.join(process.cwd(), 'public', p.sourceDocumentUrl);
      if (fs.existsSync(custodyPath)) {
        const html = fs.readFileSync(custodyPath, 'utf-8');
        const $ = cheerio.load(html);
        const imgInfo = getVbMasterImage($);

        if (imgInfo) {
          const { masterUrl, candidateUrl } = imgInfo;
          try {
            console.log(`   ⬇️ Baixando packshot: ${masterUrl}`);
            let res = await fetch(masterUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                Referer: 'https://www.vbalimentos.com.br/',
              },
            });

            if (!res.ok && candidateUrl !== masterUrl) {
              console.log(`   ⚠️ Master retornou ${res.status}. Tentando candidateUrl: ${candidateUrl}`);
              res = await fetch(candidateUrl, {
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                  Referer: 'https://www.vbalimentos.com.br/',
                },
              });
            }

            if (res.ok) {
              const arrayBuffer = await res.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const targetPath = path.join(process.cwd(), 'public', 'uploads', `produto_${p.id}.webp`);

              const webpBuffer = await sharp(buffer)
                .webp({ quality: 85, effort: 4 })
                .toBuffer();

              fs.writeFileSync(targetPath, webpBuffer);

              const newMeta = await sharp(webpBuffer).metadata();
              console.log(`   ✅ Packshot WebP salvo com sucesso: ${newMeta.width}x${newMeta.height}px`);

              const relativeUrl = `/uploads/produto_${p.id}.webp`;
              if (p.frontLabelImageUrl !== relativeUrl) {
                await prisma.product.update({
                  where: { id: p.id },
                  data: { frontLabelImageUrl: relativeUrl },
                });
              }
              imagesUpdated++;
            } else {
              console.warn(`   ❌ Falha HTTP ao baixar ${masterUrl}: ${res.status}`);
            }
          } catch (imgErr: any) {
            console.error(`   ❌ Erro ao processar imagem: ${imgErr.message}`);
          }
        }
      }
    }

    // 2. REPARO DE SLUG (remover sufixo numérico -1, -2 etc. quando sem colisão)
    if (/-\d+$/.test(p.slug)) {
      const cleanSlug = p.slug.replace(/-\d+$/, '');
      const conflict = await prisma.product.findUnique({
        where: { slug: cleanSlug },
        select: { id: true, slug: true },
      });

      if (!conflict) {
        console.log(`   🏷️ Normalizando slug: "${p.slug}" ➔ "${cleanSlug}"`);
        await prisma.product.update({
          where: { id: p.id },
          data: { slug: cleanSlug },
        });
        slugsUpdated++;
      } else {
        console.log(`   ⏩ Conflito detectado para o slug "${cleanSlug}", mantendo "${p.slug}".`);
      }
    }
  }

  console.log(`\n================================================================`);
  console.log(`🏁 REPARO CONCLUÍDO!`);
  console.log(`🖼️ Imagens atualizadas para alta resolução: ${imagesUpdated}`);
  console.log(`🏷️ Slugs limpos (sem sufixo -1): ${slugsUpdated}`);
  console.log(`================================================================\n`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    closeTunnel();
  });
