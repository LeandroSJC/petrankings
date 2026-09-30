---
name: pet-editorial-copywriter
description: >-
  Specialized copywriting, category taxonomy, and editorial tone-of-voice guidelines for pet products
  (dog & cat food, grain-free/super premium nutrition, cat litter, interactive toys, grooming, accessories).
  Use this skill when drafting ranking titles, category descriptions, product highlights, pros/cons,
  or ensuring compliance with non-veterinary editorial disclaimers.
---

# Pet Editorial & Content Specialist

This skill provides editorial standards, category taxonomy, and tone-of-voice rules for drafting impartial, informative, and engaging reviews and ranking descriptions for PetRankings.

## 1. Editorial Tone of Voice

- **Impartial & Transparent**: Objective, data-driven, highlighting real user feedback and factual specifications.
- **Empathetic & Responsible**: Respectful of pet well-being, always reinforcing that rankings are market comparisons and not veterinary prescriptions.
- **Clear & Accessible**: Jargon-free explanations of complex nutritional terms (e.g. explain *proteína bruta*, *farinha de vísceras*, *conservantes naturais* clearly).

## 2. Category Taxonomy & Key Attributes

### A. Nutrição Canina (Cães)
- **Ração Seca**: Diferenciar claramente por porte (*Filhotes*, *Adultos Mini/Médio/Grande*, *Idosos/Sênior*) e segmento (*Premium Especial*, *Super Premium*, *Natural/Grain-Free*).
- **Petiscos & Snacks**: Destacar benefícios funcionais (saúde bucal/tártaro, adestramento, digestão, articulações).
- **Ração Úmida / Sachê**: Destacar palatabilidade, conteúdo de umidade, uso como complemento ou substituição.

### B. Nutrição & Higiene Felina (Gatos)
- **Ração para Gatos Castrados**: Destacar controle calórico, fibras para bolas de pelo e equilíbrio mineral para saúde do trato urinário (pH).
- **Ração para Gatos de Pelo Longo**: Destacar ácidos graxos Ômega 3/6 e biotina para saúde do manto.
- **Areias Sanitárias**: Categorizar por tipo (*Microgrânulos de Bentonita*, *Areia Biodegradável de Milho/Mandioca*, *Sílica Gel*, *Granulado de Madeira*). Destacar formação de torrão, rendimento e controle de odores.

### C. Brinquedos & Enriquecimento Ambiental
- **Brinquedos Interativos (Cães)**: Diferenciar por tipo de interação — *perseguição* (petecas, bolas de fetch), *mastigação* (mordedores de borracha, ossos nylon), *inteligência* (puzzles, dispensadores de petisco).
- **Brinquedos para Gatos**: Destacar *estímulo ao instinto caçador* (varinhas com pena, laserpointer), *enriquecimento vertical* (arranhadores, árvores de gato), *autonomia* (brinquedos que se movem sozinhos).
- **Segurança**: Sempre destacar materiais atóxicos, resistência ao desgaste, ausência de peças pequenas destacáveis.

### D. Higiene & Grooming
- **Shampoos & Condicionadores**: Diferenciar por tipo de pelo (curto, longo, oleoso, sensível), fórmulas hipoalergênicas e pH balanceado para pele de pets.
- **Escovas & Pentes**: Categorizar por porte e tipo de pelo. Destacar ergonomia e frequência de manutenção recomendada.
- **Produtos Dentais**: Destacar alternativas ao escovamento (petiscos dentais, géis, água com antisséptico).

### E. Acessórios & Conforto
- **Coleiras, Guias & Peitoral**: Destacar material (nylon, couro, neoprene), regulagem, segurança em fugas.
- **Camas & Casinhas**: Destacar densidade do preenchimento, facilidade de lavagem e isolamento térmico.
- **Transportadoras**: Classificar por tipo (*rígida*, *soft bag*, *mochila*) e compatibilidade com tamanho do animal.

## 3. Mandatory Legal & Medical Disclaimers

When authoring ranking intros or product overviews:
> O PetRankings é um serviço editorial independente de comparação de satisfação de mercado. Não substitui consultas, diagnósticos ou prescrições veterinárias. Consulte sempre o médico veterinário do seu pet antes de realizar alterações na dieta ou manejo sanitário.

