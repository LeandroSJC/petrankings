import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import * as cheerio from 'cheerio';
import prisma from '../src/lib/prisma';
import { ensureTunnelOpen, closeTunnel } from './cadastrar-por-url';
import { parseProductFromHtml } from '../src/lib/html-product-parser';
import { calcularScoreAnaliseRotulo, generateEditorialOpinionWithGemini } from '../src/lib/audit-engine';
import { generateCustodyHtml } from '../src/lib/custody-template';

interface OptimumMapping {
  officialUrl: string;
  partnerUrl: string;
  commercialName: string;
  slug: string;
  species: 'CAO' | 'GATO';
  lifeStage: 'ADULTO' | 'CRESCIMENTO_INICIAL' | 'CRESCIMENTO_FINAL' | 'SENIOR';
  breedSize: 'MINI_PEQUENO' | 'MEDIO_GRANDE' | 'TODOS';
  foodType: 'SECO' | 'UMIDO';
  legalCategory: 'ALIMENTO_COMPLETO' | 'ALIMENTO_COMPLEMENTAR';
}

const mappings: OptimumMapping[] = [
  // --- 9 RAÇÕES SECAS ---
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-seca/racao-optimum-para-caes-filhotes-racas-pequenas-e-minis-sabor-frango-e-arroz',
    partnerUrl: 'https://www.petz.com.br/produto/racao-optimum-para-caes-filhotes-de-racas-pequenas-e-minis-ate-12-meses-sabor-frango-e-arroz-148909',
    commercialName: 'Optimum Cães Filhotes Raças Minis e Pequenas Sabor Frango e Arroz',
    slug: 'optimum-caes-filhotes-racas-minis-e-pequenas-sabor-frango-e-arroz',
    species: 'CAO',
    lifeStage: 'CRESCIMENTO_INICIAL',
    breedSize: 'MINI_PEQUENO',
    foodType: 'SECO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-seca/racao-optimum-para-caes-filhotes-racas-medias-e-grandes-sabor-frango-e-arroz',
    partnerUrl: 'https://www.petz.com.br/produto/racao-optimum-para-caes-filhotes-de-racas-medias-sabor-frango-e-arroz-3kg-148908',
    commercialName: 'Optimum Cães Filhotes Raças Médias e Grandes Sabor Frango e Arroz',
    slug: 'optimum-caes-filhotes-racas-medias-e-grandes-sabor-frango-e-arroz',
    species: 'CAO',
    lifeStage: 'CRESCIMENTO_INICIAL',
    breedSize: 'MEDIO_GRANDE',
    foodType: 'SECO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-seca/racao-optimum-para-caes-adultos-racas-pequenas-e-minis-sabor-frango-e-arroz',
    partnerUrl: 'https://www.petz.com.br/produto/racao-optimum-para-caes-adultos-de-racas-pequenas-sabor-frango-e-arroz-148906',
    commercialName: 'Optimum Cães Adultos Raças Minis e Pequenas Sabor Frango e Arroz',
    slug: 'optimum-caes-adultos-racas-minis-e-pequenas-sabor-frango-e-arroz',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'MINI_PEQUENO',
    foodType: 'SECO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-seca/racao-optimum-para-caes-adultos-racas-medias-e-grandes-sabor-frango-e-arroz',
    partnerUrl: 'https://www.cobasi.com.br/racao-optimum-caes-adultos-raca-media-e-grande-frango-e-arroz-3912018/p',
    commercialName: 'Optimum Cães Adultos Raças Médias e Grandes Sabor Frango e Arroz',
    slug: 'optimum-caes-adultos-racas-medias-e-grandes-sabor-frango-e-arroz',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'MEDIO_GRANDE',
    foodType: 'SECO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-seca/racao-optimum-para-gatos-filhotes-sabor-frango',
    partnerUrl: 'https://www.petz.com.br/produto/racao-optimum-para-gatos-filhotes-sabor-frango-148919',
    commercialName: 'Optimum Gatos Filhotes Sabor Frango',
    slug: 'optimum-gatos-filhotes-sabor-frango',
    species: 'GATO',
    lifeStage: 'CRESCIMENTO_INICIAL',
    breedSize: 'TODOS',
    foodType: 'SECO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-seca/racao-optimum-para-gatos-adultos-sabor-frango',
    partnerUrl: 'https://www.petz.com.br/produto/racao-optimum-para-gatos-adultos-sabor-frango-148921',
    commercialName: 'Optimum Gatos Adultos Sabor Frango',
    slug: 'optimum-gatos-adultos-sabor-frango',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'SECO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-seca/racao-optimum-para-gatos-adultos-sabor-carne',
    partnerUrl: 'https://www.petz.com.br/produto/racao-optimum-para-gatos-adultos-sabor-carne-1kg-148920',
    commercialName: 'Optimum Gatos Adultos Sabor Carne',
    slug: 'optimum-gatos-adultos-sabor-carne',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'SECO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-seca/racao-optimum-para-gatos-adultos-castrados-sabor-frango',
    partnerUrl: 'https://www.petz.com.br/produto/racao-optimum-para-gatos-adultos-castrados-sabor-frango-148917',
    commercialName: 'Optimum Gatos Adultos Castrados Sabor Frango',
    slug: 'optimum-gatos-adultos-castrados-sabor-frango',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'SECO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-seca/racao-optimum-para-gatos-adultos-castrados-sabor-carne',
    partnerUrl: 'https://www.petz.com.br/produto/racao-optimum-para-gatos-adultos-castrados-sabor-carne-1kg-148918',
    commercialName: 'Optimum Gatos Adultos Castrados Sabor Carne',
    slug: 'optimum-gatos-adultos-castrados-sabor-carne',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'SECO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },

  // --- 13 RAÇÕES ÚMIDAS (SACHÊS) ---
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-umida/racao-umida-optimum-sache-para-caes-filhotes-frango-100-g',
    partnerUrl: 'https://www.petz.com.br/produto/racao-umida-optimum-sache-para-caes-filhotes-sabor-frango-100-g-107322',
    commercialName: 'Optimum Cães Filhotes Sabor Frango (Sachê)',
    slug: 'optimum-caes-filhotes-sabor-frango-sache',
    species: 'CAO',
    lifeStage: 'CRESCIMENTO_INICIAL',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-umida/racao-umida-optimum-sache-para-caes-adultos-racas-pequenas-e-minis-frango-100-g',
    partnerUrl: 'https://www.petz.com.br/produto/racao-umida-optimum-sache-para-caes-adultos-de-racas-pequenas-sabor-frango-100g-107323',
    commercialName: 'Optimum Cães Adultos Raças Minis e Pequenas Sabor Frango (Sachê)',
    slug: 'optimum-caes-adultos-racas-minis-e-pequenas-sabor-frango-sache',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'MINI_PEQUENO',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-umida/racao-umida-optimum-sache-para-caes-adultos-racas-pequenas-e-minis-sabor-carne-100g',
    partnerUrl: 'https://www.petz.com.br/produto/racao-umida-optimum-sache-para-caes-adultos-racas-pequenas-e-mini-sabor-carne-100-g-191754',
    commercialName: 'Optimum Cães Adultos Raças Minis e Pequenas Sabor Carne (Sachê)',
    slug: 'optimum-caes-adultos-racas-minis-e-pequenas-sabor-carne-sache',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'MINI_PEQUENO',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-umida/racao-umida-optimum-sache-para-caes-adultos-sabor-carne-100g',
    partnerUrl: 'https://www.petz.com.br/produto/racao-umida-optimum-sache-para-caes-adultos-de-racas-grandes-sabor-carne-100-g-191755',
    commercialName: 'Optimum Cães Adultos Raças Médias e Grandes Sabor Carne (Sachê)',
    slug: 'optimum-caes-adultos-racas-medias-e-grandes-sabor-carne-sache',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'MEDIO_GRANDE',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-umida/racao-umida-optimum-sache-para-caes-adultos-frango-100-g',
    partnerUrl: 'https://www.cobasi.com.br/alimento-umido-optimum-sache-caes-adultos-frango-100g-3844586/p',
    commercialName: 'Optimum Cães Adultos Sabor Frango (Sachê)',
    slug: 'optimum-caes-adultos-sabor-frango-sache',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-umida/racao-umida-optimum-sache-para-gatos-filhotes-frango-85-g',
    partnerUrl: 'https://www.petz.com.br/produto/racao-umida-optimum-sache-para-gatos-filhotes-frango-85-g-107400',
    commercialName: 'Optimum Gatos Filhotes Sabor Frango (Sachê)',
    slug: 'optimum-gatos-filhotes-sabor-frango-sache',
    species: 'GATO',
    lifeStage: 'CRESCIMENTO_INICIAL',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-umida/racao-umida-optimum-sache-para-gatos-adultos-frango-85-g',
    partnerUrl: 'https://www.petz.com.br/produto/racao-umida-optimum-sache-para-gatos-adultos-frango-85-g-107399',
    commercialName: 'Optimum Gatos Adultos Sabor Frango (Sachê)',
    slug: 'optimum-gatos-adultos-sabor-frango-sache',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-umida/racao-umida-optimum-sache-para-gatos-adultos-sabor-carne-85g',
    partnerUrl: 'https://www.petz.com.br/produto/racao-umida-optimum-sache-para-gatos-adulto-sabor-carne-85-g-192009',
    commercialName: 'Optimum Gatos Adultos Sabor Carne (Sachê)',
    slug: 'optimum-gatos-adultos-sabor-carne-sache',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-umida/racao-umida-optimum-sache-para-gatos-adultos-sabor-salmao-85g',
    partnerUrl: 'https://www.petz.com.br/produto/racao-umida-optimum-sache-para-gatos-adultos-sabor-salmao-85g-192011',
    commercialName: 'Optimum Gatos Adultos Sabor Salmão (Sachê)',
    slug: 'optimum-gatos-adultos-sabor-salmao-sache',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-umida/racao-umida-optimum-sache-para-gatos-adultos-castrados-frango-85-g',
    partnerUrl: 'https://www.petz.com.br/produto/racao-umida-optimum-sache-para-gatos-castrados-sabor-frango-85g-107397',
    commercialName: 'Optimum Gatos Adultos Castrados Sabor Frango (Sachê)',
    slug: 'optimum-gatos-adultos-castrados-sabor-frango-sache',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-umida/racao-umida-optimum-sache-para-gatos-adultos-castrados-sabor-carne-85g',
    partnerUrl: 'https://www.petz.com.br/produto/racao-umida-optimum-sache-para-gatos-castrados-sabor-carne-85g-192010',
    commercialName: 'Optimum Gatos Adultos Castrados Sabor Carne (Sachê)',
    slug: 'optimum-gatos-adultos-castrados-sabor-carne-sache',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-umida/racao-umida-optimum-sache-para-gatos-adultos-castrados-sabor-salmao-85g',
    partnerUrl: 'https://www.petz.com.br/produto/racao-umida-optimum-sache-para-gatos-castrados-sabor-salmao-85-g-192012',
    commercialName: 'Optimum Gatos Adultos Castrados Sabor Salmão (Sachê)',
    slug: 'optimum-gatos-adultos-castrados-sabor-salmao-sache',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/racao-umida/racao-umida-optimum-sache-para-gatos-adultos-manutencao-de-peso-frango-85-g',
    partnerUrl: 'https://www.petz.com.br/produto/racao-umida-optimum-sache-para-gatos-adultos-manutencao-de-peso-frango-85-g-107398',
    commercialName: 'Optimum Gatos Adultos Manutenção de Peso Sabor Frango (Sachê)',
    slug: 'optimum-gatos-adultos-manutencao-de-peso-sabor-frango-sache',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'UMIDO',
    legalCategory: 'ALIMENTO_COMPLETO',
  },

  // --- 4 PETISCOS ---
  {
    officialUrl: 'https://www.optimumpet.com.br/products/petisco/petisco-optimum-anti-bola-de-pelo-para-gatos-adultos-sabor-carne-e-linhaca-80g',
    partnerUrl: 'https://www.petz.com.br/produto/petisco-optimum-anti-bola-de-pelo-sabor-carne-e-linhaca-para-gatos-adultos-80g-204484',
    commercialName: 'Optimum Petisco Gatos Adultos Anti Bola de Pelo Sabor Carne e Linhaça',
    slug: 'optimum-petisco-gatos-adultos-anti-bola-de-pelo-sabor-carne-e-linhaca',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'SECO',
    legalCategory: 'ALIMENTO_COMPLEMENTAR',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/petisco/petisco-optimum-pele-e-pelo-para-gatos-adultos-sabor-salmao-e-vegetais-80g',
    partnerUrl: 'https://www.petz.com.br/produto/petisco-optimum-pele-e-pelo-sabor-salmao-e-vegetais-para-gatos-adultos-80g-204485',
    commercialName: 'Optimum Petisco Gatos Adultos Pele e Pelo Sabor Salmão e Vegetais',
    slug: 'optimum-petisco-gatos-adultos-pele-e-pelo-sabor-salmao-e-vegetais',
    species: 'GATO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'SECO',
    legalCategory: 'ALIMENTO_COMPLEMENTAR',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/petisco/petisco-optimum-sistema-imunologico-para-caes-adultos-sabor-frango-e-vegetais-80g',
    partnerUrl: 'https://www.petz.com.br/produto/petisco-optimum-sistema-imunologico-sabor-frango-e-vegetais-para-caes-adultos-80g-204482',
    commercialName: 'Optimum Petisco Cães Adultos Sistema Imunológico Sabor Frango e Vegetais',
    slug: 'optimum-petisco-caes-adultos-sistema-imunologico-sabor-frango-e-vegetais',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'SECO',
    legalCategory: 'ALIMENTO_COMPLEMENTAR',
  },
  {
    officialUrl: 'https://www.optimumpet.com.br/products/petisco/petisco-optimum-pele-e-pelo-para-caes-adultos-sabor-salmao-e-linhaca-80g',
    partnerUrl: 'https://www.petz.com.br/produto/petisco-optimum-pele-e-pelo-sabor-salmao-e-linhaca-para-caes-adultos-80g-204483',
    commercialName: 'Optimum Petisco Cães Adultos Pele e Pelo Sabor Salmão e Linhaça',
    slug: 'optimum-petisco-caes-adultos-pele-e-pelo-sabor-salmao-e-linhaca',
    species: 'CAO',
    lifeStage: 'ADULTO',
    breedSize: 'TODOS',
    foodType: 'SECO',
    legalCategory: 'ALIMENTO_COMPLEMENTAR',
  },
];

