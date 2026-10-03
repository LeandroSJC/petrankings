import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { parseProductFromHtml } from '../src/lib/html-product-parser';

async function downloadImage(imgUrl: string, destPath: string): Promise<{ ok: boolean; status?: number; size?: number; error?: string }> {
  try {
    let referer: string | undefined;
    try {
      referer = new URL(imgUrl).origin + '/';
    } catch {}

    const res = await fetch(encodeURI(decodeURI(imgUrl)), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        ...(referer ? { Referer: referer } : {}),
      },
    });

    if (!res.ok) {
      return { ok: false, status: res.status, error: res.statusText };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) {
      return { ok: false, status: res.status, error: 'Empty buffer' };
    }

    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(destPath, buf);
    return { ok: true, status: res.status, size: buf.length };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}

export async function auditarERepararImagens() {
  console.log('🔍 Iniciando auditoria de integridade das imagens do catálogo...');

  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      commercialName: true,
      brand: true,
      frontLabelImageUrl: true,
      sourceUrl: true,
      sourceDocumentUrl: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📦 Total de produtos no banco: ${products.length}`);

  const broken: typeof products = [];
  for (const p of products) {
    if (!p.frontLabelImageUrl) {
      broken.push(p);
      continue;
    }
    if (p.frontLabelImageUrl.startsWith('http')) {
      // URL externa
      continue;
    }
    const local = path.join(process.cwd(), 'public', p.frontLabelImageUrl.replace(/^\//, ''));
    if (!fs.existsSync(local) || fs.statSync(local).size === 0) {
      broken.push(p);
    }
  }

  if (broken.length === 0) {
    console.log('✅ Todas as imagens locais existem e possuem tamanho válido no disco. Nenhuma quebra detectada!');
    return;
  }

  console.log(`⚠️ Encontrados ${broken.length} produtos com imagem ausente ou zerada no disco. Iniciando reparo...`);

  let successCount = 0;
  let failCount = 0;

  for (const p of broken) {
    console.log(`\n➡️ Recuperando: ${p.commercialName} (${p.slug})`);

    const htmlRel = p.sourceDocumentUrl?.replace(/^\//, '');
    let imgUrl: string | null = null;

    if (htmlRel) {
      const htmlPath = path.join(process.cwd(), 'public', htmlRel);
      if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, 'utf8');
        const parsed = parseProductFromHtml(html, p.sourceUrl);
        imgUrl = parsed.imageUrl;
      }
    }

    if (!imgUrl) {
      console.warn(`❌ Não foi possível extrair URL de imagem do HTML para ${p.slug}`);
      failCount++;
      continue;
    }

    const destRel = p.frontLabelImageUrl || `/uploads/produto_${p.id}.webp`;
    const destPath = path.join(process.cwd(), 'public', destRel.replace(/^\//, ''));

    const result = await downloadImage(imgUrl, destPath);
    if (result.ok) {
      console.log(`✅ Sucesso! Imagem salva: ${destRel} (${result.size} bytes)`);
      successCount++;
    } else {
      console.error(`❌ Falha ao baixar ${imgUrl}: ${result.error}`);
      failCount++;
    }
  }

  console.log(`\n🎉 Concluído: ${successCount} recuperadas, ${failCount} falhas.`);
}

if (require.main === module) {
  auditarERepararImagens().catch(console.error).finally(() => prisma.$disconnect());
}