## 4. Editorial Title Formulas

Good title patterns:
- `"Melhores [Tipo de Produto] para [Espécie] [Perfil Opcional]"`
- `"[Número] Melhores [Tipo] para [Espécie]: Comparativo [Ano]"`

Examples:
- ✅ "Melhores Rações Secas para Gatos Castrados"
- ✅ "Melhores Brinquedos Interativos para Cães de Porte Médio"
- ✅ "Melhores Areias para Gatos: Bentonita vs Sílica vs Biodegradável"
- ❌ "Melhores Produtos para Cães" (genérico demais)

## 5. Editorial Content Checklist

- [ ] Clear, catchy title including target species and category.
- [ ] Concise introductory summary (1-2 paragraphs) stating the evaluation criteria.
- [ ] Objective product descriptions emphasizing key ingredients, packaging sizes, and target audience.
- [ ] Safety and material information for toy and grooming categories.
- [ ] Responsible veterinary disclaimer prominently featured.
- [ ] No fictional reviews, simulated ratings, or invented product endorsements.
- [ ] Fidelidade estrita em `relatedProductSlugs`: apenas produtos expressamente citados no texto do estudo estão listados (ou array vazio `[]` caso seja artigo conceitual/didático sem menção a produtos).

## 6. Diretrizes para Artigos, Estudos e Guias Técnicos (/guias)

- **Fidelidade Estrita de Citações (`relatedProductSlugs`)**:
  - Apenas produtos **efetivamente citados, analisados ou confrontados** no corpo do texto do estudo/guia podem constar na lista `relatedProductSlugs` e, consequentemente, na seção *"Produtos Analisados Citados neste Estudo"*.
  - **Proibição Absoluta de Produtos Aleatórios**: É terminantemente proibido incluir produtos no array para fins estéticos, preenchimento de layout ou vitrine decorativa.
  - **Artigos Metodológicos e Educacionais**: Se o artigo for puramente conceitual, didático ou regulatório (ex.: explicação matemática da conversão para Matéria Seca, histórico de aditivos sem duelo específico de marcas), o campo `relatedProductSlugs` deve ser compulsoriamente um array vazio (`[]`), garantindo que o bloco não seja renderizado na página.
- **Assinatura Editorial Padronizada**:
  - Todos os artigos, estudos e guias devem ser assinados institucionalmente como **"Equipe de Curadoria Técnica"** (com papel *"Observatório PetRankings"*).
  - É expressamente proibido inventar personas individuais fictícias, títulos caricatos ou pseudônimos acadêmicos/médicos (ex.: "Dr. Zootecnia"). Toda produção técnica expressa o trabalho coletivo de dados do portal.
- **Rigor Probatório e Proibição Absoluta de Invenção de Dados**:
  - Toda alegação técnica, nível nutricional, porcentagem em Matéria Seca (MS) ou afirmação sobre ingredientes deve estar 100% ancorada em fontes oficiais e confiáveis:
    1. **Rotulagem Oficial do Fabricante:** Ficha técnica ativa no banco de dados coletada diretamente do site oficial do fabricante (HTML com hash SHA-256). Nunca inventar nem deduzir teores nutricionais.
    2. **Marco Regulatório Oficial:** Leis, Decretos federais e Instruções Normativas vigentes do MAPA (IN 22/2009, IN 30/2009, IN 110/2020, Decreto 12.031/2024, CDC) arquivados em `biblioteca_regulatoria/`. É estritamente vedado inventar ou citar números de normas fictícias.
    3. **Literatura Bromatológica de Referência:** Padrões mínimos e tetos da 11ª Edição do Manual Pet Food Brasil (ABINPET), FEDIAF e NRC arquivados em `biblioteca_regulatoria/`.
  - **Incerteza Probatória:** Se uma informação não constar expressamente na documentação oficial ou na literatura científica, ela jamais deve ser estimada ou deduzida; declare abertamente que a informação não foi informada pelo fabricante ou omita a afirmação.
