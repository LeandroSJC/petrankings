---
name: image-upload-manager
description: >-
  Manages product image upload workflows, file validation, storage strategies, and Next.js image optimization
  for PetRankings. Use this skill when implementing or modifying image upload features, configuring storage backends
  (local /public/uploads, Vercel Blob, or Cloudinary), optimizing product images with next/image, or handling
  cleanup of orphaned image files.
---

# Product Image Upload Manager

This skill guides the full lifecycle of product image uploads in PetRankings, from client-side validation to server-side storage and Next.js optimization delivery.

> 🚨 **Critical security advisory (August 25, 2026):** a critical-severity, unauthenticated RCE vulnerability (`GHSA-2xp9-vwfh-vxw4`) was found in the Image Optimization API when Next.js optimizes an attacker-controlled **AVIF** image, via the underlying `libheif`/`sharp` dependency. This is directly relevant here since section 1 lists AVIF as an accepted upload format and section 5 renders it through `next/image`. **Patch immediately** to Next.js `16.3.3` / `15.5.24` or later (`npm install next@16.3.3` or `next@15.5.24`). If you can't patch right away, disable AVIF optimization as an interim mitigation (see section 5).

## 1. Accepted Formats & Constraints

Per the product specification (`PetRankings.md § 7.3`):

| Constraint | Rule |
|---|---|
| Accepted formats | JPEG (`.jpg`, `.jpeg`), PNG (`.png`), WebP (`.webp`), AVIF (`.avif`) |
| Maximum file size | **5 MB** |
| MIME type validation | Server-side check required (never trust `Content-Type` header alone) |
| Dimensions | No strict requirement, but recommend 800×800px minimum for product clarity |

## 2. Client-Side Validation (Form)

```tsx
function validateImage(file: File): string | null {
  const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const MAX_SIZE_MB = 5;

  if (!ACCEPTED.includes(file.type)) {
    return 'Formato inválido. Use JPEG, PNG, WebP ou AVIF.';
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `A imagem deve ter no máximo ${MAX_SIZE_MB} MB.`;
  }
  return null;
}
```

> ⚠️ **This is UX only, not security.** `file.type` is the browser-reported MIME type and is trivially spoofable — a malicious client can rename a `.php` or `.svg`-with-script payload to `.jpg` and set any `Content-Type` it wants. This check exists purely to give the user fast feedback before uploading; the server-side checks in section 3 are what actually enforce the constraint.

## 3. Storage Backends

### Server-side validation & processing (do this before ANY storage backend)

Neither option below actually validates or sanitizes the file — that has to happen first, on the raw bytes, regardless of where the file ends up:

```typescript
// src/lib/image-processing.ts
import { fileTypeFromBuffer } from 'file-type'; // reads magic bytes — does NOT trust file.type or the extension
import sharp from 'sharp';

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export async function validateAndProcessImage(buffer: Buffer) {
  // 1. Detect the REAL type from the file's binary content, not the client-supplied header
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ACCEPTED_MIME.includes(detected.mime)) {
    throw new Error('Formato de arquivo inválido ou não reconhecido.');
  }

  // 2. Re-encode with sharp — this is not optional. Re-encoding strips EXIF/GPS metadata,
  //    neutralizes polyglot files (a "PNG" that's also valid JS/HTML), and normalizes the
  //    output regardless of what the input actually contained. Keep the detected format
  //    rather than converting everything to one type, so uploads stay lossless where they
  //    started that way (PNG in, PNG out) and don't balloon in size (WebP/AVIF in, JPEG out).
  const formatMap: Record<string, 'jpeg' | 'png' | 'webp' | 'avif'> = {
    'image/jpeg': 'jpeg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
  };

  const processed = await sharp(buffer, {
    limitInputPixels: 25_000_000, // defends against decompression-bomb files (small file, huge decoded size)
    failOn: 'truncated',          // reject partially-uploaded/corrupt files instead of decoding garbage
  })
    .rotate()                             // apply EXIF orientation, then...
    .withMetadata({ exif: {} })           // ...strip the rest of the metadata (GPS, camera info, etc.)
    .toFormat(formatMap[detected.mime], { quality: 85 })
    .toBuffer();

  return { buffer: processed, mime: detected.mime };
}
```

> Install with `npm install file-type sharp`. `file-type` is ESM-only from v19 — use dynamic `import()` if your route handler is CommonJS.

### Option A: Local Storage — `/public/uploads/` (Development / Simple VPS)
Store images in the `public` folder with unique names to prevent collisions:

```typescript
// src/app/api/upload/route.ts
import { writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { validateAndProcessImage } from '@/lib/image-processing';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('image') as File;

  if (!file) return Response.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const { buffer, mime } = await validateAndProcessImage(rawBuffer); // magic-byte check + re-encode

  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif',
  };
  const filename = `${randomUUID()}.${extMap[mime]}`; // extension from the DETECTED type, not the client filename
  const filepath = path.join(process.cwd(), 'public', 'uploads', filename);

  await writeFile(filepath, buffer);

  return Response.json({ imageUrl: `/uploads/${filename}` });
}
```

> ⚠️ **Limitation:** Local uploads are lost on serverless deployments (Vercel). Use Option B for production.

