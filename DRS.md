# Documento de Requisitos de Software (DRS) & Especificação de Regras de Negócio

## Sistema de Análise Nutricional e Índice de Conformidade de Rótulos de Pet Food

- **Versão:** 9.0 (Transição para Custódia Digital Exclusiva: Informações do Website Oficial do Fabricante & Protocolo Wayback Machine)
- **Status:** Aprovado para Arquitetura, Modelagem de Banco, Algoritmo de Análise, Segurança e Interface
- **Ambiente Regulatório:** Brasil (Manual Pet Food Brasil - ABINPET 11ª Edição, Instruções Normativas do MAPA nº 30/2009, 110/2020, 87/2021, Decreto nº 12.031/2024, Decreto nº 4.680/2003, Lei nº 11.105/2005 e Código de Defesa do Consumidor - Lei nº 8.078/1990)

---

## 1. Diretrizes Mandatórias de Redação e Sanitização de Interface (UI/UX)

> ⚠️ **REGRA MANDATÓRIA 1 — PROIBIÇÃO DE CITAÇÃO A ESTE DOCUMENTO DE REQUISITOS**  
> É expressamente vedado em qualquer parte textual visível do site (pública ou administrativa) fazer menção direta ou indireta a "este documento", "DRS", "este PRD", "nossas regras internas" ou qualquer expressão análoga.  
> - **NUNCA USAR:** "Este produto atende a este documento", "Conforme os requisitos deste documento", "Aprovado segundo nossas regras internas", "Em cumprimento ao DRS".  
> - **SEMPRE USAR:** "Atende aos parâmetros científicos de nutrição recomendados pela ABINPET", "Em conformidade com os padrões oficiais estabelecidos pelo Ministério da Agricultura e Pecuária (MAPA)", "Atende às diretrizes nutricionais da literatura veterinária nacional (ABINPET/MAPA)".

> ⚠️ **REGRA MANDATÓRIA 2 — SANITIZAÇÃO TOTAL DE INTERFACE (ZERO UNDERLINES E JARGÕES NO FRONT-END)**  
> Nenhum texto visível para o visitante na interface gráfica pode exibir variáveis de código, identificadores em `SNAKE_CASE` ou o caractere de sublinhado (`_`). Qualquer ocorrência de `_` visível no front-end em ambiente de produção é classificada formalmente como **defeito visual grave (bug de UI)**. Todos os enums, chaves e atributos devem passar obrigatoriamente pela camada de formatação limpa (`formatters.ts`) antes de serem renderizados no DOM.

> ⚠️ **REGRA MANDATÓRIA 3 — PROIBIÇÃO DO TERMO "AUDITORIA" (NÃO CONFUNDIR COM FISCALIZAÇÃO OFICIAL)**  
> É estritamente proibido o uso do termo "Auditoria" ou de qualquer de seus derivados gramaticais ("auditar", "auditado", "auditável", "extrato auditável", "sistema de auditoria") em qualquer elemento visível de interface pública, institucional ou administrativa do portal.  
> **Motivação Jurídica e Editorial:** O termo "Auditoria" conota fiscalização de Estado, poder de polícia sanitária ou inspeção oficial do Ministério da Agricultura e Pecuária (MAPA). O portal PetRankings é um repositório independente de jornalismo de dados, confronto documental e análise técnica comparativa baseada nas declarações públicas oficiais dos fabricantes em seus canais digitais e nos parâmetros científicos da literatura (ABINPET/MAPA).  
> - **NUNCA USAR:** "Auditoria Técnica", "Auditoria de Rótulo", "Produto Auditado", "Extrato Auditável", "Cadastrar/Auditar Produto", "Auditar Novo Produto".  
> - **SEMPRE USAR:** "Avaliação Técnica", "Análise de Rótulo", "Confronto Documental", "Laudo Técnico de Conformidade", "Verificação Nutricional", "Produtos Analisados", "Fichas Avaliadas", "Cadastrar / Analisar Produto", "Analisar Novo Produto".

### Tabela Obrigatória de Mapeamento (Parser Back-End ➔ Front-End)

