# 📚 Biblioteca Regulatória e Marco Normativo Oficial — PetRankings

> **Repositório Central de Documentação Técnica, Diretrizes Oficiais do MAPA, Manuais de Nutrição e Legislação Vigente.**  
> Esta pasta é a **Fonte Primária de Verdade (Ground Truth)** para todas as decisões de engenharia, classificação legal, algoritmos de pontuação, curadoria técnica de fichas e análises documentais do **PetRankings**.

---

## 🏛️ 1. Legislação Federal e Atos Normativos do MAPA

### 1.1. Decreto Federal nº 12.031/2024 (Presidência da República / MAPA)
* **Status:** Vigente (Publicado em maio de 2024).
* **Tema:** Regulamenta a inspeção industrial e sanitária de produtos destinados à alimentação animal no Brasil.
* **Aplicação no PetRankings:**
  * Define os padrões de registro de estabelecimentos produtores, fabricantes e importadores.
  * Estabelece as responsabilidades legais dos fabricantes quanto à veracidade, rastreabilidade e integridade das informações prestadas nos rótulos e fichas técnicas oficiais.
  * Base jurídica para a exigência de dados probatórios públicos e combate à simulação de fórmulas.

### 1.2. Instrução Normativa MAPA nº 30/2009
* **Tema:** Regulamento Técnico sobre Padrões de Identidade, Qualidade e Classificação de Alimentos para Cães e Gatos.
* **Aplicação no PetRankings (Tríade de Classificação Legal):**
  1. **Alimento Completo:** Alimento capaz de suprir integralmente todas as exigências nutricionais diárias do animal, podendo ser utilizado de forma exclusiva como única fonte de alimento. Deve conter premix mineral/vitamínico balanceado e atender às tabelas do Manual ABINPET / NRC.
  2. **Alimento Específico / Complementar:** Alimentos destinados a agrado, recompensa, enriquecimento sensorial ou hidratação suplementar (ex.: *Cookies, Biscoitos, Snacks, Bites, Petiscos, Molhos e Sachês de Filés sem suplementação completa*). Propositalmente **não possuem premix mineral completo** e **não devem substituir a dieta principal**, recebendo tratamento diferenciado (sem pontuação penalizadora de ranking comparativo).
  3. **Alimento Coadjuvante (Dieta Clínica / Terapêutica):** Alimentos formulados para atender a condições fisiológicas ou metabólicas específicas sob recomendação de médico veterinário (ex.: *Renal, Urinário, Obesidade, Hepático, Gastrointestinal*). Não concorrem em ranking geral de rações comerciais.

### 1.3. Instrução Normativa MAPA nº 22/2009 e Legislação Correlata de Rotulagem
* **Tema:** Normas de Rotulagem de Produtos para Alimentação Animal.
* **Aplicação no PetRankings:**
  * **Ordem Decrescente de Ingredientes:** Os ingredientes devem obrigatoriamente ser listados na ordem decrescente de proporção na fórmula (do de maior quantidade para o de menor quantidade).
  * **Declaração de Níveis de Garantia:** Exigência de declaração expressa de limites mínimos (Proteína Bruta, Extrato Etéreo) e máximos (Umidade, Matéria Fibrosa, Matéria Mineral, Cálcio, Fósforo, Sódio).
  * **Regras de Claims Cárneos ("Com Carne" vs "Sabor Carne"):** O uso da expressão "Com Carne [Espécie]" exige inclusão comprovada de tecido animal da referida espécie, enquanto "Sabor" decorre de aromatizantes/palatabilizantes.

### 1.4. Decreto Federal nº 4.680/2003 e Lei nº 11.105/2005 (Lei de Biossegurança)
* **Tema:** Rotulagem compulsória de alimentos e ingredientes que contenham ou sejam produzidos a partir de Organismos Geneticamente Modificados (OGMs).
* **Aplicação no PetRankings:**
  * Identificação obrigatória do triângulo amarelo com o símbolo **(T)** e menção aos doadores dos genes (ex.: *Milho transgênico, Soja transgênica*).
  * Auditoria do PetRankings: Alimentos livres de transgênicos recebem pontuação máxima no pilar de transparência e formulação natural.

---

## 📖 2. Manuais Técnicos de Nutrição e Bromatologia

