/**
 * Script Oficial de Geração de Capas para o Cluster "Duelo de Marcas" — PetRankings
 * 
 * Padrão Visual Obrigatório:
 * - Dimensões: 1200 x 630 px (proporção 1.91:1 recomendada para OpenGraph e Google Discover)
 * - Fundo: Estúdio fotográfico clean (#ffffff -> #f8fafc -> #e2e8f0) com iluminação central radial
 * - Sombras de contato no piso: elipses radiais nos pontos de apoio dos pacotes (cx=360 e cx=840)
 * - Linhas divisórias: tracejado sutil central
 * - Badge de confronto: Círculo escuro (#0f172a) com tipografia 'VS' em destaque
 * - Pacotes dos produtos: Redimensionados para 490px de altura com transparência perfeita de fundo
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function getStudioSvgBg() {
  return `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="50%" stop-color="#f8fafc" />
        <stop offset="100%" stop-color="#e2e8f0" />
      </linearGradient>
      <radialGradient id="podium" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(15, 23, 42, 0.24)" />
        <stop offset="50%" stop-color="rgba(15, 23, 42, 0.08)" />
        <stop offset="100%" stop-color="rgba(15, 23, 42, 0)" />
      </radialGradient>
      <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(255, 255, 255, 0.9)" />
        <stop offset="100%" stop-color="rgba(255, 255, 255, 0)" />
      </radialGradient>
    </defs>
    
    <!-- Fundo de estúdio fotográfico clean -->
    <rect width="1200" height="630" fill="url(#bg)" />
    
    <!-- Luz de estúdio ao centro -->
    <circle cx="600" cy="315" r="400" fill="url(#centerGlow)" />
    <circle cx="600" cy="315" r="320" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2" />
    <circle cx="600" cy="315" r="220" fill="none" stroke="rgba(226, 232, 240, 0.5)" stroke-width="1.5" />

    <!-- Sombras de contato no piso para os dois pacotes -->
    <ellipse cx="360" cy="565" rx="190" ry="24" fill="url(#podium)" />
    <ellipse cx="840" cy="565" rx="190" ry="24" fill="url(#podium)" />
    
    <!-- Linhas divisórias sutis de confronto -->
    <line x1="600" y1="50" x2="600" y2="245" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="6 6" />
    <line x1="600" y1="385" x2="600" y2="580" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="6 6" />
    
    <!-- Símbolo de Confronto Central (Badge Estilizado VS) -->
    <g transform="translate(600, 315)">
      <circle cx="0" cy="0" r="54" fill="none" stroke="rgba(15, 23, 42, 0.08)" stroke-width="2" />
      <circle cx="0" cy="0" r="48" fill="none" stroke="rgba(15, 23, 42, 0.15)" stroke-width="1.5" stroke-dasharray="3 3" />
      <circle cx="0" cy="0" r="44" fill="#0f172a" />
      <circle cx="0" cy="0" r="40" fill="none" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1.5" />
      <text x="0" y="10" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="26" fill="#ffffff" text-anchor="middle" letter-spacing="2">VS</text>
    </g>
  </svg>
  `;
}

async function makeWhiteBackgroundTransparent(inputPath) {
  const img = sharp(inputPath);
  const metadata = await img.metadata();
  if (metadata.hasAlpha) {
    return img.toBuffer();
  }

  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const channels = info.channels;
  
  const rgba = Buffer.alloc(w * h * 4);
  const visited = new Uint8Array(w * h);
  
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = data[i * channels];
    rgba[i * 4 + 1] = data[i * channels + 1];
    rgba[i * 4 + 2] = data[i * channels + 2];
    rgba[i * 4 + 3] = 255;
  }
  
  const queue = [];
  function isWhite(x, y) {
    const idx = (y * w + x) * 4;
    return rgba[idx] > 248 && rgba[idx+1] > 248 && rgba[idx+2] > 248;
  }
  
  for (let x = 0; x < w; x++) {
    if (isWhite(x, 0)) { queue.push(x, 0); visited[0 * w + x] = 1; }
    if (isWhite(x, h - 1)) { queue.push(x, h - 1); visited[(h - 1) * w + x] = 1; }
  }
  for (let y = 0; y < h; y++) {
    if (isWhite(0, y) && !visited[y * w + 0]) { queue.push(0, y); visited[y * w + 0] = 1; }
    if (isWhite(w - 1, y) && !visited[y * w + (w - 1)]) { queue.push(w - 1, y); visited[y * w + (w - 1)] = 1; }
  }
  
  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    rgba[(cy * w + cx) * 4 + 3] = 0;
    
    const n = [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]];
    for (const [nx, ny] of n) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const vIdx = ny * w + nx;
        if (!visited[vIdx] && isWhite(nx, ny)) {
          visited[vIdx] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }
  
  return sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).webp().toBuffer();
}

async function createDuelCover(pack1Path, pack2Path, outputFileName) {
  const outputDir = path.join(__dirname, '..', 'public', 'uploads', 'guias');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const p1Buf = await makeWhiteBackgroundTransparent(pack1Path);
  const p2Buf = await makeWhiteBackgroundTransparent(pack2Path);

  const p1Resized = await sharp(p1Buf).resize({ height: 490 }).toBuffer();
  const m1 = await sharp(p1Resized).metadata();

  const p2Resized = await sharp(p2Buf).resize({ height: 490 }).toBuffer();
  const m2 = await sharp(p2Resized).metadata();

  const leftX1 = Math.round(360 - m1.width / 2);
  const leftX2 = Math.round(840 - m2.width / 2);
  const topY = 80;

  const outputPath = path.join(outputDir, outputFileName);

  await sharp(Buffer.from(getStudioSvgBg()))
    .composite([
      { input: p1Resized, top: topY, left: leftX1 },
      { input: p2Resized, top: topY, left: leftX2 },
    ])
    .webp({ quality: 94 })
    .toFile(outputPath);

  console.log(`[Duelo de Marcas] Capa gerada com sucesso: ${outputPath}`);
}

module.exports = { createDuelCover };
