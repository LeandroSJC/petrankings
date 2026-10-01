/**
 * Repositório Central de Estudos & Guias Técnicos do PetRankings.
 * 
 * Regras Inegociáveis (AGENTS.md & pet-editorial-copywriter):
 * - RIGOR PROBATÓRIO E TOLERÂNCIA ZERO A ALUCINAÇÕES: Todos os dados, porcentagens,
 *   ingredientes e afirmações devem possuir fontes primárias reais, idôneas e verificáveis
 *   (fichas técnicas oficiais em HTML sob custódia criptográfica, Manual ABINPET 11ª Edição,
 *   FEDIAF e atos normativos vigentes do MAPA arquivados em biblioteca_regulatoria/).
 * - É terminantemente proibido inventar dados, deduzir números não declarados ou criar
 *   leis e resoluções fictícias. Caso uma informação não conste nas fontes oficiais, deve-se
 *   declarar a ausência pública da informação ou omiti-la.
 * - AUTORIA INSTITUCIONAL PADRONIZADA: Todos os estudos são assinados compulsoriamente
 *   por DEFAULT_GUIDE_AUTHOR ("Equipe de Curadoria Técnica", "Observatório PetRankings").
 *   Proibida a invenção de personas fictícias ("Dr. Zootecnia", etc.).
 * - REGRA MANDATÓRIA DE CITAÇÃO DE PRODUTOS: Apenas produtos EFETIVAMENTE citados,
 *   analisados ou confrontados no texto do estudo/guia podem constar em `relatedProductSlugs`.
 *   Se o artigo/estudo for conceitual, didático, regulatório ou metodológico e não citar
 *   produtos específicos cadastrados no banco de dados, `relatedProductSlugs` DEVE ser
 *   obrigatoriamente um array vazio (`[]`). É terminantemente proibido inserir produtos
 *   aleatórios apenas para preencher o bloco "Produtos Analisados Citados neste Estudo".
 */

