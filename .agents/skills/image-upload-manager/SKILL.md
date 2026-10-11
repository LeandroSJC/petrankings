---
name: image-upload-manager
description: >-
  Manages product image upload workflows, file validation, storage strategies, and Next.js image optimization
  for PetRankings. Use this skill when implementing or modifying image upload features, configuring persistent storage
  (/public/uploads via Docker volume), optimizing product images with sharp/WebP, or handling cleanup of orphaned files.
---

# Product Image Upload & Storage Manager

This skill guides the full lifecycle of product image uploads in PetRankings, from client-side validation to server-side magic-byte inspection, sharp re-encoding, and persistent storage delivery in the Oracle Cloud Docker environment.

---

## 1. Accepted Formats & Storage Strategy

* **Accepted Formats:** JPEG (`.jpg`, `.jpeg`), PNG (`.png`), WebP (`.webp`), AVIF (`.avif`), PDF (`.pdf` para fichas de custódia).
* **Maximum File Size:** **15 MB** (enforced in `src/app/api/upload/route.ts`).
* **Storage Engine:** Local filesystem at `/public/uploads/` mounted persistently via Docker Volume (`./public/uploads:/app/public/uploads` e `./public/uploads:/var/www/uploads:ro` no Caddy).
* **Serving:** Caddy acts as reverse proxy and static asset server, bridging Cloudflare directly to disk.

---

## 2. Server-Side Magic Bytes Inspection

Never trust client-reported `file.type` or file extensions. The upload endpoint [`src/app/api/upload/route.ts`](file:///d:/Projetos/PetRankings/src/app/api/upload/route.ts) inspects the binary magic bytes directly:

```typescript
function detectFileType(buffer: Buffer): 'pdf' | 'jpeg' | 'png' | 'webp' | 'avif' | null {
  if (buffer.length < 12) return null;

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'pdf';
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'webp';
  }

  return null;
}
```

---

## 3. Sharp Optimization & Normalization Pipeline

When processing product packaging or duel covers (e.g., `scripts/gerar-capas-duelo.js` or `scripts/cadastrar-produtos.ts`), use `sharp` to:
1. Strip invasive EXIF metadata.
2. Trim transparent borders.
3. Resize product packs to standardized dimensions (e.g. 490px height for duel covers).
4. Output as lightweight WebP with 85–90 quality.

```typescript
import sharp from 'sharp';

const processedBuffer = await sharp(rawBuffer)
  .rotate()
  .trim()
  .webp({ quality: 85 })
  .toBuffer();
```

---

## 4. Persistent Storage Architecture in Docker

In `docker-compose.yml`, uploads are mounted to host disk:

```yaml
services:
  caddy:
    volumes:
      - ./public/uploads:/var/www/uploads:ro

  app:
    volumes:
      - ./public/uploads:/app/public/uploads
```

* **No serverless cold-loss:** Images remain safely on NVMe SSD storage across restarts, container rebuilds, and migrations.
* **Database Reference:** Products store the relative URL in `frontLabelImageUrl` (e.g., `/uploads/minha-imagem.webp`).

---

## 5. Image Quality & Security Checklist

- [ ] File type validated strictly via binary **magic bytes**.
- [ ] Uploaded filename generated with `crypto.randomUUID()` to prevent path traversal.
- [ ] Product images rendered with responsive width/height and `loading="lazy"` (except above-the-fold hero images with `priority`).
- [ ] Uploads stored persistently under `/public/uploads/` with Docker volume backup.
- [ ] Broken images audited routinely via `npm run auditar:imagens` (`scripts/auditar-e-reparar-imagens.ts`).
