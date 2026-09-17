import prisma from '@/lib/prisma';
import { SITE_URL } from '@/lib/utils';
import { formatarTermo } from '@/lib/formatters';

export const revalidate = 3600; // Revalidação a cada 1 hora (ISR)

export async function GET(): Promise<Response> {
  const siteUrl = SITE_URL;

  let productsMarkdown = '';

  try {
    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
      },
      select: {
        slug: true,
        commercialName: true,
        brand: true,
        species: true,
        classificationTier: true,
        crudeProteinMinPct: true,
        scoreTotal: true,
      },
      orderBy: [
        { scoreTotal: 'desc' },
        { commercialName: 'asc' },
      ],
    });

    if (products.length > 0) {
      productsMarkdown = products
        .map((p) => {
          const speciesLabel = p.species === 'CAO' ? 'Cães' : 'Gatos';
          const tierLabel = formatarTermo(p.classificationTier) || 'Classificação Técnica';
          const scoreLabel = p.scoreTotal !== null && p.scoreTotal !== undefined ? `${p.scoreTotal}/100` : 'N/A';
          return `- [${p.commercialName}](${siteUrl}/produto/${p.slug}): ${p.brand} | Espécie: ${speciesLabel} | Padrão: ${tierLabel} | Proteína Mín.: ${p.crudeProteinMinPct}% | Nota: ${scoreLabel}`;
        })
        .join('\n');
    } else {
      productsMarkdown = '_Nenhum produto publicado no catálogo no momento._';
    }
  } catch (error) {
    console.error('Erro ao consultar produtos para /llms.txt:', error);
    productsMarkdown = '_Catálogo de produtos temporariamente indisponível para listagem direta._';
  }

  const content = `# PetRankings

> Comparador técnico e independente de alimentos para cães e gatos no Brasil. Análise nutricional, níveis de garantia e composição baseados estritamente em laudos e fichas técnicas oficiais dos fabricantes e diretrizes MAPA/ABINPET.

O PetRankings cataloga e classifica alimentos para pets por meio de critérios nutricionais objetivos e determinísticos. Não realizamos estimativas arbitrárias ou notas subjetivas: toda informação é extraída diretamente dos documentos técnicos e rotulagens oficiais disponibilizados pelos fabricantes.

## Categorias e Guias Nutricionais

- [Rações para Cães Adultos](${siteUrl}/indice/caes-adultos): Classificação técnica e determinística de alimentos secos para cães adultos com base no Manual ABINPET.
- [Rações para Cães Filhotes](${siteUrl}/indice/caes-filhotes): Avaliação nutricional para o crescimento e desenvolvimento de filhotes de cães (densidade proteica e balanço Ca/P).
- [Rações para Gatos Adultos](${siteUrl}/indice/gatos-adultos): Avaliação técnica para felinos adultos e castrados (proteína animal e moderação mineral).
- [Rações para Gatos Filhotes](${siteUrl}/indice/gatos-filhotes): Avaliação documental e exigências estritas para filhotes de gatos.
- [Alimentos Coadjuvantes](${siteUrl}/coadjuvantes): Guia de rações coadjuvantes para suporte a condições clínicas específicas sob prescrição veterinária.
- [Fabricantes e Marcas](${siteUrl}/fabricante): Catálogo de fabricantes auditados e suas respectivas linhas comerciais.

## Produtos Analisados

${productsMarkdown}

## Optional

- [Sobre o PetRankings](${siteUrl}/sobre): Metodologia editorial, critérios do motor de avaliação e transparência de dados.
- [Política de Privacidade](${siteUrl}/politica-de-privacidade): Termos de uso e diretrizes de privacidade de dados.
- [Contato](${siteUrl}/contato): Canal para esclarecimento de dúvidas, correções e contato com a equipe editorial.
`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