export interface GuideSection {
  id: string;
  heading: string;
  paragraphs: string[];
  callout?: {
    type: 'norma' | 'atencao' | 'dica';
    title: string;
    text: string;
    link?: {
      url: string;
      text: string;
    };
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
  /**
   * Slugs de produtos do banco de dados EFETIVAMENTE citados, analisados ou confrontados
   * no corpo do texto deste estudo/guia.
   * REGRA MANDATÓRIA: Se nenhum produto for citado no corpo do artigo/estudo,
   * este array DEVE ser vazio ([]). É terminantemente proibido inserir produtos aleatórios
   * apenas para preencher visualmente o bloco "Produtos Analisados Citados neste Estudo".
   */
  relatedProductSlugs: string[];
  sections: GuideSection[];
  faq: Array<{ q: string; a: string }>;
  conclusion: string;
  callToAction?: {
    title: string;
    text: string;
    buttonText: string;
    buttonUrl: string;
  };
}

export const DEFAULT_GUIDE_AUTHOR = {
  name: 'Equipe de Curadoria Técnica',
  role: 'Observatório PetRankings',
} as const;

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
    author: DEFAULT_GUIDE_AUTHOR,
    coverImageUrl: '/uploads/guias/premier-vs-golden-duel-cover.webp',
    isFeatured: false,
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
          'Na Matéria Seca, a PremieR Formula entrega teores proteicos superiores (mínimo de 28,88% MS frente a 25,55% MS na GoldeN Formula). Além disso, a PremieR apresenta um teor menor de matéria mineral máxima (8,33% MS contra 9,44% MS da GoldeN, equivalentes a 7,5% e 8,5% em Matéria Natural), o que indica uso de cortes cárneos e farinhas com menor concentração de ossos e cartilagens.',
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
    author: DEFAULT_GUIDE_AUTHOR,
    coverImageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=1200&auto=format&fit=crop&q=80',
    isFeatured: false,
    summary:
      'Entenda o que são o Butil-hidroxitolueno (BHT) e o Butil-hidroxianisol (BHA), por que a indústria pet os utiliza há décadas e como identificar embalagens estabilizadas com tocoferóis naturais e extrato de alecrim.',
    relatedProductSlugs: [],
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
            ['Origem', 'Natural e Vegetal (Vitamina E, Alecrim e Chá Verde)', 'Síntese química industrial de derivados fenólicos'],
            ['Custo de Fabricação', 'Mais elevado (impacta o preço final)', 'Muito baixo e de ampla oferta'],
            ['Estabilidade Térmica', 'Moderada (exige adição em pós-extrusão)', 'Altíssima (resiste a grandes choques térmicos)'],
            ['Impacto no Score PetRankings', 'Pontuação Máxima (Pilar 3: Transparência)', 'Pontuação Básica (Sem bônus natural)'],
          ],
        },
      },
      {
        id: 'quais-marcas-migraram',
        heading: '4. O Panorama Real: Quais marcas e categorias no Brasil já eliminaram o BHT e BHA?',
        paragraphs: [
          'Respondendo diretamente à dúvida central do tutor: a transição para antioxidantes naturais no mercado brasileiro ocorre de forma estratificada por segmentos e faixas de preço.',
          'No patamar mais elevado da nutrição pet, praticamente 100% das linhas classificadas como "Super Premium Natural" e "Grain Free" (livres de grãos) já operam exclusivamente com conservação natural — principalmente concentrado de tocoferóis (fonte de Vitamina E), extrato de alecrim (Rosmarinus officinalis), extrato de chá verde e ácido cítrico. Marcas consagradas deste segmento incluem Fórmula Natural (Fresh Meat), Biofresh, Guabi Natural, N&D (Farmina) e PremieR Nattu.',
          'Entre as rações "Super Premium Convencionais", a transição já é ampla e consolidada: produtos de grande circulação como PremieR Formula, Hill\'s Science Diet e diversas opções da Royal Canin para cães e gatos já substituíram os antioxidantes sintéticos por tocoferóis e extrato de alecrim em suas composições oficiais mais recentes.',
          'Em contrapartida, nas categorias "Premium Especial" e "Econômica/Standard", a grande maioria das marcas ainda utiliza BHT e BHA como conservantes primários. O motivo é estritamente econômico e operacional: os aditivos sintéticos custam consideravelmente menos e oferecem alta resistência contra oscilações térmicas durante a logística e estocagem em centros de distribuição.',
        ],
        callout: {
          type: 'dica',
          title: 'Consulta em Tempo Real no Catálogo',
          text: 'Como as indústrias pet reformulam ingredientes e embalagens constantemente, o Observatório PetRankings monitora as fichas técnicas e a rotulagem oficial de cada lote registrado. No nosso Catálogo Geral, você pode filtrar instantaneamente todas as rações analisadas que utilizam exclusivamente antioxidantes naturais.',
          link: {
            url: '/catalogo?nat=1',
            text: 'Ver lista de rações com conservação natural no Catálogo',
          },
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
      {
        q: 'Como encontrar todas as rações para cães e gatos sem BHT nem BHA no PetRankings?',
        a: 'Basta acessar nosso Catálogo Geral e selecionar o filtro "Conservação Natural". Nossa equipe técnica confere a composição básica declarada no site oficial de cada fabricante e classifica com transparência se o alimento utiliza antioxidantes naturais (tocoferóis e alecrim) ou conservantes sintéticos.',
      },
    ],
    conclusion:
      'Em resumo: a resposta para a pergunta central deste estudo é que o uso de antioxidantes naturais já é um padrão estabelecido nas categorias Super Premium Natural e Super Premium no Brasil, enquanto os segmentos intermediários e econômicos continuam dependentes do BHT e BHA. Para consultar a lista completa e conferir a análise técnica de cada fórmula, explore as opções com conservação natural em nosso catálogo interativo.',
    callToAction: {
      title: 'Consulte Todas as Rações com Conservação 100% Natural',
      text: 'O Observatório PetRankings analisa a composição oficial de centenas de alimentos secos e úmidos. Acesse o catálogo interativo e filtre apenas produtos formulados com tocoferóis e extrato de alecrim, sem aditivos sintéticos BHT ou BHA.',
      buttonText: 'Explorar Catálogo com Filtro de Antioxidantes Naturais',
      buttonUrl: '/catalogo?nat=1',
    },
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
    author: DEFAULT_GUIDE_AUTHOR,
    coverImageUrl: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=1200&auto=format&fit=crop&q=80',
    isFeatured: false,
    summary:
      'Descubra por que um sachê úmido com apenas 8% de proteína bruta na embalagem pode ser, na verdade, muito mais proteico do que uma ração seca que declara 26% no rótulo.',
    relatedProductSlugs: [],
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
  {
    slug: 'racao-seca-vs-umida-gatos-hidratacao-saude-renal',
    title: 'Ração Seca vs Ração Úmida para Gatos: O que Dizem a WSAVA e a ABINPET sobre Hidratação e Rins?',
    subtitle: 'A fisiologia do carnívoro estrito, o mito popular sobre os sachês e as diretrizes clínicas veterinárias para proteção do trato urinário.',
    cluster: 'Saúde & Fases de Vida',
    speciesTarget: 'Gatos',
    readingTimeMinutes: 6,
    publishedAt: '2026-09-29',
    updatedAt: '2026-09-29',
    author: DEFAULT_GUIDE_AUTHOR,
    coverImageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&auto=format&fit=crop&q=80',
    isFeatured: false,
    summary:
      'Entenda por que os gatos descendem de predadores do deserto e possuem baixa sensação de sede espontânea, como os alimentos úmidos atuam na diluição urinária e prevenção de urólitos, e como diferenciar um sachê completo de um complementar segundo o MAPA.',
    relatedProductSlugs: [],
    sections: [
      {
        id: 'heranca-do-deserto-e-fisiologia-felina',
        heading: '1. A Fisiologia Felina e a Herança do Deserto',
        paragraphs: [
          'Diferente dos cães, que são onívoros facultativos e possuem mecanismos de sede altamente sensíveis à desidratação, o gato doméstico (Felis catus) descende diretamente do gato-selvagem-africano (Felis silvestris lybica), um predador perfeitamente adaptado a ambientes áridos e semiáridos.',
          'Essa herança evolutiva moldou uma fisiologia singular: os rins dos felinos desenvolveram capacidade formidável de concentrar a urina para economizar fluidos corporais vitais. Em contrapartida, o centro hipotalâmico de sede dos gatos é notoriamente pouco responsivo. Na natureza selvagem, entre 70% e 80% de toda a água necessária para a homeostase do animal provém diretamente dos tecidos biológicos e do sangue de suas presas recém-capturadas, e não da busca ativa por fontes líquidas.',
          'Quando um gato é alimentado exclusivamente com ração seca (cujo teor de umidade situa-se habitualmente entre 8% e 10%), ele passa a depender exclusivamente da tigela de água para manter sua hidratação. Contudo, múltiplos ensaios clínicos citados nas diretrizes globais da WSAVA (World Small Animal Veterinary Association) comprovam que a ingestão voluntária de água raramente compensa a ausência de umidade na ração seca. Como consequência biológica, felinos que consomem somente alimento seco produzem volumes urinários sensivelmente menores e com densidade cronicamente mais concentrada.',
        ],
        callout: {
          type: 'norma',
          title: 'Diretrizes Nutricionais da WSAVA (Global Veterinary Community)',
          text: 'A força-tarefa da WSAVA classifica a avaliação da ingestão hídrica e da densidade urinária como elemento indispensável da anamnese nutricional clínica (o "5º Sinal Vital"). Urinas mantidas sob alta densidade (acima de 1.050) aumentam exponencialmente o índice de supersaturação relativa para a precipitação de cristais de estruvita e de oxalato de cálcio no trato urinário inferior.',
        },
      },
      {
        id: 'sache-estraga-os-dentes-o-mito-popular',
        heading: '2. Ração Úmida "Estraga os Dentes"? Desmistificando o Mito Popular',
        paragraphs: [
          'Um dos maiores equívocos propagados entre tutores é a crença de que a ração úmida "amolece os dentes", "provoca tártaro" ou "danifica a cavidade oral", enquanto o alimento seco funcionaria como uma escova de dentes natural.',
          'A odontologia veterinária moderna já desmistificou expressamente essa suposição. O croquete de uma ração seca convencional (isto é, alimentos de manutenção que não possuem croquetes terapêuticos específicos com malha de fibra alinhada) esmigalha-se e estilhaça-se na ponta das cúspides dentárias logo na primeira mordida do gato, gerando mínima abrasão mecânica na linha subgengival, que é o local anatômico onde a placa bacteriana de fato coloniza e mineraliza.',
          'O acúmulo de cálculo dentário decorre primariamente de fatores genéticos individuais, microbiota bucal, pH da saliva e ausência de higiene física direcionada. A única forma com eficácia comprovada de proteger a dentição felina é a escovação diária com pasta enzimática apropriada e a profilaxia profissional quando indicada por médico veterinário. Privar um gato de consumir alimentos úmidos com base no receio de tártaro significa sacrificar a proteção renal e hídrica sem produzir nenhum benefício periodontal mensurável.',
        ],
        callout: {
          type: 'dica',
          title: 'Saúde Oral vs Hidratação Renal Preventiva',
          text: 'A escovação dentária regular é insubstituível para a saúde bucal. A escolha entre ração seca e úmida deve ser guiada pela necessidade de hidratação, controle de peso e equilíbrio bromatológico, e nunca por falsos mitos odontológicos.',
        },
      },
      {
        id: 'completo-vs-complementar-normas-mapa',
        heading: '3. Nem Todo Sachê é Igual: Alimento Completo vs Alimento Complementar (IN MAPA nº 30/2009)',
        paragraphs: [
          'Ao introduzir alimentos úmidos na dieta do gato, é indispensável que o tutor compreenda a divisão regulatória estabelecida pelo Ministério da Agricultura e Pecuária (MAPA) por meio da Instrução Normativa nº 30/2009 e da IN nº 39/2014:',
          '1. Alimento Completo para Gatos: Produto formulado com carnes nobres e balanceado com premix vitamínico-mineral integral. Cumpre todas as exigências mínimas da 11ª Edição do Manual Pet Food Brasil (ABINPET) e das diretrizes internacionais da FEDIAF 2025 para proteína bruta, taurina (aminoácido essencial compulsório com piso de 0,20% em Matéria Seca para dietas úmidas), cálcio, fósforo, zinco e vitaminas lipossolúveis. Pode ser fornecido como a única fonte de alimento do animal por toda a vida.',
          '2. Alimento Específico ou Complementar: Frequentemente comercializado em latas e sachês "gourmet" compostos exclusivamente por filés de peixe, peito de frango desfiado em caldo ou sopas (muitas vezes denominados "toppers"). Embora excelentes para hidratação e palatabilidade, esses itens não recebem premix vitamínico-mineral completo nem balanceamento estequiométrico de cálcio e fósforo. Por determinação do MAPA, devem ser oferecidos estritamente como agrado ou suplemento, não podendo ultrapassar 10% do gasto energético diário sob risco de severo desbalanço osteomineral.',
        ],
        table: {
          caption: 'Quadro Regulatório: Alimento Completo vs Alimento Complementar segundo o MAPA e ABINPET',
          headers: ['Atributo Analisado', 'Ração Úmida Completa (IN 30/2009)', 'Alimento Complementar / Petisco (IN 30/2009)'],
          rows: [
            ['Suplementação Mineral & Vitamínica', 'Premix completo (atende 100% dos pisos ABINPET / FEDIAF)', 'Ausente ou incompleto (apenas caldo e carne pura)'],
            ['Garantia de Taurina na Matéria Seca', 'Obrigatória (mínimo de 0,20% MS para felinos)', 'Sem garantia legal declarada ou apenas residual'],
            ['Pode ser a única dieta do animal?', 'Sim, supre integralmente as demandas vitais diárias', 'Não, sob risco de carências minerais e ósseas'],
            ['Classificação Legal Impressa no Rótulo', '"Alimento Completo para Gatos"', '"Alimento Específico" ou "Alimento Complementar"'],
          ],
        },
      },
      {
        id: 'estrategia-mix-feeding',
        heading: '4. A Estratégia de Alimentação Mista (Mix Feeding) Recomendada',
        paragraphs: [
          'Para unir os benefícios de ambas as apresentações, a literatura veterinária recomenda a prática do Mix Feeding (alimentação mista ou combinada), que concilia a conveniência da ração seca de alta digestibilidade com o aporte hídrico massivo do alimento úmido completo.',
          'Nesse protocolo, a ração seca Super Premium fornece energia concentrada ao longo do dia, enquanto uma ou duas refeições de ração úmida completa introduzem água biológica de absorção imediata, elevando a diurese e reduzindo a saturação dos sais minerais na bexiga. Para felinos castrados, a inclusão diária de sachê completo aumenta o volume gástrico sem densidade calórica excessiva, auxiliando no manejo preventivo contra a obesidade.',
          'Dica prática: para evitar sobrecarga calórica, certifique-se de descontar a equivalência energética do alimento úmido na porção diária da ração seca, seguindo as tabelas de orientação da embalagem ou a orientação personalizada do médico veterinário do pet.',
        ],
        callout: {
          type: 'atencao',
          title: 'Atenção Especial com Felinos Castrados',
          text: 'Após a castração, a taxa metabólica basal do gato cai cerca de 20% a 25% e o animal tende a se movimentar menos. O alimento úmido completo atua duplamente na prevenção: confere saciedade pela água e fibras na matéria seca e dilui os solutos urinários contra a Doença do Trato Urinário Inferior dos Felinos (DTUIF).',
        },
      },
    ],
    faq: [
      {
        q: 'Posso alimentar meu gato exclusivamente com sachês úmidos?',
        a: 'Sim, desde que a embalagem declare expressamente no verso a classificação legal do MAPA como "Alimento Completo para Gatos". Rações úmidas completas contêm todos os nutrientes e premix mineral exigidos pela 11ª Edição da ABINPET. Apenas atente-se à quantidade diária recomendada, pois o volume em gramas é maior devido ao teor de água.',
      },
      {
        q: 'Como conferir na embalagem se o produto é completo ou complementar?',
        a: 'Verifique a denominação de venda oficial impressa no painel traseiro do rótulo, conforme a IN MAPA nº 22/2009 e a IN nº 30/2009. Se constar "Alimento Completo para Gatos", o produto possui nutrição total balanceada. Se constar "Alimento Específico" ou "Alimento Complementar", trata-se de petisco/agrado e não deve substituir as refeições principais.',
      },
      {
        q: 'Quanta água um gato precisa ingerir por dia?',
        a: 'A necessidade hídrica média estipulada pela literatura veterinária situa-se entre 50 ml e 60 ml de água por quilo de peso corporal ao dia (somando a água contida no alimento e a água bebida na tigela). Um felino de 4 kg necessita de aproximadamente 200 ml a 240 ml diários de fluidos.',
      },
      {
        q: 'A ração úmida sobrecarrega os rins com excesso de minerais?',
        a: 'Pelo contrário. Quando o alimento é completo e atende às diretrizes da ABINPET e da FEDIAF 2025, os teores de cálcio, fósforo e magnésio operam dentro de margens de segurança biológica estritas. O alto teor aquoso do alimento dilui a urina e aumenta a frequência miccional, dificultando a precipitação e agregação de cristais.',
      },
    ],
    conclusion:
      'Garantir hidratação regular é o pilar mais decisivo para a longevidade dos felinos. A combinação equilibrada entre ração seca de alta nobreza e alimentos úmidos completos é a conduta preventiva padrão-ouro da medicina veterinária moderna para resguardar a saúde renal e urinária do seu gato por toda a vida.',
    callToAction: {
      title: 'Compare Alimentos Secos e Úmidos para Gatos no Catálogo',
      text: 'O Observatório PetRankings analisa a rotulagem oficial de centenas de produtos felinos no Brasil, separando opções completas de alimentos complementares e calculando instantaneamente os nutrientes na Matéria Seca.',
      buttonText: 'Explorar Alimentos para Gatos no Catálogo',
      buttonUrl: '/catalogo?esp=GATO',
    },
  },
  {
    slug: 'com-carne-vs-sabor-carne-rotulos-racao-mapa',
    title: '"Com Carne", "Sabor Carne" ou "Farinha de Vísceras": O que o MAPA e a Ciência Realmente Exigem nos Rótulos de Pet Food',
    subtitle: 'Desvendando a ordem decrescente de ingredientes, os claims cárneos da IN MAPA nº 22/2009 e a verdade bromatológica sobre as farinhas proteicas.',
    cluster: 'Ingredientes & Rótulos',
    speciesTarget: 'Cães e Gatos',
    readingTimeMinutes: 7,
    publishedAt: '2026-09-30',
    updatedAt: '2026-09-30',
    author: DEFAULT_GUIDE_AUTHOR,
    coverImageUrl: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=1200&auto=format&fit=crop&q=80',
    isFeatured: true,
    summary:
      'Compreenda a legislação brasileira que rege as denominações e alegações das rações para cães e gatos. Entenda por que a ordem dos ingredientes no rótulo obedece à regra de peso no misturador antes da cocção, como diferenciar o claim "Com Frango" do "Sabor Frango" segundo a IN MAPA nº 22/2009 e a IN nº 39/2014, e por que a farinha de vísceras de alta qualidade não é o vilão que muitos imaginam.',
    relatedProductSlugs: [],
    sections: [
      {
        id: 'ordem-decrescente-e-o-peso-da-agua',
        heading: '1. A Regra de Ouro: Por que os ingredientes são listados em ordem decrescente de peso?',
        paragraphs: [
          'Ao virar a embalagem de qualquer ração para cães ou gatos vendida no Brasil, a primeira seção examinada por tutores atentos é a "Composição Básica". Essa lista não é aleatória nem disposta em ordem de importância nutritiva percebida: ela obedece estritamente ao mandamento legal da Instrução Normativa MAPA nº 22/2009.',
          'Conforme o regulamento oficial do Ministério da Agricultura e Pecuária (MAPA) e os princípios basilares de transparência do Código de Defesa do Consumidor (Lei nº 8.078/1990, Art. 6º, III), todas as matérias-primas devem ser discriminadas em ordem estritamente decrescente de peso ou massa no momento exato em que são pesadas e dosadas no misturador da fábrica, antes de passarem pela extrusão e pelo forno de secagem.',
          'É exatamente aqui que reside o fenômeno bromatológico mais desconhecido pelo consumidor: a distorção física provocada pela água. Quando uma indústria adiciona "carne fresca de frango" ou "peito de frango desossado in natura", esse ingrediente entra na masseira contendo entre 70% e 75% de água biológica pura. Esse peso aquoso maciço projeta a carne fresca para o primeiro lugar da lista de ingredientes no rótulo. Contudo, durante o processamento térmico na extrusora e no secador, quase toda a água evapora para que o croquete alcance os 8% a 10% de umidade final.',
          'Em contrapartida, ingredientes pré-desidratados — como a farinha de vísceras de aves ou a farinha de carne bovina — entram na fábrica já secos (com cerca de 8% de umidade). Portanto, 100 gramas de farinha de vísceras nobres entregam até 3 vezes mais proteína concentrada para o animal do que 100 gramas de carne fresca crua e hidratada.',
        ],
        callout: {
          type: 'norma',
          title: 'Base Legal Obrigatória: IN MAPA nº 22/2009 e CDC',
          text: 'O Art. 12 do Regulamento de Rotulagem do MAPA exige rigor absoluto na ordem decrescente de pesagem inicial. Alterar a ordem das matérias-primas para destacar artificialmente carnes nobres sem o devido suporte gravimétrico de fábrica configura infração administrativa perante o Decreto Federal nº 12.031/2024 e publicidade enganosa nos termos do Art. 37 do CDC.',
        },
      },
      {
        id: 'com-carne-vs-sabor-carne-e-imagem-ilustrativa',
        heading: '2. "Com Frango" vs "Sabor Frango": O que determina a IN MAPA nº 22/2009 e a IN nº 39/2014',
        paragraphs: [
          'Você já notou que alguns pacotes exibem com destaque "Ração com Frango e Arroz", enquanto outros trazem grafado "Ração Sabor Frango e Arroz"? Essa sutileza gramatical não é mero capricho publicitário: ela é delimitada por fronteiras regulatórias intransponíveis.',
          '1. O Claim "Com [Espécie Animal / Carne]" (ex.: "Com Frango", "Com Carne Bovina", "Com Cordeiro"): Esta designação de venda só é autorizada quando a empresa compuser a formulação com a matéria-prima cárnea real daquela espécie animal em proporção mínima pré-estabelecida (conforme os marcos de rotulagem do MAPA e as normas balizadas pela ABINPET). Se um rótulo afirma "Com Salmão", o salmão deve obrigatoriamente integrar os ingredientes em quantidade tangível e verificável no livro de formulação.',
          '2. O Claim "Sabor [Espécie Animal]" (ex.: "Sabor Carne", "Sabor Frango"): Esta denominação é reservada para produtos nos quais a sensação organoléptica (cheiro e gosto) é conferida primariamente por aromatizantes sintéticos, extratos ou hidrolisados enzimáticos de fígado e vísceras (palatabilizantes líquidos aplicados externamente no recobrimento do croquete). Nesses alimentos, a carne mencionada no sabor não precisa compor a massa principal da receita.',
          '3. A Exigência de "Imagem Meramente Ilustrativa": Por anos, o mercado estampava suculentas fotos de picanhas grelhadas e postas de salmão fresco em embalagens formuladas apenas com subprodutos e aromatizantes. Em resposta a essa distorção e com base no Código de Defesa do Consumidor, o MAPA editou a Instrução Normativa nº 39/2014 (alterando o Art. 10 da IN 22/2009), tornando compulsória a inscrição "Imagem Meramente Ilustrativa" em destaque visual no painel frontal de qualquer produto que utilize aromas ou subprodutos cárneos processados.',
        ],
        table: {
          caption: 'Classificação Regulatória de Alegações Cárneas segundo o MAPA e ABINPET',
          headers: ['Expressão no Painel Principal', 'Exigência Regulatória Oficial', 'Presença Física de Tecido Cárneo', 'Aplicação de "Imagem Ilustrativa"'],
          rows: [
            ['"Com [Frango/Carne/Salmão]"', 'Exige inclusão real e comprovada da matéria-prima cárnea declarada', 'Sim, tecido cárneo ou farinha específica presente', 'Obrigatória se utilizar farinhas ou subprodutos'],
            ['"Sabor [Frango/Carne/Salmão]"', 'Gosto/aroma conferido por aromatizantes e hidrolisados de fígado', 'Não obrigatória na massa (sabor advém de aditivos sensoriais)', 'Compulsória perante a IN MAPA nº 39/2014'],
            ['"Carne Mecanicamente Separada (CMS)"', 'Matéria-prima cárnea fresca desossada sob alta pressão mecânica', 'Sim, músculo e tecidos cárneos frescos com alto teor de umidade', 'Não substitui a identificação da espécie animal'],
            ['"100% Carnes Frescas Desossadas"', 'Restrito a formulações sem farinhas de vísceras tradicionais', 'Sim, cortes desossados adicionados in natura antes da cocção', 'Deve refletir a composição real registrada no SipeAgro'],
          ],
        },
      },
      {
        id: 'farinha-de-visceras-vilan-ou-fonte-nobre',
        heading: '3. Farinha de Vísceras de Aves: Vilã ou Fonte Hiperconcentrada de Proteína?',
        paragraphs: [
          'Nenhum ingrediente de pet food é alvo de tanto preconceito infundado quanto a "Farinha de Vísceras de Aves" (FVA). Tutores desinformados costumam associar a palavra vísceras a "lixo de abatedouro", imaginando pés, bicos e penas triturados. Sob a ótica da zootecnia e da bromatologia, a verdade é diametralmente oposta.',
          'O que a lei define como Farinha de Vísceras de Aves: Segundo a Instrução Normativa MAPA nº 110/2020 e os padrões do Sindicato Nacional da Indústria de Alimentação Animal (SINDIRAÇÕES), a FVA é obtida exclusivamente pela cocção industrial, desengorduramento mecânico por prensagem contínua e moagem de partes nobres não consumidas pelo mercado humano tradicional, incluindo coração, fígado, moela, pulmões e carcaça cárnea de frangos inspecionados pelo Serviço de Inspeção Federal (SIF). A adição deliberada de esterco, penas, bicos, sangue coagulado ou cascas de ovos é rigorosamente proibida pela legislação sanitária.',
          'A superioridade biológica na concentração proteica: Enquanto a carne fresca in natura possui cerca de 70% a 75% de água e apenas 18% a 20% de proteína bruta, a farinha de vísceras nobre é previamente desidratada, alcançando impressionantes 60% a 70% de Proteína Bruta de altíssimo valor biológico e digestibilidade superior a 85% para cães e gatos, concentrando todos os aminoácidos essenciais (lisina, metionina e taurina).',
          'O verdadeiro divisor de águas: A Matéria Mineral (Cinzas). O ponto que diferencia uma farinha de vísceras de primeira linha utilizada em rações Super Premium de uma farinha comum empregada em rações standard é a proporção de ossos moídos. Farinhas com excesso de carcaça e osso elevam o teto de Matéria Mineral (acima de 9,5% a 11% na Matéria Seca), o que sobrecarrega os rins e pode desequilibrar a relação Cálcio:Fósforo. As rações de ponta utilizam farinhas com especificação Low Ash (baixo teor de cinzas), compostas prioritariamente por tecidos musculares e vísceras nobres com menos ossos.',
        ],
        callout: {
          type: 'atencao',
          title: 'Proteção Regulatória Contra Fraudes em Matérias-Primas',
          text: 'Ingredientes como farinha de penas hidrolisadas, farinha de sangue e farinha de subprodutos possuem registros e definições legais próprias perante o MAPA. Uma fábrica é terminantemente impedida pelo Decreto nº 12.031/2024 de rotular penas ou resíduos industriais sob a denominação de "Farinha de Vísceras de Aves".',
        },
      },
      {
        id: 'roteiro-pratico-inspecao-rotulo',
        heading: '4. Guia Prático: Como inspecionar os primeiros ingredientes de uma ração como um especialista',
        paragraphs: [
          'Para não cair em armadilhas visuais de marketing, o Observatório PetRankings recomenda um protocolo objetivo de inspeção da rotulagem em quatro etapas analíticas:',
          'Passo 1: Inspecione os 3 primeiros ingredientes da lista. Para alimentos secos de manutenção de cães e carnívoros estritos como gatos, a primeira posição (1º ingrediente) deve ser ocupada por uma fonte protéica animal nobre bem discriminada (ex.: Farinha de vísceras de aves, Carne bovina, Salmão fresco). Se o primeiro ingrediente for milho integral moído, farelo de trigo ou quirera de arroz, o alimento é estruturado primordialmente à base de carboidratos vegetais.',
          'Passo 2: Verifique a especificidade das fontes lipídicas. Procure por gorduras e óleos com nome e sobrenome (ex.: Gordura de frango, Óleo de aves refinado, Óleo de peixe marinho - rica fonte de EPA e DHA). Evite alimentos que declarem expressões genéricas como "gordura animal" ou "óleo vegetal misto", que ocultam lotes com perfil graxo volátil e procedência incerta.',
          'Passo 3: Fique atento ao fracionamento de ingredientes (Ingredient Splitting). Trata-se de um artifício zootécnico no qual a fábrica divide um mesmo vegetal em várias matérias-primas distintas no rótulo (ex.: milho moído, farelo de glúten de milho 60 e gérmen de milho desengordurado). Separados na balança, cada um pesa menos que a carne, permitindo que a proteína animal conste em 1º lugar na lista — ainda que, somados, os derivados do milho constituam a ampla maioria da receita.',
          'Passo 4: Verifique os conservantes no rodapé da composição. Ao final do texto, confira os "Aditivos Tecnológicos": se encontrar BHT (INS 321) e BHA (INS 320), a estabilização lipídica é química sintética; se constar concentrado de tocoferóis, extrato de alecrim (Rosmarinus officinalis) e ácido cítrico, a ração adota conservação 100% natural balizada pela IN MAPA nº 110/2020.',
        ],
        callout: {
          type: 'dica',
          title: 'O Motor do PetRankings Executa Essa Análise Automaticamente',
          text: 'Em cada uma das centenas de rações avaliadas em nosso portal, nosso algoritmo determinístico inspeciona e pontua a nobreza dos ingredientes declarados, penalizando fontes vagas e premiando proteínas animais nobres no topo da formulação.',
          link: {
            url: '/catalogo',
            text: 'Explorar análises técnicas no Catálogo de Produtos',
          },
        },
      },
    ],
    faq: [
      {
        q: 'A ração com carne fresca desossada é sempre superior à ração com farinha de vísceras?',
        a: 'Não necessariamente. A carne fresca desossada eleva a palatabilidade natural e fornece excelente digestibilidade de aminoácidos, mas por conter mais de 70% de água no momento da pesagem, entrega proporcionalmente menos proteína concentrada por quilo do que uma farinha de vísceras desidratada de padrão "Low Ash" (baixo teor de cinzas). As formulações mais sofisticadas do mercado costumam combinar ambos os ingredientes.',
      },
      {
        q: 'Como ter certeza de que uma ração "Sabor Frango" contém frango de verdade?',
        a: 'Se a embalagem declarar apenas "Sabor Frango" e a face frontal contiver o aviso "Imagem Meramente Ilustrativa", a Instrução Normativa MAPA nº 22/2009 e a IN nº 39/2014 não exigem que o frango seja a base cárnea primária. O perfil de sabor pode ser fornecido por hidrolisados de vísceras e palatabilizantes enzimáticos. Para ter certeza da presença real da carne, consulte sempre a lista da "Composição Básica" no verso da embalagem.',
      },
      {
        q: 'O que é a "Carne Mecanicamente Separada" (CMS) que aparece frequentemente em sachês e patês?',
        a: 'A Carne Mecanicamente Separada (CMS) é uma massa cárnea fresca obtida pela remoção mecânica sob pressão de tecidos musculares aderidos às carcaças de aves ou bovinos após a desossa dos cortes principais. É uma matéria-prima largamente utilizada também na alimentação humana (como em embutidos de alta qualidade), fornecendo excelente aporte proteico, umidade biológica natural e alta digestibilidade para cães e gatos.',
      },
      {
        q: 'Por que o aviso "Imagem Meramente Ilustrativa" se tornou obrigatório em tantas embalagens?',
        a: 'A obrigação foi estabelecida pelo MAPA por meio da Instrução Normativa nº 39/2014, harmonizada com o Código de Defesa do Consumidor (CDC). O objetivo legal é impedir que tutores sejam induzidos a acreditar que a ração contém postas inteiras de carne grelhada ou legumes frescos idênticos às fotos da embalagem, quando o produto utiliza aromatizantes ou matérias-primas processadas.',
      },
    ],
    conclusion:
      'A leitura criteriosa da Composição Básica é a defesa mais eficaz do tutor contra o apelo visual do marketing pet. Compreender a mecânica do peso dos ingredientes antes do cozimento, a distinção entre claims de sabor e a nobreza biológica das matérias-primas permite selecionar alimentos com base em evidências científicas e na legislação oficial do MAPA, garantindo a nutrição ideal e a longevidade do seu cão ou gato.',
    callToAction: {
      title: 'Consulte a Composição Básica Analisada no Catálogo PetRankings',
      text: 'O Observatório PetRankings analisa a lista oficial de ingredientes, os níveis de garantia na Matéria Seca (MS) e os sistemas de conservação de centenas de alimentos secos e úmidos registrados no Brasil.',
      buttonText: 'Explorar Catálogo de Produtos Analisados',
      buttonUrl: '/catalogo',
    },
  },
];

export function getAllGuides(): GuideItem[] {
  return [...GUIDES].sort((a, b) => {
    const timeB = new Date(b.publishedAt + 'T12:00:00Z').getTime();
    const timeA = new Date(a.publishedAt + 'T12:00:00Z').getTime();
    if (timeB !== timeA) return timeB - timeA;
    return new Date(b.updatedAt + 'T12:00:00Z').getTime() - new Date(a.updatedAt + 'T12:00:00Z').getTime();
  });
}

export function getFeaturedGuide(): GuideItem {
  const sorted = getAllGuides();
  return sorted.find((g) => g.isFeatured) || sorted[0];
}

export function getGuideBySlug(slug: string): GuideItem | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getRelatedGuides(currentSlug: string, limit = 2): GuideItem[] {
  return getAllGuides().filter((g) => g.slug !== currentSlug).slice(0, limit);
}