| Valor Interno (Back-End / Banco de Dados) | Exibição Obrigatória no Front-End |
| :--- | :--- |
| `NIVEL_OURO` | **Nível Ouro** |
| `NIVEL_PRATA` | **Nível Prata** |
| `NIVEL_BRONZE` | **Nível Bronze** |
| `SOB_OBSERVACAO` | **Sob Observação** |
| `SUPER_PREMIUM` | **Nível Ouro (Padrão Superior)** |
| `PREMIUM_ESPECIAL` | **Nível Prata (Padrão Ótimo)** |
| `ECONOMICO` | **Nível Bronze (Padrão Regular)** |
| `PARAMETRO_LIMITROFE` | **Sob Observação** |
| `NAO_CONFORME` | **Sob Observação** |
| `MEDIO_GRANDE` | **Porte Médio e Grande** |
| `PEQUENO_MINI` | **Porte Pequeno e Mini** |
| `MINI_PEQUENO` | **Porte Pequeno e Mini** |
| `TODOS` | **Todos os Portes** |
| `CRESCIMENTO_INICIAL` | **Filhote (Fase Inicial)** |
| `CRESCIMENTO_FINAL` | **Filhote (Fase Final)** |
| `ADULTO_MANUTENCAO` | **Adulto** |
| `ADULTO` | **Adulto** |
| `SENIOR` | **Sênior (Idoso)** |
| `COM_CARNE` | **Com Carne** |
| `SABOR_CARNE` | **Sabor Carne** |
| `COM_CARNE_FRESCA` | **Com Carne Fresca** |
| `ALIMENTO_COMPLETO` | **Alimento Completo** |
| `ALIMENTO_COADJUVANTE` | **Alimento Coadjuvante (Prescrição)** |
| `SECO` | **Seco** |
| `SEMI_UMIDO` | **Semiúmido** |
| `UMIDO` | **Úmido** |
| `RENAL` | **Coadjuvante Renal** |
| `URINARIO` | **Coadjuvante Urinário** |
| `OBESIDADE` | **Controle de Peso e Obesidade** |
| `HIPOALERGENICO` | **Hipoalergênico / Alergias** |
| `HEPATICO` | **Coadjuvante Hepático** |
| `GASTROINTESTINAL` | **Coadjuvante Gastrointestinal** |
| `ABERTO` | **Aberto** |
| `EM_ANALISE` | **Em Análise** |
| `DEFERIDO` | **Deferido** |
| `INDEFERIDO` | **Indeferido** |
| `ATUALIZACAO_LOTE` | **Atualização de Ficha Técnica** |
| `RETIFICACAO_DADOS` | **Retificação de Dados** |
| `DIVERGENCIA_ANALITICA` | **Divergência Analítica** |
| `proteina_bruta_min_pct` | **Proteína Bruta Mínima** |
| `extrato_etereo_min_pct` | **Gordura Mínima** |
| `materia_fibrosa_max_pct` | **Fibras Máximas** |
| `materia_mineral_max_pct` | **Minerais Máximos** |
| `balanco_calcio_fosforo` | **Equilíbrio entre Cálcio e Fósforo** |
| `energia_metabolizavel_nrc` | **Energia Metabolizável Estimada** |

---

## 2. Princípios de Blindagem Jurídica e Custódia Digital Oficial