async function downloadPackshot(imgUrl: string, destPath: string): Promise<boolean> {
  try {
    // Se a URL contiver o proxy de redimensionamento do Cloudflare (/cdn-cgi/image/...), remove para obter a imagem original sem bloqueio
    const cleanUrl = imgUrl.replace(/\/cdn-cgi\/image\/[^\/]+\//, '/');
    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://www.optimumpet.com.br/',
      },
    });
    if (!res.ok) {
      console.warn(`[downloadPackshot] HTTP ${res.status} para ${cleanUrl}`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return false;

    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await sharp(buf)
      .trim()
      .resize(600, 600, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .webp({ quality: 90 })
      .toFile(destPath);

    return true;
  } catch (err: any) {
    console.warn(`⚠️ Erro ao converter packshot ${imgUrl}: ${err.message}`);
    return false;
  }
}

async function main() {
  await ensureTunnelOpen();

  console.log(`\n================================================================`);
  console.log(`🚀 INICIANDO CADASTRO EM LOTE — MARS PETCARE "OPTIMUM" (PREMIUM ESPECIAL)`);
  console.log(`📦 Total de Produtos Oficiais Mapeados: ${mappings.length}`);
  console.log(`================================================================\n`);

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const custodiaDir = path.join(uploadsDir, 'custodia');
  if (!fs.existsSync(custodiaDir)) fs.mkdirSync(custodiaDir, { recursive: true });

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < mappings.length; i++) {
    const item = mappings[i];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`👉 [${i + 1}/${mappings.length}] "${item.commercialName}"`);
    console.log(`   Slug: ${item.slug} | Categoria: ${item.legalCategory} | Tipo: ${item.foodType}`);
    console.log(`   Oficial: ${item.officialUrl}`);
    console.log(`   Parceiro: ${item.partnerUrl}`);
    console.log(`----------------------------------------------------------------`);

    try {
      // 1. Verificar se já existe no banco
      const existing = await prisma.product.findFirst({
        where: {
          OR: [
            { slug: item.slug },
            { sourceUrl: item.officialUrl },
          ],
        },
        select: { id: true, commercialName: true, slug: true, frontLabelImageUrl: true },
      });

      if (existing) {
        console.log(`⏩ Produto já cadastrado no catálogo: "${existing.commercialName}" (${existing.slug}). Pulando.`);
        skippedCount++;
        continue;
      }

      // 2. Coletar página oficial do fabricante (optimumpet.com.br)
      const offRes = await fetch(item.officialUrl);
      if (!offRes.ok) throw new Error(`Falha ao obter página oficial: ${offRes.status}`);
      const offHtml = await offRes.text();
      const $off = cheerio.load(offHtml);

      // Packshot oficial do fabricante (prioriza metatag og:image com URL limpa e direta)
      let imageUrl = $off('meta[property="og:image"]').attr('content') || $off('meta[name="twitter:image"]').attr('content') || '';
      if (!imageUrl) {
        $off('img').each((_, el) => {
          const src = $off(el).attr('src') || '';
          if (src.includes('files/migrate-product-files/images') && !imageUrl) {
            imageUrl = src.startsWith('http') ? src : `https://www.optimumpet.com.br${src}`;
          }
        });
      }

      // Ingredientes oficiais
      let ingredients = '';
      $off('.pdp_cooking_base_class__content-wysiwig').each((_, el) => {
        const t = $off(el).text().replace(/\s+/g, ' ').trim();
        if (t.length > 50 && !ingredients) ingredients = t;
      });

      // 3. Coletar níveis de garantia físicos do parceiro (Petz ou Cobasi)
      const partRes = await fetch(item.partnerUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!partRes.ok) throw new Error(`Falha ao obter dados do parceiro: ${partRes.status}`);
      const partHtml = await partRes.text();
      const $part = cheerio.load(partHtml);

      let garText = '';
      if (item.partnerUrl.includes('petz.com.br')) {
        const g1 = $part('dl[data-testid="product-info-níveis-de-garantia"]').text().replace(/\s+/g, ' ').trim();
        const g2 = $part('dl[data-testid="product-info-informações-nutricionais"]').text().replace(/\s+/g, ' ').trim();
        garText = `${g1} ${g2}`;
      } else if (item.partnerUrl.includes('cobasi.com.br')) {
        $part('h3').each((_, el) => {
          if ($part(el).text().includes('Níveis de garantia')) {
            let next = $part(el).next();
            while (next.length && !next.is('h3')) {
              next.find('td, th, p, span, li').each((_, cell) => { $part(cell).append(' '); });
              garText += ' ' + next.text().replace(/\s+/g, ' ').trim() + '\n';
              next = next.next();
            }
          }
        });
      }

      // 4. Montar Ficha Técnica Sintética Oficial com Custódia Probatória
      const syntheticHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${item.commercialName} — Optimum</title>
</head>
<body>
  <h1>${item.commercialName}</h1>
  <div class="niveis-garantia">
    <h2>Níveis de Garantia</h2>
    <p>${garText}</p>
  </div>
  <div class="composicao-basica">
    <h2>Composição Básica</h2>
    <p>${ingredients}</p>
  </div>
</body>
</html>
      `;

      // 5. Parser determinístico
      const parsed = parseProductFromHtml(syntheticHtml, item.officialUrl);

      // Normalizar campos taxonômicos estritos
      parsed.commercialName = item.commercialName;
      parsed.brand = 'Optimum';
      parsed.manufacturerLegalName = 'Mars Brasil Alimentos Ltda';
      parsed.species = item.species;
      parsed.lifeStage = item.lifeStage;
      parsed.breedSize = item.breedSize;
      parsed.foodType = item.foodType;
      parsed.legalCategory = item.legalCategory;

      const isFilhote = item.lifeStage === 'CRESCIMENTO_INICIAL' || item.lifeStage === 'CRESCIMENTO_FINAL';
      const isLight = /light|baixas?\s+calorias|controle\s+de\s+peso|reduced\s+calorie|weight\s+care|peso\s+perfeito|manuten[çc][ãa]o\s+de\s+peso/i.test(item.commercialName);

      // 6. Cálculo do Score Determinístico
      const audit = calcularScoreAnaliseRotulo(
        item.species as any,
        (isFilhote ? 'CRESCIMENTO_INICIAL' : item.lifeStage) as any,
        {
          umidadeMaxPct: parsed.umidadeMaxPct || 10,
          proteinaBrutaMinPct: parsed.proteinaBrutaMinPct || 20,
          extratoEtereoMinPct: parsed.extratoEtereoMinPct || 8,
          materiaFibrosaMaxPct: parsed.materiaFibrosaMaxPct || 4,
          materiaMineralMaxPct: parsed.materiaMineralMaxPct || 10,
          calcioMinPct: parsed.calcioMinPct || 0.8,
          calcioMaxPct: parsed.calcioMaxPct || 2.4,
          fosforoMinPct: parsed.fosforoMinPct || 0.6,
          sodioMinPct: parsed.sodioMinPct || 0.2,
          omega3MinPct: parsed.omega3MinPct || null,
        },
        {
          topIngredientes: parsed.topIngredientsList || [],
          antioxidanteTipo: parsed.antioxidantType as any,
          omega3OuPrebioticosGarantidos: item.foodType === 'UMIDO'
            ? !!(parsed.omega3MinPct && parsed.omega3MinPct >= 0.015)
            : !!(parsed.omega3MinPct && parsed.omega3MinPct >= 0.2),
          claimCarneTipo: 'COM_CARNE',
          isLightOuControlePeso: isLight,
          nomeComercial: item.commercialName,
          containsGmo: parsed.containsGmo,
        },
        item.foodType as any
      );

      const isComplementar = item.legalCategory === 'ALIMENTO_COMPLEMENTAR';
      const finalScoreTotal = isComplementar ? null : audit.scoreTotal;
      const finalClassificationTier = isComplementar ? 'COMPLEMENTAR' : audit.classificacaoFaixa;

      console.log(`   📊 Avaliação: Score=${finalScoreTotal ?? 'N/A'} | Faixa=${finalClassificationTier}`);
      console.log(`   🔬 Níveis: PB=${parsed.proteinaBrutaMinPct}% | EE=${parsed.extratoEtereoMinPct}% | Umidade=${parsed.umidadeMaxPct}% | FB=${parsed.materiaFibrosaMaxPct}% | MM=${parsed.materiaMineralMaxPct}% | Ca=${parsed.calcioMinPct}% | P=${parsed.fosforoMinPct}%`);

      // 7. Gerar ID e Arquivar Ativos
      const productId = 'cmtz' + crypto.randomBytes(10).toString('hex');
      const targetImgRel = `/uploads/produto_${productId}.webp`;
      const destImgPath = path.join(process.cwd(), 'public', targetImgRel);

      if (imageUrl) {
        console.log(`   🖼️ Baixando packshot oficial: ${imageUrl}`);
        const okImg = await downloadPackshot(imageUrl, destImgPath);
        if (okImg) {
          console.log(`   ✅ Imagem salva: public${targetImgRel}`);
        } else {
          console.warn(`   ⚠️ Falha ao baixar imagem remota.`);
        }
      }

      // 8. Gerar Parecer Editorial Técnico com Gemini AI
      console.log(`   🤖 Gerando parecer editorial técnico via Gemini AI...`);
      const editorialOpinion = await generateEditorialOpinionWithGemini({
        commercialName: item.commercialName,
        brand: 'Optimum',
        species: item.species,
        lifeStage: item.lifeStage,
        foodType: item.foodType,
        legalCategory: item.legalCategory,
        coadjuvanteCondition: null,
        proteinaBrutaMinPct: parsed.proteinaBrutaMinPct,
        energiaMetabolizavelKcalKg: parsed.energiaMetabolizavelKcalKg,
        antioxidantType: parsed.antioxidantType,
        containsGmo: parsed.containsGmo,
        topIngredients: parsed.topIngredientsList,
        scoreTotal: finalScoreTotal,
        classificationTier: finalClassificationTier,
        extratoPontos: audit.extratoPontos,
        calcioMinPct: parsed.calcioMinPct,
        calcioMaxPct: parsed.calcioMaxPct,
        fosforoMinPct: parsed.fosforoMinPct,
        umidadeMaxPct: parsed.umidadeMaxPct,
        extratoEtereoMinPct: parsed.extratoEtereoMinPct,
      });

      // 9. Gerar e Salvar Ficha Técnica HTML de Custódia
      const destHtmlRel = `/uploads/custodia/ficha_${productId}.html`;
      const destHtmlPath = path.join(process.cwd(), 'public', destHtmlRel);
      const custodyHtml = generateCustodyHtml({
        id: productId,
        slug: item.slug,
        commercialName: item.commercialName,
        brand: 'Optimum',
        manufacturerLegalName: 'Mars Brasil Alimentos Ltda',
        legalCategory: item.legalCategory,
        species: item.species,
        lifeStage: item.lifeStage,
        breedSize: item.breedSize,
        foodType: item.foodType,
        coadjuvanteCondition: null,
        sourceUrl: item.officialUrl,
        labelCollectionDate: new Date(),
        moistureMaxPct: parsed.umidadeMaxPct || 10,
        crudeProteinMinPct: parsed.proteinaBrutaMinPct || 20,
        etherExtractMinPct: parsed.extratoEtereoMinPct || 8,
        crudeFiberMaxPct: parsed.materiaFibrosaMaxPct || 4,
        mineralMatterMaxPct: parsed.materiaMineralMaxPct || 10,
        calciumMinPct: parsed.calcioMinPct || 0.8,
        calcioMaxPct: parsed.calcioMaxPct || 2.4,
        phosphorusMinPct: parsed.fosforoMinPct || 0.6,
        sodiumMinPct: parsed.sodioMinPct || 0.2,
        omega3MinPct: parsed.omega3MinPct || null,
        meatClaimType: 'COM_CARNE',
        containsGmo: parsed.containsGmo,
        gmoIngredients: parsed.gmoIngredients || null,
        antioxidantType: parsed.antioxidantType,
        topIngredients: JSON.stringify(parsed.topIngredientsList),
        scoreTotal: finalScoreTotal,
        classificationTier: finalClassificationTier,
        scoreBreakdown: audit.extratoPontos,
        editorialOpinion,
      });

      fs.writeFileSync(destHtmlPath, custodyHtml, 'utf-8');
      console.log(`   📄 Ficha de Custódia arquivada: public${destHtmlRel}`);

      // 10. Persistir no Banco de Dados
      await prisma.product.create({
        data: {
          id: productId,
          slug: item.slug,
          commercialName: item.commercialName,
          brand: 'Optimum',
          manufacturerLegalName: 'Mars Brasil Alimentos Ltda',
          legalCategory: item.legalCategory,
          species: item.species,
          lifeStage: item.lifeStage,
          breedSize: item.breedSize,
          foodType: item.foodType,
          coadjuvanteCondition: null,
          sourceUrl: item.officialUrl,
          sourceDocumentUrl: destHtmlRel,
          frontLabelImageUrl: targetImgRel,
          analyzedBatch: 'LOTE-OPTIMUM-MARS-2026',
          labelCollectionDate: new Date(),
          curatorResponsible: 'Ingestão Automática Web',
          moistureMaxPct: parsed.umidadeMaxPct || 10,
          crudeProteinMinPct: parsed.proteinaBrutaMinPct || 20,
          etherExtractMinPct: parsed.extratoEtereoMinPct || 8,
          crudeFiberMaxPct: parsed.materiaFibrosaMaxPct || 4,
          mineralMatterMaxPct: parsed.materiaMineralMaxPct || 10,
          calciumMinPct: parsed.calcioMinPct || 0.8,
          calciumMaxPct: parsed.calcioMaxPct || 2.4,
          phosphorusMinPct: parsed.fosforoMinPct || 0.6,
          sodiumMinPct: parsed.sodioMinPct || 0.2,
          omega3MinPct: parsed.omega3MinPct || null,
          meatClaimType: 'COM_CARNE',
          containsGmo: parsed.containsGmo,
          gmoIngredients: parsed.gmoIngredients || null,
          antioxidantType: parsed.antioxidantType,
          topIngredients: JSON.stringify(parsed.topIngredientsList),
          editorialOpinion,
          scoreTotal: finalScoreTotal,
          classificationTier: finalClassificationTier,
          scoreBreakdown: audit.extratoPontos as any,
          calculatedAt: new Date(),
          isPublished: true,
        },
      });

      successCount++;
      console.log(`   ✅ [${i + 1}/${mappings.length}] Produto cadastrado com sucesso no catálogo!`);
    } catch (err: any) {
      errorCount++;
      console.error(`💥 Erro fatal no produto ${item.commercialName}: ${err.message}`);
    }

    // Intervalo respeitoso
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n================================================================`);
  console.log(`🏁 FINALIZAÇÃO DO CADASTRO EM LOTE — MARS OPTIMUM`);
  console.log(`================================================================`);
  console.log(`✅ Sucesso: ${successCount}`);
  console.log(`⏩ Pulados (já existentes): ${skippedCount}`);
  console.log(`❌ Falhas: ${errorCount}`);
  console.log(`================================================================\n`);

  await closeTunnel();
}

main().catch(async (e) => {
  console.error(e);
  await closeTunnel();
  process.exit(1);
});
