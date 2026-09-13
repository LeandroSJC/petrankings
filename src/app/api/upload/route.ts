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

    // Validação ampla por extensão ou por MIME type (vital para compatibilidade Windows)
    const isExtensionAllowed = ALLOWED_EXTENSIONS.includes(ext);
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) || !file.type;

    if (!isExtensionAllowed && !isMimeAllowed) {
      return NextResponse.json(
        { error: 'Formato inválido. Formatos aceitos: PDF, JPG, PNG, WebP e AVIF.' },
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

    const productId = (formData.get('productId') as string)?.trim();
    const fileKind = (formData.get('fileKind') as string)?.trim();

    // Determina se é PDF ou imagem
    const isPdf = ext === '.pdf' || file.type.includes('pdf');
    const safeExt = ext || (isPdf ? '.pdf' : '.jpg');

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