1. **Fidelidade Estrita aos Dados Oficiais do Fabricante:** O portal opera em caráter estritamente documental e consultivo. Avalia exclusivamente as garantias nutricionais e composições declaradas publicamente pelos próprios fabricantes em seus websites institucionais oficiais (domínio próprio da marca ou do grupo fabricante). O portal não realiza ensaios bromatológicos laboratoriais próprios nem emite parecer sobre eficácia biológica *in vivo*. Sob os **Arts. 30 e 31 da Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor)**, toda informação técnica veiculada pelo fornecedor em meio digital obriga a empresa e integra a oferta perante o mercado consumidor.
2. **Protocolo de Tríplice Custódia Digital Probatória:** Cada registro técnico indexado no portal é permanentemente respaldado por quatro âncoras de integridade:
   - **URL Oficial do Fabricante (`sourceUrl`):** Endereço público de onde as especificações técnicas foram extraídas.
   - **Snapshot no Wayback Machine (`sourceArchiveUrl`):** Espelho público e imutável arquivado no [web.archive.org](https://web.archive.org) com carimbo temporal independente de terceiro.
   - **Comprovante Digital Local (`sourceDocumentUrl`):** Cópia em PDF ou captura de tela em alta resolução (print) da seção de níveis de garantia e ingredientes arquivada no servidor.
   - **Carimbo de Data da Coleta Digital (`labelCollectionDate`):** Registro formal da data em que os dados estavam vigentes no canal do fabricante.
3. **Algoritmo Determinístico:** Não há notas subjetivas, avaliações sensoriais de palatabilidade ou votação de usuários. Cada fração da pontuação é fundamentada matematicamente no Manual ABINPET (11ª Edição) e em Instruções Normativas do MAPA.
4. **Muralha da China (Total Independência entre Curadoria Científica e Monetização):** Os links patrocinados e parcerias de afiliados (Amazon, Mercado Livre, Petlove, Cobasi, Shopee com `rel="sponsored"`) existem exclusivamente como conveniência de navegação comercial para o usuário. Nenhum vínculo comercial ou comissão de venda tem a prerrogativa de alterar a pontuação técnica (0 a 100), modificar o tier do produto ou alterar sua posição na listagem alfabética. A curadoria e a monetização operam em isolamento absoluto.
5. **Isolamento de Alimentos Coadjuvantes:** Dietas com finalidade terapêutica (Renal, Obesidade, Urinário, Cardíaco, Gastrointestinal, etc.) são avaliadas quanto ao atendimento de sua finalidade clínica prescrita e **não concorrem em índices de alimentos completos de manutenção regular**.
6. **Neutralidade Regulatória quanto a Transgênicos (OGM):** A presença de ingredientes geneticamente modificados é analisada estritamente sob o aspecto de rotulagem compulsória (símbolo "T" e espécies doadoras, segundo o Decreto nº 4.680/2003 e a Lei nº 11.105/2005). Não há dedução nem bonificação de pontos pela presença ou ausência de OGM, mantendo a neutralidade científica preconizada pela CTNBio e pela ABINPET.
7. **Canal Institucional do Fabricante (Right of Reply):** Canal permanente e prioritário para que fabricantes notifiquem reformulações de produtos, atualizações em suas fichas técnicas oficiais ou retificações cadastrais mediante indicação da nova URL oficial ou envio de documentação técnica.
8. **Dispensa de Metadados Burocráticos (CNPJ e Registro MAPA):** Em consonância com o modelo de extração digital no website oficial da marca, os dados de CNPJ da indústria e número de Registro no MAPA do produto são formalmente dispensados e eliminados do catálogo público e administrativo. A identificação pública e inequívoca do fornecedor ampara-se no Nome da Marca e na URL Oficial da Página do Fabricante (`sourceUrl`), em total conformidade com os Arts. 30 e 31 do CDC.

---

## 3. Mecânica de Cálculo e Conversões Nutricionais

### 3.1. Normalização Obrigatória para Matéria Seca (MS)
Conforme preconizado pelo Manual ABINPET (item 1.3), os níveis de garantia declarados na matéria natural (MN) devem ser convertidos para base seca para comparação justa entre formulações:

$$\text{Nutriente}_{\text{MS}} (\%) = \frac{\text{Nutriente}_{\text{MN}} (\%) \times 100}{100 - \text{Umidade Máxima}_{\text{MN}} (\%)}$$

### 3.2. Estimativa de Energia Metabolizável (EM) — Método NRC/ABINPET
O cálculo segue a metodologia oficial descrita no item 1.4.1.1 do Manual ABINPET:

1. **Extrativos Não-Nitrogenados (ENN %):**  
   $$\text{ENN} (\%) = 100 - (\% \text{Umidade} + \% \text{Proteína Bruta} + \% \text{Extrato Etéreo} + \% \text{Matéria Fibrosa} + \% \text{Matéria Mineral})$$
2. **Energia Bruta (EB em kcal/kg de MN):**  
   $$\text{EB} = (5{,}7 \times \text{PB}_{\text{g/kg}}) + (9{,}4 \times \text{EE}_{\text{g/kg}}) + [4{,}1 \times (\text{ENN}_{\text{g/kg}} + \text{FB}_{\text{g/kg}})]$$
   *(onde $\text{PB}_{\text{g/kg}} = \% \text{PB} \times 10$, $\text{EE}_{\text{g/kg}} = \% \text{EE} \times 10$, etc.)*
3. **Coeficiente de Digestibilidade da Energia (CDE %):**  
   $$\text{CDE}_{\text{Cão}} (\%) = 91{,}2 - [1{,}43 \times (\% \text{FB na MS})]$$  
   $$\text{CDE}_{\text{Gato}} (\%) = 87{,}9 - [0{,}88 \times (\% \text{FB na MS})]$$
4. **Energia Digestível (ED em kcal/kg):**  
   $$\text{ED} = \text{EB} \times \left(\frac{\text{CDE}}{100}\right)$$
5. **Energia Metabolizável (EM em kcal/kg de MN):**  
   $$\text{EM}_{\text{Cão}} = \text{ED} - (1{,}04 \times \text{PB}_{\text{g/kg}})$$  
   $$\text{EM}_{\text{Gato}} = \text{ED} - (0{,}77 \times \text{PB}_{\text{g/kg}})$$
6. **Energia Metabolizável na Matéria Seca (EM MS em kcal/kg):**  
   $$\text{EM}_{\text{MS}} = \frac{\text{EM}_{\text{MN}} \times 100}{100 - \text{Umidade Máxima}_{\text{MN}} (\%)}$$

### 3.3. Proporção Cálcio : Fósforo (Ca:P)
$$\text{Relação Ca:P} = \frac{\% \text{Cálcio Mínimo}}{\% \text{Fósforo Mínimo}}$$

### 3.4. Padrões de Umidade e Atividade de Água ($Aw$) por Categoria Física
Conforme a Seção de Identidade e Qualidade da ABINPET (itens 1.3 e 2.1):
* **Alimento Seco:** Umidade máxima de **12%** e atividade de água $Aw \le 0{,}72$.
* **Alimento Semiúmido:** Umidade entre **12% e 30%** e atividade de água $Aw \le 0{,}85$.
* **Alimento Úmido (Patês, Sachês):** Umidade entre **30% e 84%**.
* **Alimento Líquido:** Umidade entre **84% e 95%**.

### 3.5. Equiparação Calórica para Alimentos Úmidos e Semiúmidos (Base $g / 1.000\text{ kcal}$ EM)
Quando a densidade calórica de um alimento úmido difere sensivelmente do padrão de $4.000\text{ kcal EM/kg MS}$, os pisos da ABINPET são normalizados por densidade energética:

$$\text{Nutriente}_{\text{g / 1.000 kcal}} = \frac{\text{Nutriente}_{\text{MS}} (\%) \times 10.000}{\text{EM}_{\text{MS}} (\text{kcal/kg})}$$

Essa equiparação garante que sachês e patês com umidade entre 75% e 84% sejam avaliados em perfeita paridade metabólica com formulações secas de manutenção.

---

## 4. Tabela de Pisos Nutricionais Mínimos Oficiais da ABINPET

Valores mínimos recomendados expressos em **g por 100g de Matéria Seca (MS)** para dietas de 4.000 kcal EM/kg MS (adaptado de FEDIAF/NRC pelo Manual ABINPET 11ª Edição, Tabelas 1 e 3):

| Nutriente | Cão Adulto (Manutenção) | Cão Filhote (Crescimento) | Gato Adulto (Manutenção) | Gato Filhote (Crescimento) |
| :--- | :---: | :---: | :---: | :---: |
| **Proteína Bruta (mín.)** | $18{,}00\,\text{g}$ | $20{,}00\,\text{g}$ a $25{,}00\,\text{g}$ | $25{,}00\,\text{g}$ | $28{,}00\,\text{g}$ a $30{,}00\,\text{g}$ |
| **Extrato Etéreo / Gordura (mín.)** | $5{,}50\,\text{g}$ | $8{,}50\,\text{g}$ | $9{,}00\,\text{g}$ | $9{,}00\,\text{g}$ |
| **Cálcio (mín.)** | $0{,}50\,\text{g}$ | $0{,}80\,\text{g}$ a $1{,}00\,\text{g}$ | $0{,}40\,\text{g}$ | $1{,}00\,\text{g}$ |
| **Cálcio (máx. seguro)** | $2{,}50\,\text{g}$ | $1{,}60\,\text{g}$ (inicial) / $1{,}80\,\text{g}$ (final) | $—$ | $—$ |
| **Fósforo (mín.)** | $0{,}40\,\text{g}$ | $0{,}70\,\text{g}$ a $0{,}90\,\text{g}$ | $0{,}26\,\text{g}$ | $0{,}84\,\text{g}$ |
| **Fósforo (máx. seguro)** | $1{,}60\,\text{g}$ | $—$ | $—$ | $—$ |
| **Relação Ca:P (faixa ideal)** | $1{,}1:1\text{ a }1{,}6:1$ | $1{,}1:1\text{ a }1{,}5:1$ | $1{,}1:1\text{ a }1{,}6:1$ | $1{,}1:1\text{ a }1{,}5:1$ |
| **Relação Ca:P (limite máx. tolerável)** | Até $2{,}0:1$ | Até $1{,}6:1$ (ou $1{,}8:1$ pós-6m) | Até $2{,}0:1$ | Até $1{,}5:1$ |
| **Sódio (mín. - máx. seguro)** | $0{,}10\,\text{g} - 1{,}50\,\text{g}$ | $0{,}22\,\text{g} - 1{,}50\,\text{g}$ | $0{,}08\,\text{g} - 1{,}50\,\text{g}$ | $0{,}16\,\text{g} - 1{,}50\,\text{g}$ |
| **Taurina (mín. felinos)** | Não exigido para cães | Não exigido para cães | $0{,}10\,\text{g}$ (seco) / $0{,}20\,\text{g}$ (úmido) | $0{,}10\,\text{g}$ (seco) / $0{,}25\,\text{g}$ (úmido) |
| **Ácido Linoleico $\omega$-6 (mín.)** | $1{,}32\,\text{g}$ | $1{,}30\,\text{g}$ | $0{,}50\,\text{g}$ | $0{,}55\,\text{g}$ |

---

## 5. Matriz do Índice de Conformidade de Rótulo (Score 0 a 100)

O algoritmo analisa o rótulo em 4 pilares determinísticos e auditáveis:

```
ÍNDICE DE CONFORMIDADE DE RÓTULO (100 PONTOS)
├── Pilar 1: Conformidade Bromatológica na Matéria Seca (40 pontos)
├── Pilar 2: Equilíbrio e Relação Cálcio : Fósforo (20 pontos)
├── Pilar 3: Qualidade das Matérias-Primas Principais (25 pontos)
└── Pilar 4: Transparência, Conservação e Atributos Funcionais (15 pontos)
```

### Detalhamento dos Pilares

| Pilar | Pontos | Critério de Avaliação | Base Normativa Oficial |
| :--- | :---: | :--- | :--- |
| **Pilar 1: Conformidade na MS** | **40 pts** | • **40 pts:** Todos os nutrientes atendem aos pisos e respeitam os limites seguros na MS com margem técnica de segurança.<br>• **20 pts:** Atende aos pisos estritos sem margem.<br>• **0 pts:** Algum nutriente abaixo do piso mínimo ou acima do teto seguro. | Diretrizes Nutricionais Oficiais da ABINPET / IN MAPA 30/2009 |
| **Pilar 2: Balanço Cálcio : Fósforo** | **20 pts** | • **20 pts:** Proporção ideal (Adultos: 1,1:1 a 1,6:1; Filhotes: 1,1:1 a 1,5:1).<br>• **10 pts:** Proporção tolerável (1,0:1 até 2,0:1).<br>• **0 pts:** Desequilíbrio (< 1,0:1 ou > 2,0:1). | Parâmetros de Saúde Óssea e Renal da ABINPET / FEDIAF |
| **Pilar 3: Qualidade dos Ingredientes** | **25 pts** | • **+15 pts:** 1º ingrediente é fonte cárnea de alta digestibilidade (farinha de vísceras de aves, carne de frango, carne bovina, salmão).<br>• **+10 pts:** 2º ingrediente também é de origem animal ou carboidrato nobre (arroz integral, quirera de arroz, aveia).<br>• **0 pts:** 1º ingrediente é de origem vegetal (milho, farelo de soja) ou subproduto indeterminado. | Regra de Ordem Decrescente de Inclusão da IN MAPA 30/2009 |
| **Pilar 4: Transparência e Funcionalidades** | **15 pts** | • **+5 pts:** Conservação comprovada exclusiva com antioxidantes naturais (Tocoferóis, Extrato de Alecrim, etc.).<br>• **+5 pts:** Presença garantida de prebióticos (FOS/MOS/Inulina) ou Ômega-3 (EPA/DHA).<br>• **+5 pts:** Coerência em claims de carne (conforme Tabela 14 da ABINPET). | Critérios de Rotulagem da ABINPET / IN MAPA 110/2020 |

---

## 6. Diretrizes Específicas do Manual ABINPET para Análise Técnica e Conformidade

### 6.1. Validação de Claims de Carne (Tabela 14 da ABINPET)
O sistema verifica se o claim exibido no painel principal da embalagem é respaldado pela lista de ingredientes:
1. **"Com Carne Fresca" / "Contém Carne Fresca":** Exige carne de bovino, aves, suíno ou peixe *in natura* ou resfriada (sem congelamento prévio e sem processos de farinha).
2. **"Com Carne" / "Contém Carne":** Autorizado para carne congelada, desidratada, in natura, carne mecanicamente separada (CMS), farinha de carne ou farinha de carne e ossos.
3. **"Sabor Carne" / "Sabor [Espécie]":** Permite o uso exclusivo de aromatizantes, miúdos, hidrolisados de vísceras ou palatabilizantes.
4. **Penalidade de Rotulagem:** Se um produto utiliza "Com Carne Fresca" no nome comercial, mas lista apenas farinha de carne ou aromatizante nos ingredientes, o produto perde os 5 pontos de coerência de claim no Pilar 4.

### 6.2. Classificação Oficial de Antioxidantes (IN MAPA 110/2020)
* **Antioxidantes Naturais (+5 pts no Pilar 4):**
  - Concentrado de Tocoferóis / D-Alfa-Tocoferol (Vitamina E).
  - Extrato de Alecrim (*Rosmarinus officinalis*, rico em ácido carnósico e carnosol).
  - Extrato de Semente de Uva.
  - Ácido Cítrico / Citrato de Sódio.
  - Palmitato de Ascorbila (Vitamina C).
* **Antioxidantes Sintéticos (Sem bonificação):**
  - BHA (Butilhidroxianisol) — Limite legal: máx. 150 mg/kg na dieta total.
  - BHT (Butilhidroxitolueno) — Limite legal: máx. 150 mg/kg na dieta total.
  - Etoxiquin — Limite legal: máx. 100 mg/kg (cães) e 150 mg/kg (total).
  - Propilgalato — Limite legal: máx. 100 mg/kg.

### 6.3. Aditivos Funcionais Reconhecidos (Guia de Matérias-Primas)
Substâncias bioativas e aditivos zootécnicos comprovados que agregam valor funcional ao alimento:
* **Prebióticos:** Frutooligossacarídeos (FOS), Mananoligossacarídeos (MOS da parede de *Saccharomyces cerevisiae*, com retenção comprovada de micotoxinas) e Inulina da raiz de chicória.
* **Adsorventes de Odor Fecal:** Extrato de *Yucca schidigera* (mínimo de 8,5% de saponinas ativas) e Zeólitas naturais (aluminossilicatos com alta capacidade de troca catiônica).
* **Condroprotetores (Saúde Articular):** Sulfato de Condroitina e Sulfato de Glicosamina.
* **Saúde Oral:** Hexametafosfato de Sódio e Tripolifosfato de Sódio (agentes quelantes do cálcio salivar para inibição de odontólitos/tártaro).

### 6.4. Nutrientes de Risco e Segurança no APPCC (Guia de Identidade e Qualidade)
A presença de nutrientes em níveis excessivos que possam acarretar toxicidade ou desequilíbrio metabólico grave (12 Nutrientes de Risco: Cálcio, Fósforo, Cobre, Selênio, Zinco, Ferro, Vitamina A, Vitamina D, Lisina, Arginina, Metionina, Triptofano) ou contaminação por micotoxinas acima dos tetos da ABINPET (Aflatoxinas totais > 20 ppb, Zearalenona > 200 ppb adultos / 100 ppb filhotes) classifica o produto compulsoriamente na faixa **Sob Observação**.

### 6.5. Matriz Oficial de Tolerâncias Analíticas do MAPA (IN nº 30/2009 e IN nº 87/2021)
Para instrução de eventuais contestações de fabricantes embasadas em laudos analíticos laboratoriais, a curadoria adota os limites oficiais de tolerância do MAPA para variação entre garantia de rótulo e teor analítico medido:

| Nutriente / Parâmetro | Tolerância Regulamentar de Deficiência | Tolerância Regulamentar de Excesso |
| :--- | :---: | :---: |
| **Proteína Bruta** | Até $5\%$ do declarado | Livre (desde que sem risco toxicológico) |
| **Extrato Etéreo (Gordura)** | Até $10\%$ do declarado | Até $15\%$ do declarado (salvo indicação light) |
| **Matéria Fibrosa (Fibra)** | Não aplicável | Até $10\%$ do declarado |
| **Matéria Mineral (Cinzas)** | Não aplicável | Até $10\%$ do declarado |
| **Umidade** | Não aplicável | Até $10\%$ do declarado |
| **Cálcio e Fósforo** | Até $10\%$ do valor mínimo | Até $10\%$ do valor máximo declarado |

---

## 7. Diretrizes Específicas para Alimentos Coadjuvantes (Dietas Veterinárias)

Alimentos coadjuvantes possuem indicação terapêutica e **não concorrem em índices com alimentos de manutenção**. São avaliados contra os parâmetros do Guia Nutricional para Alimentos Coadjuvantes da ABINPET:

1. **Doença Renal Crônica (DRC):**
   - Restrição controlada de Fósforo: $0{,}2\%$ a $0{,}5\%$ na MS para cães; $0{,}3\%$ a $0{,}6\%$ na MS para gatos.
   - Restrição moderada de Proteína com alta digestibilidade e valor biológico: $< 220\,\text{g/kg}$ em cães e $< 320\,\text{g/kg}$ em gatos.
   - Sódio controlado: $\le 0{,}3\%$ na MS para cães; $\le 0{,}4\%$ na MS para gatos.
   - Enriquecimento com Ômega-3 ($\text{EPA} + \text{DHA}$ entre $0{,}4\%$ e $2{,}5\%$ na MS; relação $\omega\text{-}6/\omega\text{-}3$ de $1:1$ a $7:1$).
2. **Urolitíase (Cálculos Urinários):**
   - Dissolução/Prevenção de Estruvita: Urina com pH controlado ($5{,}8$ a $6{,}4$), redução de Magnésio ($< 0{,}10\%$ MS) e Fósforo ($< 0{,}6\%$ cães; $< 0{,}9\%$ gatos).
   - Prevenção de Oxalato de Cálcio: Evitar urina excessivamente ácida (pH alvo $\ge 6{,}2$ a $7{,}5$), controle de sódio e estímulo à ingestão hídrica.
3. **Hipersensibilidade Alimentar / Alergia:**
   - Emprego de proteínas hidrolisadas de baixo peso molecular ($< 18.000\text{ Daltons}$) ou fonte proteica única e inédita (ex.: cordeiro, pato, salmão).
4. **Obesidade e Controle de Peso:**
   - Alta proteína ($> 28\%$ cães; $> 35\%$ gatos na MS) para preservação da massa magra durante restrição calórica.
   - Densidade calórica reduzida ($< 300\text{ kcal}/100\text{g}$ em cães; $< 350\text{ kcal}/100\text{g}$ em gatos na matéria natural).
   - Elevado teor de fibra bruta ($7\%$ a $15\%$ MS em cães) para promoção de saciedade.
5. **Coadjuvante Hepático:**
   - Controle rigoroso de Cobre ($< 5\,\text{mg/kg}$ MS) para evitar hepatotoxicoses por acúmulo de cobre, enriquecimento em Zinco ($\ge 200\,\text{mg/kg}$ MS) como quelante competitivo e proteína de altíssimo valor biológico em teores moderados.
6. **Coadjuvante Gastrointestinal:**
   - Alta digestibilidade de nutrientes ($\ge 85\%$), gordura moderada, equilíbrio de fibras solúveis e insolúveis (polpa de beterraba e psyllium) e reforço de eletrólitos (potássio e sódio).

---

## 8. Estrutura Visual do Catálogo (Sem Posições Ordinais)

1. **Eliminação de Posições Ordinais (`#1`, `#2`, `#3` lugar):** Os produtos são agrupados exclusivamente por faixas de classificação técnica (tiers), eliminando comparações competitivas artificiais.
2. **Faixas de Classificação:**
   - **Nível Ouro (90 a 100 pontos):** Padrão Superior.
   - **Nível Prata (75 a 89 pontos):** Padrão Ótimo.
   - **Nível Bronze (60 a 74 pontos):** Padrão Regular.
   - **Sob Observação (Abaixo de 60 pontos):** Parâmetros limítrofes ou inconsistências no rótulo.
3. **Critério de Desempate Neutro:** Ordenação padrão estritamente **alfabética** por nome comercial ou marca. Quando o usuário optar voluntariamente por ordenar pelo índice de conformidade, os itens continuam agrupados por tiers sem atribuição de posições ordinais numéricas.
4. **Nomenclatura das Telas:**
   - Listagens: **"Índice de Conformidade de Rótulos"** ou **"Análise Comparativa de Rótulos"**.
   - Página Individual: **"Análise de Rótulo: [Nome do Produto]"**.
   - Ação de Detalhamento: **"Ver Extrato da Análise de Rótulo"**.
   - Selo de Conformidade: **"100% Conforme às Diretrizes Nutricionais da ABINPET 🟢"**.

---

## 9. Canal Institucional de Relações com Fabricantes (`ManufacturerTicket`)

1. **Acesso Permanente:** Link direto visível nas páginas de análise e no rodapé: *"Fabricante: Solicite Atualização de Dados do Rótulo"*.
2. **Ciclo de Vida do Chamado:**
   ```
   [ABERTO] ➔ [EM_ANALISE] ➔ [DEFERIDO] (Dados Atualizados e Recalculados)
                            └── [INDEFERIDO] (Parecer Técnico com Justificativa)
   ```
3. **Tipos de Solicitação:**
   - `ATUALIZACAO_LOTE`: Notificação de nova batelada comercial com alteração de fórmula ou layout.
   - `RETIFICACAO_DADOS`: Correção pontual de transcrição de níveis de garantia ou ingredientes.
   - `DIVERGENCIA_ANALITICA`: Contestação técnica de cálculo com envio de contraprova pericial.
4. **Requisitos Probatórios Obrigatórios:**
   - Razão Social, CNPJ válido e número de Registro do Estabelecimento e do Produto no MAPA.
   - Identificação do solicitante com cargo e registro profissional (ART do Responsável Técnico com CRMV ativo).
   - Anexação comprobatória de arquivo digital legível da nova arte aprovada em rotulagem ou laudo emitido por laboratório analítico acreditado (ISO/IEC 17025) e credenciado no MAPA.
5. **SLA Operacional:** Análise em até **5 (cinco) dias úteis**, com recálculo automático do índice no sistema após deferimento e notificação formal por e-mail.

---

## 10. Termo de Isenção de Responsabilidade (Disclaimer de Rodapé)

> **TERMO DE TRANSPARÊNCIA, METODOLOGIA E ISENÇÃO DE RESPONSABILIDADE:**  
> O presente portal tem caráter estritamente educativo, consultivo e informativo, visando à promoção da transparência e do direito do consumidor à informação clara e precisa, nos termos do Artigo 6º, Inciso III, e Artigo 31 da Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor). As pontuações, semáforos visuais e agrupamentos apresentados decorrem de análise comparativa documental baseada exclusivamente nas informações declaradas e impressas pelos próprios fabricantes nos rótulos comerciais dos produtos registrados no Ministério da Agricultura e Pecuária (MAPA), confrontadas com as diretrizes do Manual Pet Food Brasil (ABINPET, 11ª Edição).  
> Este portal não realiza análises laboratoriais bromatológicas próprias nem emite juízos sobre a eficácia biológica *in vivo* dos produtos. Alimentos coadjuvantes (prescrição veterinária) são avaliados segundo seus objetivos clínicos específicos e não concorrem em listagens de alimentos de manutenção regular. O conteúdo não substitui a avaliação individual de um médico veterinário ou zootecnista. Fabricantes podem solicitar atualização de dados a qualquer momento por meio de nosso canal institucional.