### Option B: Vercel Blob (Recommended for Vercel)

> ⚠️ **Body size conflict:** Vercel Functions enforce a hard **4.5 MB request body limit** at the infrastructure level — it cannot be raised from `vercel.json` or application code. Section 1 allows uploads up to **5 MB**, which means any file between 4.5–5 MB will fail with a `413` *before* it even reaches the validation code below, regardless of which route it takes. Two ways to resolve this:
> - Lower `MAX_SIZE_MB` to something under 4.5 MB if uploads must go through a server route, **or**
> - Switch to a **client upload** (browser → Blob directly, bypassing the Function entirely) — the correct fix if 5 MB needs to stay the real limit.

**Server upload** (simplest, subject to the 4.5 MB limit above):
```typescript
import { put } from '@vercel/blob';
import { validateAndProcessImage } from '@/lib/image-processing';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('image') as File;
  if (!file) return Response.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const { buffer, mime } = await validateAndProcessImage(rawBuffer);

  const blob = await put(file.name, buffer, { access: 'public', contentType: mime, addRandomSuffix: true });

  return Response.json({ imageUrl: blob.url });
}
```

**Client upload** (bypasses the 4.5 MB Function limit — needed if PetRankings wants to keep 5 MB, or support larger admin photos later):
```typescript
// src/app/api/upload/route.ts — issues short-lived tokens, does NOT touch file bytes
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
      maximumSizeInBytes: 5 * 1024 * 1024,
    }),
    onUploadCompleted: async ({ blob }) => {
      // NOTE: magic-byte validation + sharp re-encoding can't happen here — the file already
      // landed in Blob storage. For client uploads, either accept that trade-off (rely on
      // allowedContentTypes + a moderation/review step) or add a follow-up server job that
      // fetches the blob, re-validates, and replaces it.
    },
  });

  return Response.json(jsonResponse);
}
```

```tsx
// Client component
import { upload } from '@vercel/blob/client';

async function handleFileUpload(file: File) {
  const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
  return blob.url; // send this to your product-update endpoint
}
```

Requires `@vercel/blob` package and `BLOB_READ_WRITE_TOKEN` env var.

### Option C: Cloudinary
Use Cloudinary SDK for advanced image transformation (auto-crop, format conversion, CDN delivery). Cloudinary can also do server-side malware/moderation scanning as part of its upload pipeline, which is worth considering if `sharp`-based validation feels like more infrastructure than the team wants to own.

## 4. Storing the Reference in the Product

The `Product` model stores only a reference URL:
```typescript
// After upload succeeds, update the product's imageUrl:
await prisma.product.update({
  where: { id: productId },
  data: { imageUrl: uploadedUrl },
});
```

## 5. Displaying Images with `next/image`

Always use `next/image` for product images to get automatic format conversion, lazy loading, and responsive sizing:

```tsx
import Image from 'next/image';

<Image
  src={product.imageUrl}
  alt={product.title}
  width={400}
  height={400}
  className="product-image"
  // Add priority for above-the-fold images (first 3 products)
  priority={index < 3}
/>
```

Configure allowed image domains in `next.config.mjs`:
```javascript
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.vercel-storage.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};
```

> 🚨 **AVIF interim mitigation:** until you've confirmed the project is on Next.js `16.3.3` / `15.5.24` or later (see the advisory at the top of this file), the Image Optimization API is not safe for attacker-controlled AVIF input. If you can't patch immediately, disable AVIF in the optimizer's format negotiation:
> ```javascript
> const nextConfig = {
>   images: {
>     formats: ['image/webp'], // drop 'image/avif' until Next.js is patched
>     remotePatterns: [/* ... */],
>   },
> };
> ```
> This doesn't stop AVIF *uploads* (section 1) — it only stops `next/image` from running the optimizer over AVIF files. Once patched, `formats` can include `image/avif` again.

## 6. Image Upload Quality Checklist

- [ ] **Next.js is patched to `16.3.3` / `15.5.24` or later**, or AVIF is removed from `images.formats` as an interim mitigation (critical RCE advisory — see top of this file).
- [ ] File type validated server-side by **magic bytes** (`file-type` reading the actual binary content), not by `file.type` or the filename extension — both are client-controlled and spoofable.
- [ ] Every uploaded image is **re-encoded with `sharp`** before storage — this strips EXIF/GPS metadata and neutralizes polyglot files, not just "validates" them. Re-encoding uses `limitInputPixels` and `failOn: 'truncated'` to defend against decompression-bomb and corrupt-file attacks.
- [ ] File size enforced at max 5 MB before upload — **and** if uploads go through a Vercel Function/Route Handler, confirm this stays under the platform's 4.5 MB body limit, or switch to a client upload (`@vercel/blob/client`) that bypasses the Function entirely.
- [ ] Uploaded filename uses `randomUUID()` (with the extension taken from the *detected* MIME type, not the client's filename) to prevent path traversal and extension-spoofing attacks.
- [ ] `imageUrl` stored in `Product` model is a relative or absolute HTTPS URL.
- [ ] `next/image` is used for all product image rendering with explicit `width` and `height`.
- [ ] `priority` prop set on first 3 product images for LCP optimization.
- [ ] Old image files cleaned up when a product image is replaced (prevent orphaned files).
