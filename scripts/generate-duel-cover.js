const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateCover() {
  const outputDir = path.join(__dirname, '..', 'public', 'uploads', 'guias');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Fundo de estúdio elegante e limpo sem nenhum texto, apenas iluminação e sombras
  const svgBg = `
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
      <!-- Sombra e anéis externos -->
      <circle cx="0" cy="0" r="54" fill="none" stroke="rgba(15, 23, 42, 0.08)" stroke-width="2" />
      <circle cx="0" cy="0" r="48" fill="none" stroke="rgba(15, 23, 42, 0.15)" stroke-width="1.5" stroke-dasharray="3 3" />
      <circle cx="0" cy="0" r="44" fill="#0f172a" />
      <circle cx="0" cy="0" r="40" fill="none" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1.5" />
      <!-- Símbolo VS -->
      <text x="0" y="10" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="26" fill="#ffffff" text-anchor="middle" letter-spacing="2">VS</text>
    </g>
  </svg>
  `;

  const premierPath = path.join(__dirname, '..', 'public', 'uploads', 'produto_cmtz500888316eeb6a762440.webp');
  const goldenPath = path.join(__dirname, '..', 'public', 'uploads', 'produto_cmtz2f2486b053551d658344.webp');

  // Redimensionar os pacotes para 490px de altura para preencher o enquadramento nobremente
  const p1 = await sharp(premierPath)
    .resize({ height: 490 })
    .toBuffer();
  const m1 = await sharp(p1).metadata();

  const p2 = await sharp(goldenPath)
    .resize({ height: 490 })
    .toBuffer();
  const m2 = await sharp(p2).metadata();

  const leftX1 = Math.round(360 - m1.width / 2);
  const topY1 = 80;

  const leftX2 = Math.round(840 - m2.width / 2);
  const topY2 = 80;

  const outputPath = path.join(outputDir, 'premier-vs-golden-duel-cover.webp');

  await sharp(Buffer.from(svgBg))
    .composite([
      { input: p1, top: topY1, left: leftX1 },
      { input: p2, top: topY2, left: leftX2 },
    ])
    .webp({ quality: 94 })
    .toFile(outputPath);

  console.log('Cover image generated without text successfully at:', outputPath);
}

generateCover().catch((err) => {
  console.error('Error generating cover:', err);
  process.exit(1);
});