---

## 11. Esquema de Dados Expandido (JSON / Back-End)

```json
{
  "produto_id": "uuid-v4",
  "nome_comercial": "Ração Super Premium Cães Adultos Frango e Arroz",
  "marca": "NutriPet",
  "razao_social_fabricante": "Indústria Brasileira de Alimentos Pet S/A",
  "cnpj_fabricante": "00.000.000/0001-00",
  "registro_mapa": "SP 000000-0",
  "categoria_legal": "ALIMENTO_COMPLETO",
  "especie": "CAO",
  "fase_vida": "ADULTO",
  "porte": "MEDIO_GRANDE",
  "tipo_alimento": "SECO",
  "coadjuvante_patologia": null,
  
  "dados_coleta_rotulo": {
    "lote_analisado": "LOTE-2026-BR-09",
    "data_coleta_rotulo": "2026-08-15",
    "url_foto_rotulo_frente": "https://storage.petrankings.com.br/evidencias/lote2026_frente.jpg",
    "url_foto_rotulo_verso": "https://storage.petrankings.com.br/evidencias/lote2026_garantias.jpg",
    "cadastrado_por": "adm_curadoria_01"
  },

  "niveis_garantia_mn": {
    "umidade_max_pct": 10.0,
    "proteina_bruta_min_pct": 26.0,
    "extrato_etereo_min_pct": 14.0,
    "materia_fibrosa_max_pct": 3.0,
    "materia_mineral_max_pct": 7.5,
    "calcio_min_pct": 1.0,
    "calcio_max_pct": 1.6,
    "fosforo_min_pct": 0.8,
    "sodio_min_pct": 0.22,
    "omega_3_min_pct": 0.35
  },

  "calculos_bromatologicos_estimados": {
    "materia_seca_pct": 90.0,
    "proteina_bruta_ms_pct": 28.89,
    "extrato_etereo_ms_pct": 15.56,
    "fibra_bruta_ms_pct": 3.33,
    "materia_mineral_ms_pct": 8.33,
    "extrativos_nao_nitrogenados_mn_pct": 39.5,
    "relacao_calcio_fosforo": 1.25,
    "energia_bruta_eb_kcal_kg": 4272.5,
    "coeficiente_digestibilidade_cde_pct": 86.43,
    "energia_digestivel_ed_kcal_kg": 3692.7,
    "energia_metabolizavel_em_mn_kcal_kg": 3422.3,
    "energia_metabolizavel_em_ms_kcal_kg": 3802.6
  },

  "analise_rotulo_score": {
    "score_total": 95,
    "faixa_nivel": "NIVEL_OURO",
    "badge_rotulo": "Nível Ouro — Padrão Superior",
    "extrato_pontos": [
      {
        "pilar": "Conformidade em Matéria Seca",
        "pontos_obtidos": 40,
        "pontos_max": 40,
        "justificativa": "Todos os nutrientes atendem aos pisos das diretrizes ABINPET com margem de segurança."
      },
      {
        "pilar": "Balanço Cálcio e Fósforo",
        "pontos_obtidos": 20,
        "pontos_max": 20,
        "justificativa": "Relação Cálcio e Fósforo calculada em 1,25:1 (faixa ideal: 1,1 a 1,6 da ABINPET)."
      },
      {
        "pilar": "Ingredientes Principais",
        "pontos_obtidos": 25,
        "pontos_max": 25,
        "justificativa": "Primeiro e segundo ingredientes são farinha de vísceras e quirera de arroz (IN MAPA 30/2009)."
      },
      {
        "pilar": "Transparência e Atributos",
        "pontos_obtidos": 10,
        "pontos_max": 15,
        "justificativa": "Conservação natural e Ômega-3 comprovado (+10). Ausência de carne fresca in natura (-5)."
      }
    ]
  },

  "analise_rotulagem_declarada": {
    "claim_carne_tipo": "COM_CARNE",
    "claim_carne_validado": true,
    "contem_ogm": true,
    "ogm_especies": ["Milho transgênico (Bt)", "Soja transgênica (RR)"],
    "antioxidantes_tipo": "NATURAL",
    "antioxidantes_especificados": ["Concentrado de tocoferóis", "Extrato de alecrim"],
    "aditivos_funcionais": ["FOS", "MOS", "Extrato de Yucca"],
    "ingredientes_top3": [
      "Farinha de vísceras de aves",
      "Quirera de arroz",
      "Gordura de frango"
    ]
  },

  "parecer_editorial": "Alimento completo com excelente equilíbrio nutricional declarado no rótulo, destaque para uso de conservantes naturais e ótima proporção Cálcio e Fósforo."
}
```

