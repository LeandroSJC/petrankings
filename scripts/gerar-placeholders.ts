import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generatePlaceholders() {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 1. Placeholder Cão
  const dogSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <defs>
      <radialGradient id="bgDog" cx="50%" cy="42%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="60%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#f1f5f9"/>
      </radialGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.06"/>
      </filter>
    </defs>

    <!-- Fundo de estúdio fotográfico limpo -->
    <rect width="800" height="800" fill="url(#bgDog)"/>
    <rect x="28" y="28" width="744" height="744" rx="36" fill="none" stroke="#e2e8f0" stroke-width="2"/>

    <!-- Eyebrow Institucional -->
    <text x="400" y="140" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" letter-spacing="4" fill="#047857">PETRANKINGS • AUDITORIA OFICIAL</text>

    <!-- Card Central com Ícone do Cão -->
    <g filter="url(#shadow)">
      <circle cx="400" cy="340" r="130" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
      <circle cx="400" cy="340" r="115" fill="#f0fdf4"/>
    </g>

    <!-- Silhueta Minimalista Cão (Linhas Elegantes) -->
    <g transform="translate(325, 265) scale(6.25)" fill="none" stroke="#047857" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <!-- Orelha esquerda caidinha -->
      <path d="M7 6 C5 8, 4 12, 6 15 C7 16, 9 15, 9 13 Z" fill="#dcfce7" fill-opacity="0.6"/>
      <!-- Cabeça e focinho -->
      <path d="M9 10 C10 7, 14 7, 15 10 C16 11, 19 11, 20 13 C20.5 14, 20 16, 18 16 C16 16, 14 17, 12 18 C10 17, 8 16, 8 14 Z"/>
      <!-- Olho e focinho -->
      <circle cx="12" cy="11.5" r="0.8" fill="#047857"/>
      <path d="M19 13.5 C19.5 13.8, 19.5 14.5, 18.8 14.5 C18.2 14.5, 18 13.8, 19 13.5 Z" fill="#047857"/>
      <!-- Coleira minimalista -->
      <path d="M9 16.5 Q12 18.5 15 16.5" stroke="#059669" stroke-width="2"/>
    </g>

    <!-- Tipografia de Aviso e Status -->
    <text x="400" y="540" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" fill="#0f172a" letter-spacing="-0.5">Imagem em Atualização</text>
    <text x="400" y="580" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#64748b">Ficha Técnica Oficial e Avaliação Concluídas</text>

    <!-- Badge da Espécie -->
    <g transform="translate(285, 620)">
      <rect width="230" height="46" rx="23" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
      <circle cx="32" cy="23" r="6" fill="#059669"/>
      <text x="130" y="29" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#334155" letter-spacing="1.5">ALIMENTO P/ CÃES</text>
    </g>
  </svg>
  `;

  // 2. Placeholder Gato
  const catSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <defs>
      <radialGradient id="bgCat" cx="50%" cy="42%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="60%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#f1f5f9"/>
      </radialGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.06"/>
      </filter>
    </defs>

    <!-- Fundo de estúdio fotográfico limpo -->
    <rect width="800" height="800" fill="url(#bgCat)"/>
    <rect x="28" y="28" width="744" height="744" rx="36" fill="none" stroke="#e2e8f0" stroke-width="2"/>

    <!-- Eyebrow Institucional -->
    <text x="400" y="140" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" letter-spacing="4" fill="#047857">PETRANKINGS • AUDITORIA OFICIAL</text>

    <!-- Card Central com Ícone do Gato -->
    <g filter="url(#shadow)">
      <circle cx="400" cy="340" r="130" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
      <circle cx="400" cy="340" r="115" fill="#f0fdf4"/>
    </g>

    <!-- Silhueta Minimalista Gato (Orelhas pontudas, focinho delicado) -->
    <g transform="translate(325, 265) scale(6.25)" fill="none" stroke="#047857" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <!-- Orelha esquerda e direita -->
      <path d="M6 7 L9 13" stroke="#047857"/>
      <path d="M6 7 L12 9" stroke="#047857"/>
      <path d="M18 7 L15 13" stroke="#047857"/>
      <path d="M18 7 L12 9" stroke="#047857"/>
      <!-- Contorno da cabeça -->
      <path d="M7 14 C6 18, 18 18, 17 14 C17 10, 7 10, 7 14 Z" fill="#dcfce7" fill-opacity="0.4"/>
      <!-- Olhos felinos amendoados -->
      <path d="M9.5 13 Q10.5 12 11.5 13" stroke="#047857" stroke-width="1.4"/>
      <path d="M12.5 13 Q13.5 12 14.5 13" stroke="#047857" stroke-width="1.4"/>
      <!-- Focinho e bigodes -->
      <polygon points="12,14.5 11.3,15.2 12.7,15.2" fill="#047857"/>
      <line x1="12" y1="15.2" x2="12" y2="16.2"/>
      <!-- Bigodes sutis -->
      <line x1="7" y1="14.8" x2="4" y2="14.2" stroke="#059669" stroke-width="1.2"/>
      <line x1="7" y1="16" x2="4" y2="16.5" stroke="#059669" stroke-width="1.2"/>
      <line x1="17" y1="14.8" x2="20" y2="14.2" stroke="#059669" stroke-width="1.2"/>
      <line x1="17" y1="16" x2="20" y2="16.5" stroke="#059669" stroke-width="1.2"/>
    </g>

    <!-- Tipografia de Aviso e Status -->
    <text x="400" y="540" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="800" fill="#0f172a" letter-spacing="-0.5">Imagem em Atualização</text>
    <text x="400" y="580" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="500" fill="#64748b">Ficha Técnica Oficial e Avaliação Concluídas</text>

    <!-- Badge da Espécie -->
    <g transform="translate(285, 620)">
      <rect width="230" height="46" rx="23" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
      <circle cx="32" cy="23" r="6" fill="#059669"/>
      <text x="130" y="29" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#334155" letter-spacing="1.5">ALIMENTO P/ GATOS</text>
    </g>
  </svg>
  `;

  const dogOut = path.join(uploadsDir, 'placeholder-cao.webp');
  const catOut = path.join(uploadsDir, 'placeholder-gato.webp');

  await sharp(Buffer.from(dogSvg))
    .webp({ quality: 95 })
    .toFile(dogOut);
  console.log(`✅ Placeholder Cães gerado em: ${dogOut}`);

  await sharp(Buffer.from(catSvg))
    .webp({ quality: 95 })
    .toFile(catOut);
  console.log(`✅ Placeholder Gatos gerado em: ${catOut}`);
}

generatePlaceholders().catch((err) => {
  console.error('❌ Erro ao gerar placeholders:', err);
  process.exit(1);
});
