/**
 * Repositório Central de Estudos & Guias Técnicos do PetRankings.
 * 
 * Regras Inegociáveis (AGENTS.md & pet-editorial-copywriter):
 * - Imparcialidade, fidelidade estrita aos dados oficiais e proibição de dados fictícios.
 * - Fundamentação em atos do MAPA (IN 22/2009, IN 30/2009, IN 39/2014, IN 110/2020, Decreto 12.031/2024)
 *   e diretrizes bromatológicas da 11ª Edição do Manual ABINPET e FEDIAF 2025.
 * - Inclusão de termos de isenção de responsabilidade e contexto veterinário.
 */

export interface GuideSection {
  id: string;
  heading: string;
  paragraphs: string[];
  callout?: {
    type: 'norma' | 'atencao' | 'dica';
    title: string;
    text: string;
  };
  table?: {
    caption?: string;
    headers: string[];
    rows: Array<string[]>;
  };
}

export interface GuideItem {
  slug: string;
  title: string;
  subtitle: string;
  cluster: 'Duelo de Marcas' | 'Ingredientes & Rótulos' | 'Nutrição & Bromatologia' | 'Saúde & Fases de Vida';
  speciesTarget: 'Cães' | 'Gatos' | 'Cães e Gatos';
  readingTimeMinutes: number;
  publishedAt: string;
  updatedAt: string;
  author: {
    name: string;
    role: string;
  };
  coverImageUrl: string;
  isFeatured?: boolean;
  summary: string;
  relatedProductSlugs: string[];
  sections: GuideSection[];
  faq: Array<{ q: string; a: string }>;
  conclusion: string;
}