---

## 12. Requisitos Não-Funcionais, Segurança da Informação e Stealth Backoffice

1. **Camuflagem do Painel Administrativo (Stealth Gatekeeper):**
   - As rotas `/admin`, `/admin/*` e `/api/auth/login` retornam compulsoriamente status HTTP `404 Not Found` para requisições diretas, robôs e scanners de vulnerabilidade.
   - O acesso administrativo somente é destravado via requisição autorizada ao Portão Secreto configurado em variáveis de ambiente (`ADMIN_SECRET_GATE_PATH` combinado com a chave criptográfica `ADMIN_GATE_KEY`).
   - A liberação gera o cookie de passagem `petrankings_admin_gate` assinado e temporizado. Em produção, a flag `ALLOW_ADMIN_IN_PRODUCTION="true"` atua como disjuntor mestre obrigatório.
2. **Defesa Anti-Spam Tripla para Formulários Públicos:**
   - **Honeypot Invisível:** Inclusão de campo de captura oculto (`website_hp`) invisível para usuários humanos; requisições contendo valor preenchido são descartadas silenciosamente com HTTP 200 (descarte sem pistas).
   - **Trava Temporal de Interação Humana:** Rejeição de envios submetidos em menos de **2,5 segundos** a partir da renderização inicial do formulário (mitigação de scripts automatizados de injeção).
   - **Rate Limiting em Camada de Aplicação:** Limite estrito de requisições por endereço IP e por chave de e-mail para prevenção contra ataques de negação de serviço e sobrecarga de banco.
