import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    caes: [
      { slug: 'caes-adultos', label: 'Cães Adultos — Alimentos Secos' },
      { slug: 'caes-filhotes', label: 'Cães Filhotes — Alimentos Secos' },
    ],
    gatos: [
      { slug: 'gatos-adultos', label: 'Gatos Adultos — Alimentos Secos' },
      { slug: 'gatos-filhotes', label: 'Gatos Filhotes — Alimentos Secos' },
    ],
    coadjuvantes: [
      { slug: 'coadjuvantes', label: 'Catálogo de Alimentos Coadjuvantes' },
    ],
  });
}
