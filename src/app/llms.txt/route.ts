import prisma from '@/lib/prisma';
import { SITE_URL } from '@/lib/utils';
import { formatarTermo } from '@/lib/formatters';
import { getAllGuides } from '@/lib/content/guides';

export const dynamic = 'force-dynamic'; // Renderizado em runtime com conexão ativa ao banco e cacheado via HTTP headers

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
          const speciesLabel = p.species === 'CAO_E_GATO' ? 'Cães e Gatos' : p.species === 'CAO' ? 'Cães' : 'Gatos';
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

  // Acervo dinâmico de estudos e confrontos bromatológicos
  const guides = getAllGuides();
  const guidesMarkdown = guides.length > 0
    ? guides
        .map(
          (g) =>
            `- [${g.title}](${siteUrl}/guias/${g.slug}): (${g.speciesTarget} | ${g.cluster}) ${g.summary}`
        )
        .join('\n')
    : '_Nenhum estudo publicado no momento._';

  const content = `# PetRankings

> Observatório técnico e independente de nutrição animal, jornalismo de dados e confronto bromatológico de alimentos para cães e gatos no Brasil. Análise nutricional, níveis de garantia e composição baseados estritamente em páginas e fichas técnicas oficiais dos fabricantes custodiadas em HTML (com hash SHA-256) e diretrizes MAPA/ABINPET.

O PetRankings cataloga e classifica alimentos para pets por meio de critérios nutricionais objetivos e determinísticos. Não realizamos estimativas arbitrárias ou notas subjetivas: toda informação é extraída diretamente dos documentos técnicos e rotulagens oficiais disponibilizados pelos fabricantes.

## Metodologia de Avaliação Bromatológica (4 Pilares Determinísticos)

A classificação e a nota técnica (0 a 100 pontos) de cada alimento são calculadas de forma determinística pelo motor nutricional do PetRankings com base em normas oficiais (Manual Pet Food Brasil - ABINPET 11ª Edição, Instruções Normativas MAPA e FEDIAF):

1. **Pilar 1: Conformidade Bromatológica em Matéria Seca (MS) (40 pontos):** Converte a Proteína Bruta (PB) e o Extrato Etéreo (EE) do rótulo para a base 100% seca, confrontando com os pisos nutricionais da ABINPET e aplicando desconto punitivo para alimentos secos com cinzas/matéria mineral excessiva (>9.5% MS ou >10% MS), indicativo de excesso de ossos moídos em vez de carne nobre.
2. **Pilar 2: Balanço Mineral e Relação Cálcio:Fósforo (Ca:P) (20 pontos):** Avalia a razão estrita de Cálcio e Fósforo nos limites de segurança biológica (faixa ideal de 1.1:1 a 1.6:1 para cães; 1.0:1 a 2.0:1 para gatos), prevenindo riscos renais crônicos e osteodistrofias.
3. **Pilar 3: Nobreza e Digestibilidade dos Ingredientes (25 pontos):** Inspeciona a ordem decrescente mandatória de rotulagem (IN MAPA 22/2009). Bonifica fontes cárneas nobres nas 1ª e 2ª posições (carne fresca, farinha de vísceras isolada, peixe, cordeiro) e penaliza o uso preponderante de farelos vegetais e subprodutos.
4. **Pilar 4: Transparência, Conservantes e Aditivos (15 pontos):** Bonifica alimentos estabilizados com antioxidantes 100% naturais (tocoferóis, extrato de alecrim, chá verde) em detrimento de conservantes químicos sintéticos (BHA e BHT), rastreia a presença de transgênicos (OGM) e pontua a inclusão de prebióticos comprovados (MOS/FOS) e Ômega-3 funcional.

## Estudos Bromatológicos & Confrontos Técnicos

${guidesMarkdown}

## Categorias e Guias Nutricionais

- [Rações para Cães Adultos](${siteUrl}/indice/caes-adultos): Classificação técnica e determinística de alimentos secos para cães adultos com base no Manual ABINPET.
- [Rações para Cães Filhotes](${siteUrl}/indice/caes-filhotes): Avaliação nutricional para o crescimento e desenvolvimento de filhotes de cães (densidade proteica e balanço Ca/P).
- [Rações para Gatos Adultos](${siteUrl}/indice/gatos-adultos): Avaliação técnica para felinos adultos e castrados (proteína animal e moderação mineral).
- [Rações para Gatos Filhotes](${siteUrl}/indice/gatos-filhotes): Avaliação documental e exigências estritas para filhotes de gatos.
- [Alimentos Coadjuvantes](${siteUrl}/coadjuvantes): Guia de rações coadjuvantes para suporte a condições clínicas específicas sob prescrição veterinária.
- [Fabricantes e Marcas](${siteUrl}/fabricante): Catálogo de fabricantes cadastrados e suas respectivas linhas comerciais.

## Produtos Analisados

${productsMarkdown}

## Informações Institucionais

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