3. **Sessões e Autenticação Criptográfica:**
   - Emissão de tokens JWT assinados via biblioteca `jose` com algoritmo `HS256`, expiração controlada e custódia em cookies `httpOnly`, `SameSite=Lax` e `Secure`.
   - Armazenamento de credenciais de operadores mediante hash `bcryptjs` (custo mínimo salt 10).
4. **Cabeçalhos HTTP de Segurança da Informação (OWASP Compliance):**
   - Configuração ativa em `next.config.mjs` de `Content-Security-Policy` (CSP restritiva), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` (HSTS com preload) e `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 13. SEO Técnico e Esquema de Dados Estruturados (Schema.org / JSON-LD)

1. **Schema `Product` Enriquecido:**
   - Marcação JSON-LD em todas as páginas de produto com identificação de marca, fabricante, código de barras EAN/GTIN quando disponível e `additionalProperty` contendo os teores normalizados em Matéria Seca (Proteína MS, Gordura MS, Relação Ca:P) e a faixa técnica conferida.
2. **Schema `ItemList` para o Catálogo e Faixas:**
   - Marcação da lista de produtos indexados preservando a ordenação alfabética neutra, sem atributos ordinais numéricos (`position` com índice semântico sequencial de catálogo, não de pódio).
3. **Schema `BreadcrumbList` e `FAQPage`:**
   - Navegação estruturada em trilhas de migalhas (*Breadcrumbs*) e marcação de perguntas frequentes na página Sobre/Metodologia, esclarecendo a imparcialidade do índice e a adoção do Manual ABINPET.
4. **Canônicas e Metadados OpenGraph:**
   - Definição estrita de URLs canônicas limpas para evitar indexação duplicada por parâmetros de busca ou filtros e tags OpenGraph dinâmicas para compartilhamento social fidedigno.