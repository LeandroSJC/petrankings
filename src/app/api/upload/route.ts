import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/avif',
  'application/pdf',
  'application/x-pdf',
  'application/octet-stream',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.pdf'];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

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
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'webp';
  }

  // AVIF: ftypavif ou ftypavis a partir do offset 4
  const ftyp = buffer.subarray(4, 12).toString('ascii');
  if (ftyp.includes('avif') || ftyp.includes('avis')) {
    return 'avif';
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'admin' && session.role !== 'curador')) {
      return NextResponse.json({ error: 'Acesso restrito a administradores e curadores' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const originalName = file.name || '';
    const ext = path.extname(originalName).toLowerCase();

    // Validação estrita de extensão permitida
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: 'Extensão de arquivo inválida. Permitidos: PDF, JPG, PNG, WebP e AVIF.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Tamanho do arquivo excede o limite máximo de 15 MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validação de Magic Bytes (assinatura binária real do arquivo)
    const detectedType = detectFileType(buffer);
    if (!detectedType) {
      return NextResponse.json(
        { error: 'Assinatura binária do arquivo inválida. O arquivo não corresponde a uma imagem ou PDF legítimo.' },
        { status: 400 }
      );
    }

    const extMap: Record<string, string> = {
      pdf: '.pdf',
      jpeg: '.jpg',
      png: '.png',
      webp: '.webp',
      avif: '.avif',
    };
    const safeExt = extMap[detectedType];
    const isPdf = detectedType === 'pdf';

    const productId = (formData.get('productId') as string)?.trim();
    const fileKind = (formData.get('fileKind') as string)?.trim();

    let filename: string;
    if (productId) {
      // Sanitiza o ID do produto para garantir nome de arquivo seguro
      const sanitizedId = productId.replace(/[^a-zA-Z0-9_-]/g, '');
      const prefix = fileKind === 'ficha' || isPdf ? 'ficha' : 'produto';
      filename = `${prefix}_${sanitizedId}${safeExt}`;
    } else {
      const prefix = isPdf ? 'comprovante' : 'produto';
      filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${safeExt}`;
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    console.error('Erro no upload de arquivo:', error);
    return NextResponse.json({ error: 'Erro ao processar upload do arquivo' }, { status: 500 });
  }
}