export const GUIDES: GuideItem[] = [
  {
    slug: 'premier-formula-vs-golden-formula',
    title: 'PremieR Formula vs GoldeN Formula: O que muda na prática além do preço?',
    subtitle: 'Confronto técnico e bromatológico entre os dois alimentos mais populares da fabricante Grandfood no Brasil.',
    cluster: 'Duelo de Marcas',
    speciesTarget: 'Cães',
    readingTimeMinutes: 7,
    publishedAt: '2026-09-15',
    updatedAt: '2026-09-28',
    author: {
      name: 'Equipe de Curadoria Técnica',
      role: 'Observatório PetRankings',
    },
    coverImageUrl: '/uploads/guias/premier-vs-golden-duel-cover.webp',
    isFeatured: true,
    summary:
      'Comparamos detalhadamente os níveis de garantia em Matéria Seca (MS), a presença de conservantes artificiais (BHT/BHA), aditivos para articulações e a ordem dos primeiros ingredientes entre PremieR Formula e GoldeN Formula.',
    relatedProductSlugs: [
      'premier-formula-racas-medias-caes-adultos-sabor-frango',
      'golden-formula-caes-adultos-frango-arroz',
    ],
    sections: [
      {
        id: 'origem-e-posicionamento',
        heading: '1. O Posicionamento de Mercado: Super Premium vs Premium Especial',
        paragraphs: [
          'Tanto a linha PremieR Formula quanto a GoldeN Formula são fabricadas pela mesma companhia, a Grandfood Indústria e Comércio Ltda. Entretanto, elas atendem a segmentos regulatórios e comerciais distintos dentro da taxonomia pet brasileira.',
          'Enquanto a GoldeN Formula é classificada comercialmente como Premium Especial — focada em entregar boa digestibilidade com custo intermediário —, a PremieR Formula ocupa o patamar Super Premium, que historicamente exige maior densidade de nutrientes nobres, controle rígido de cinzas minerais e aditivos funcionais de alta tecnologia.',
        ],
        callout: {
          type: 'norma',
          title: 'Classificação Legal Conforme IN MAPA nº 30/2009',
          text: 'Perante a legislação oficial do Ministério da Agricultura (MAPA), ambos os produtos são registrados sob a mesma categoria obrigatória: "Alimento Completo para Cães". Os termos comerciais "Premium Especial" e "Super Premium" não são categorias legais do MAPA, mas sim convenções industriais balizadas pelo Manual Pet Food Brasil da ABINPET.',
        },
      },
      {
        id: 'analise-materia-seca',
        heading: '2. Níveis de Garantia Confrontados em Matéria Seca (MS)',
        paragraphs: [
          'Para uma comparação científica real, eliminamos a umidade de 10% declarada nos rótulos de ambas as embalagens, convertendo os nutrientes para Matéria Seca (MS). Essa conversão é compulsória para anular o efeito diluidor da água contida nos alimentos secos.',
          'Na Matéria Seca, a PremieR Formula entrega teores proteicos superiores (mínimo de 28,8% MS frente a 25,5% MS na GoldeN Formula). Além disso, a PremieR apresenta um teor menor de matéria mineral máxima (7,7% MS contra 8,8% MS da GoldeN), o que indica uso de cortes cárneos e farinhas com menor concentração de ossos e cartilagens.',
        ],
        table: {
          caption: 'Comparativo de Níveis de Garantia Oficiais (Matéria Seca - MS)',
          headers: ['Parâmetro Nutricional', 'PremieR Formula Adultos', 'GoldeN Formula Adultos', 'Padrão Mínimo ABINPET (Cão Adulto)'],
          rows: [
            ['Proteína Bruta (Mín.)', '28,88% MS (26% MN)', '25,55% MS (23% MN)', '18,00% MS'],
            ['Extrato Etéreo / Gordura (Mín.)', '16,66% MS (15% MN)', '12,22% MS (11% MN)', '5,50% MS'],
            ['Matéria Fibrosa (Máx.)', '3,33% MS (3% MN)', '3,33% MS (3% MN)', 'Não aplicável'],
            ['Matéria Mineral (Máx.)', '8,33% MS (7,5% MN)', '9,44% MS (8,5% MN)', 'Máximo recomendado 10,0%'],
            ['Fósforo Mínimo', '0,66% MS (0,6% MN)', '0,66% MS (0,6% MN)', '0,40% MS'],
          ],
        },
      },
      {
        id: 'conservantes-e-ingredientes',
        heading: '3. A Diferença de Ingredientes: Fontes Proteicas e Ômegas',
        paragraphs: [
          'No quesito conservação, ambos os lotes modernos avaliados das duas linhas (PremieR Formula e GoldeN Formula Frango & Arroz) apresentam um avanço louvável: já contam com sistema antioxidante natural à base de concentrado de tocoferóis, extrato de alecrim, chá verde e hortelã (embora algumas outras versões da linha GoldeN, como Peru & Arroz, ainda utilizem antioxidantes sintéticos BHT/BHA).',
          'A disparidade técnica real reside na densidade energética e nas fontes lipídicas: a PremieR Formula entrega 16,66% MS de extrato etéreo frente a 12,22% MS da GoldeN, além de incorporar óleo refinado de peixe (fonte direta de ômega-3 animal EPA e DHA) e farinha de torresmo no topo da fórmula, enquanto a GoldeN apoia-se principalmente no grão de linhaça como fonte vegetal.',
        ],
        callout: {
          type: 'atencao',
          title: 'Transgênicos (OGM)',
          text: 'Ambas as linhas convencionais utilizam grãos transgênicos (milho transgênico e derivados de soja com o símbolo T amarelo no rótulo, conforme Decreto nº 4.680/2003). Caso o tutor busque ração 100% livre de transgênicos da mesma fabricante, a alternativa é a linha PremieR Nattu.',
        },
      },
      {
        id: 'aditivos-funcionais',
        heading: '4. Matéria Mineral e Digestibilidade',
        paragraphs: [
          'Outro ponto relevante apurado em nossa análise técnica é a Matéria Mineral: a PremieR Formula apresenta teto de 8,33% na Matéria Seca, contra 9,44% na GoldeN Formula. Uma menor porcentagem de cinzas minerais em alimentos secos sinaliza o uso de farinhas proteicas com menor proporção de ossos e cartilagens, favorecendo a digestibilidade e o aproveitamento biológico dos nutrientes.',
        ],
      },
    ],
    faq: [
      {
        q: 'A GoldeN Formula Frango & Arroz é uma ração ruim?',
        a: 'Não. A GoldeN Formula cumpre com folga todas as exigências mínimas da 11ª Edição do Manual ABINPET para cães adultos. Trata-se de um alimento completo e balanceado com excelente aceitação no mercado, embora tenha menor densidade calórica e proteica do que a linha Super Premium.',
      },
      {
        q: 'Vale a pena pagar a diferença pela PremieR Formula?',
        a: 'Do ponto de vista técnico-bromatológico, a diferença de preço se justifica pelo aporte proteico superior (+3,3% em Matéria Seca), maior teor de gordura nobre com óleo de peixe (EPA/DHA) e menor percentual de cinzas minerais, o que resulta em melhor digestibilidade e menor volume de fezes.',
      },
      {
        q: 'Posso fazer a troca direta de uma pela outra?',
        a: 'Mesmo sendo da mesma fabricante, qualquer transição alimentar deve ser feita de forma gradual ao longo de 7 a 10 dias para evitar desarranjos gastrointestinais ou diarreia osmótica.',
      },
    ],
    conclusion:
      'Em resumo: a GoldeN Formula oferece excelente custo-benefício para quem precisa de um alimento completo e confiável sem onerar o orçamento mensal. Por outro lado, para tutores que priorizam maior densidade energética, ômega-3 de peixe marinho e menor carga de cinzas minerais, a PremieR Formula entrega uma especificação técnica superior comprovada nos dados oficiais.',
  },
  {
    slug: 'antioxidantes-bht-bha-vs-naturais-na-racao',
    title: 'BHT e BHA sob a lupa: Quais rações no Brasil já migraram para antioxidantes naturais?',
    subtitle: 'O panorama da conservação lipídica de pet food segundo a Instrução Normativa MAPA nº 110/2020 e a ciência moderna.',
    cluster: 'Ingredientes & Rótulos',
    speciesTarget: 'Cães e Gatos',
    readingTimeMinutes: 6,
    publishedAt: '2026-09-18',
    updatedAt: '2026-09-28',
    author: {
      name: 'Dr. Zootecnia & Análise Bromatológica',
      role: 'Corpo Técnico PetRankings',
    },
    coverImageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=1200&auto=format&fit=crop&q=80',
    isFeatured: false,
    summary:
      'Entenda o que são o Butil-hidroxitolueno (BHT) e o Butil-hidroxianisol (BHA), por que a indústria pet os utiliza há décadas e como identificar embalagens estabilizadas com tocoferóis naturais e extrato de alecrim.',
    relatedProductSlugs: [
      'cao-adulto-castrado-medio-sabor-mix-de-carnes',
      'formula-natural-fresh-meat-gatos-filhotes',
    ],
    sections: [
      {
        id: 'por-que-adicionar-antioxidantes',
        heading: '1. Por que toda ração seca precisa de antioxidantes?',
        paragraphs: [
          'Alimentos extrusados secos para cães e gatos contêm entre 10% e mais de 22% de gordura (extrato etéreo), proveniente de gordura de aves, óleo de peixe ou óleo de vísceras. Gorduras em contato prolongado com o oxigênio do ar sofrem um processo natural chamado peroxidação lipídica.',
          'Sem agentes antioxidantes, a gordura se degrada rapidamente, gerando radicais livres, alterando o odor da ração (ranço) e destruindo vitaminas lipossolúveis (A, D, E e K). Portanto, a inclusão de um sistema antioxidante é um imperativo biológico e tecnológico para a segurança alimentar do pet.',
        ],
      },
      {
        id: 'o-que-sao-bht-e-bha',
        heading: '2. O que são BHT e BHA e qual o marco legal do MAPA?',
        paragraphs: [
          'O BHT (Butil-hidroxitolueno - INS 321) e o BHA (Butil-hidroxianisol - INS 320) são compostos sintéticos derivados da indústria química que possuem excepcional estabilidade térmica, resistindo às altas temperaturas da extrusão sem perder sua capacidade antioxidante.',
          'No Brasil, seu uso é legalmente autorizado pela Instrução Normativa MAPA nº 110/2020, que fixa limites máximos estritos para a soma de BHT e BHA (normalmente até 150 mg/kg no alimento final). Quando respeitadas essas doses, os órgãos sanitários consideram seu uso seguro para cães e gatos.',
        ],
        callout: {
          type: 'norma',
          title: 'IN MAPA nº 110/2020 e Diretrizes FEDIAF',
          text: 'Tanto o MAPA quanto a EFSA (Autoridade Europeia para a Segurança Alimentar) estabelecem tetos toxicológicos seguros. No entanto, o debate científico sobre potenciais efeitos do acúmulo de aditivos sintéticos ao longo de anos de consumo contínuo impulsionou a demanda por conservantes naturais.',
        },
      },
      {
        id: 'alternativas-naturais',
        heading: '3. A Ascensão dos Tocoferóis, Alecrim e Ácido Cítrico',
        paragraphs: [
          'Nos últimos cinco anos, as marcas das categorias Super Premium e Super Premium Natural adotaram sistemas de conservação baseados em: concentrado de tocoferóis (mistura de formas ativas de Vitamina E natural), extrato de alecrim (*Rosmarinus officinalis*) e ácido cítrico.',
          'Embora os antioxidantes naturais sejam mais caros para a indústria e exijam controle de lote mais rigoroso contra luz e calor, eles eliminam por completo a ingestão de compostos sintéticos pelo animal ao longo de sua vida.',
        ],
        table: {
          caption: 'Comparação de Sistemas Antioxidantes em Pet Food',
          headers: ['Característica', 'Antioxidantes Naturais (Tocoferóis/Alecrim)', 'Antioxidantes Sintéticos (BHT/BHA)'],
          rows: [
            ['Origem', 'Vegetal / Botânica (Vitamina E e Ervas)', 'Síntese química industrial de derivados fenólicos'],
            ['Custo de Fabricação', 'Mais elevado (impacta o preço final)', 'Muito baixo e de ampla oferta'],
            ['Estabilidade Térmica', 'Moderada (exige adição em pós-extrusão)', 'Altíssima (resiste a grandes choques térmicos)'],
            ['Impacto no Score PetRankings', 'Pontuação Máxima (Pilar 3: Transparência)', 'Pontuação Básica (Sem bônus natural)'],
          ],
        },
      },
    ],
    faq: [
      {
        q: 'O BHT ou BHA na ração pode causar câncer no meu pet?',
        a: 'Não há comprovação científica de carcinogenicidade nas dosagens legais autorizadas pelo MAPA e pela FEDIAF para cães e gatos. O movimento em direção aos tocoferóis naturais decorre do princípio da precaução e da preferência dos tutores por ingredientes mais próximos do estado biológico natural.',
      },
      {
        q: 'Como checar no rótulo qual conservante a ração usa?',
        a: 'Vá até o final da lista de "Composição Básica" no verso da embalagem. Procure pela seção "Aditivos Tecnológicos" ou "Antioxidantes". Se ler "BHT, BHA", trata-se de conservação sintética. Se ler "extrato de alecrim, concentrado de tocoferóis", a conservação é natural.',
      },
    ],
    conclusion:
      'A escolha entre um alimento com BHT/BHA ou com antioxidantes naturais não deve ser motivo de pânico, mas de consciência. Se o orçamento do tutor permitir optar por marcas que já eliminaram os conservantes sintéticos, trata-se de um benefício qualitativo claro para o animal a longo prazo.',
  },
  {
    slug: 'como-calcular-materia-seca-racao-pet',
    title: 'A ilusão da umidade: Por que comparar ração seca e sachê exige cálculo em Matéria Seca (MS)',
    subtitle: 'O método matemático da 11ª Edição do Manual ABINPET para descobrir o teor proteico real do alimento do seu cão ou gato.',
    cluster: 'Nutrição & Bromatologia',
    speciesTarget: 'Cães e Gatos',
    readingTimeMinutes: 5,
    publishedAt: '2026-09-22',
    updatedAt: '2026-09-28',
    author: {
      name: 'Observatório Técnico',
      role: 'Equipe PetRankings',
    },
    coverImageUrl: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=1200&auto=format&fit=crop&q=80',
    isFeatured: false,
    summary:
      'Descubra por que um sachê úmido com apenas 8% de proteína bruta na embalagem pode ser, na verdade, muito mais proteico do que uma ração seca que declara 26% no rótulo.',
    relatedProductSlugs: [
      'racao-umida-whiskas-lata-pate-de-atum-para-gatos-adultos-290-g',
      'bionatural-prime-gatos-filhotes-salmao',
    ],
    sections: [
      {
        id: 'o-que-e-materia-natural-vs-seca',
        heading: '1. Matéria Natural (MN) vs Matéria Seca (MS): A Diluição da Água',
        paragraphs: [
          'Todos os níveis de garantia impressos nos sacos e latinhas no Brasil são expressos em Matéria Natural (MN), ou seja, considerando o alimento exatamente como ele se encontra na embalagem — inclusive a água.',
          'Enquanto uma ração seca comum contém entre 8% e 12% de umidade, um alimento úmido (sachê ou lata de patê) é composto por 80% a 85% de água pura. Como a água não fornece proteína nem calorias, ela "dilui" visualmente as porcentagens declaradas nos níveis de garantia.',
        ],
      },
      {
        id: 'a-formula-matematica',
        heading: '2. A Fórmula Oficial de Conversão para Matéria Seca',
        paragraphs: [
          'Para saber quanto de nutriente sobra quando toda a água evapora (que é o que o organismo do pet realmente absorve e aproveita), aplicamos a fórmula padrão do Manual Pet Food Brasil (ABINPET, 11ª Edição) e das diretrizes da FEDIAF 2025:',
          'Fórmula: Nutriente na MS (%) = [ Nutriente no Rótulo (%) / (100 - Umidade Máxima %) ] × 100',
        ],
        callout: {
          type: 'dica',
          title: 'Exemplo Prático Revelador',
          text: 'Um sachê úmido declara 8,5% de proteína bruta e 82% de umidade máxima. Aplicando a fórmula: 8,5 / (100 - 82) = 8,5 / 18 = 0,472 × 100 = 47,2% de Proteína Bruta na Matéria Seca! Ou seja: o sachê tem praticamente o dobro da concentração proteica real de uma ração seca convencional de 26% de proteína (que na MS fica em torno de 28,8%).',
        },
      },
      {
        id: 'tabela-comparativa-real',
        heading: '3. Comparação Direta: Seco vs Úmido em Matéria Seca',
        paragraphs: [
          'Veja na tabela abaixo como a ilusão da umidade distorce a percepção do consumidor comum que lê apenas os números da embalagem sem o rigor da bromatologia:',
        ],
        table: {
          caption: 'Confronto entre Alimento Seco e Úmido (Rótulo vs Realidade)',
          headers: ['Tipo de Alimento', 'Proteína no Rótulo (MN)', 'Umidade Máxima', 'Proteína Real na Matéria Seca (MS)'],
          rows: [
            ['Ração Seca Adulto Premium', '23,0% (parece alta)', '10,0% água', '25,5% de Proteína Real'],
            ['Ração Seca Super Premium', '32,0% (parece muito alta)', '9,0% água', '35,1% de Proteína Real'],
            ['Sachê / Alimento Úmido', '8,0% (parece baixíssima)', '82,0% água', '44,4% de Proteína Real!'],
            ['Lata / Patê Super Premium', '10,5% (parece baixa)', '78,0% água', '47,7% de Proteína Real!'],
          ],
        },
      },
    ],
    faq: [
      {
        q: 'Por que o fabricante não imprime logo o valor na Matéria Seca?',
        a: 'A Instrução Normativa MAPA nº 22/2009 exige compulsoriamente a declaração em Matéria Natural para que os órgãos fiscais possam recolher a amostra lacrada do lote no comércio e titular os teores em laboratório sem intervenções químicas prévias.',
      },
      {
        q: 'O PetRankings já faz esse cálculo automaticamente?',
        a: 'Sim! Em nosso algoritmo e em todas as fichas técnicas analisadas, o motor bromatológico do PetRankings calcula instantaneamente a Matéria Seca de todas as rações do Brasil, confrontando-as com as tabelas de referência da 11ª Edição da ABINPET.',
      },
    ],
    conclusion:
      'Nunca mais julgue o valor nutritivo de um alimento para cães e gatos sem eliminar mentalmente a umidade. A matemática da Matéria Seca é a chave mestre para comparar produtos com justiça e garantir que o seu pet receba a nutrição de que realmente precisa.',
  },
];

export function getAllGuides(): GuideItem[] {
  return GUIDES;
}

export function getFeaturedGuide(): GuideItem {
  return GUIDES.find((g) => g.isFeatured) || GUIDES[0];
}

export function getGuideBySlug(slug: string): GuideItem | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getRelatedGuides(currentSlug: string, limit = 2): GuideItem[] {
  return GUIDES.filter((g) => g.slug !== currentSlug).slice(0, limit);
}
