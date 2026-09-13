import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'application/pdf',
];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
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

    // Gerar nome de arquivo único e seguro
    const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.jpg');
    const prefix = file.type === 'application/pdf' ? 'comprovante' : 'produto';
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

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
    console.error('Erro no upload de imagem:', error);
    return NextResponse.json({ error: 'Erro ao processar upload da imagem' }, { status: 500 });
  }
}