### 2.1. Manual Pet Food Brasil — ABINPET (11ª Edição)
* **Arquivo arquivado nesta pasta:** [`Manual Pet Food Brasil - Abinpet.pdf`](file:///d:/Projetos/PetRankings/biblioteca_regulatoria/Manual%20Pet%20Food%20Brasil%20-%20Abinpet.pdf) *(14.9 MB)*
* **Órgão emissor:** ABINPET (Associação Brasileira da Indústria de Produtos para Animais de Estimação) e ABEMPET.
* **Aplicação no PetRankings:**
  * **Base Seca (Matéria Seca - MS):** Conversão compulsória de todas as porcentagens para neutralizar a diluição pela água (`Nutriente_MS = Nutriente_Original / ((100 - UmidadeMax) / 100)`).
  * **Tabelas de Referência Nutricional:** Exigências mínimas e máximas para Cães e Gatos em Manutenção (Adultos) e Crescimento (Filhotes).
  * **Balanço Cálcio:Fósforo:** Relação estequiométrica ideal entre 1,0:1 e 2,0:1 para cães e gatos em fases de manutenção e crescimento.
  * **Estimativa de Energia Metabolizável (EM):** Equações preditivas oficiais consolidadas do NRC (National Research Council) integradas ao DRS 8.0.

### 2.2. Diretrizes Internacionais Harmonizadas
* **FEDIAF (European Pet Food Industry Federation):** Diretrizes nutricionais europeias de boas práticas de fabricação e rotulagem.
* **AAFCO (Association of American Feed Control Officials):** Padrões de perfis de nutrientes por fase de vida animal.
* **NRC (National Research Council):** *Nutrient Requirements of Dogs and Cats* — base científica de digestibilidade e predição calórica.

---

## ⚖️ 3. Transparência, Defesa do Consumidor e Custódia Probatória

### 3.1. Código de Defesa do Consumidor (Lei Federal nº 8.078/1990)
* **Art. 6º, Inciso III:** Direito básico do consumidor à informação adequada e clara sobre os diferentes produtos e serviços, com especificação correta de quantidade, características, composição, qualidade e preço.
* **Arts. 30 e 31:** Toda informação ou publicidade, suficientemente precisa, veiculada por qualquer forma ou meio de comunicação com relação a produtos e serviços oferecidos ou apresentados, obriga o fornecedor que a fizer veicular ou dela se utilizar e integra o contrato que vier a ser celebrado.
* **Aplicação no PetRankings:**
  * O PetRankings exerce atividade estritamente consultiva, educativa e de transparência documental pública.
  * Cada nota, índice ou parecer baseia-se unicamente nas declarações fornecidas pelos próprios fabricantes em seus canais oficiais e fichas técnicas públicas registradas no MAPA.
  * O sistema armazena a custódia do PDF da ficha técnica (`public/uploads/ficha_[id].pdf`) e a imagem original do packshot com hash de integridade SHA-256.

---

## 🛠️ 4. Mapeamento Arquitetural no Código-Fonte

| Norma / Documento Oficial | Arquivo de Implementação no Código | Função / Regra de Negócio |
| :--- | :--- | :--- |
| **Manual ABINPET 11ª Ed.** | [`src/lib/audit-engine/abinpet-standards.ts`](file:///d:/Projetos/PetRankings/src/lib/audit-engine/abinpet-standards.ts) | Tabelas oficiais de mínimos e máximos por espécie e fase da vida. |
| **Bromatologia e Energia (NRC)** | [`src/lib/audit-engine/bromatology.ts`](file:///d:/Projetos/PetRankings/src/lib/audit-engine/bromatology.ts) | Conversão para Base Seca (MS) e cálculo de EM (kcal/kg). |
| **Algoritmo de Conformidade** | [`src/lib/audit-engine/calculator.ts`](file:///d:/Projetos/PetRankings/src/lib/audit-engine/calculator.ts) | 5 pilares do laudo técnico (0 a 100 pontos e faixas de qualidade). |
| **IN 30/2009 (Categorias Legais)** | [`src/lib/formatters.ts`](file:///d:/Projetos/PetRankings/src/lib/formatters.ts) | Mapeamento legal: Completo, Coadjuvante e Complementar. |
| **Decreto 12.031 e Pipeline** | [`scripts/cadastrar-produtos.ts`](file:///d:/Projetos/PetRankings/scripts/cadastrar-produtos.ts) | Extração estrita de dados do PDF oficial, custódia e validação. |
| **Isenção de Juízo Subjetivo** | [`src/app/sobre/page.tsx`](file:///d:/Projetos/PetRankings/src/app/sobre/page.tsx) e [`Footer.tsx`](file:///d:/Projetos/PetRankings/src/components/Footer.tsx) | Aviso legal institucional, Arts. 30 e 31 do CDC. |

---

## 📂 5. Estrutura desta Pasta

```
biblioteca_regulatoria/
├── README.md                                  # Este catálogo e guia mestre normativo
└── Manual Pet Food Brasil - Abinpet.pdf      # Manual oficial da 11ª Edição da ABINPET (15 MB)
```

> **Para novos documentos:** Ao adicionar decretos, portarias, instruções normativas ou manuais nesta pasta, registre o arquivo neste `README.md` com a data de publicação, órgão emissor e o resumo de sua relevância para o PetRankings.
