---
name: pet-nutrition-evaluator
description: >-
  Deterministic nutritional evaluation, bromatological calculations (Dry Matter / Matéria Seca MS conversion,
  Calcium-to-Phosphorus Ca:P ratio balancing, metabolizable energy estimation), ingredient order inspection
  (IN MAPA 22/2009), additive classification (BHT/BHA vs natural tocopherols), and regulatory compliance audits
  based strictly on official manufacturer HTML labeling and the ABINPET 11th Edition Pet Food Manual.
---

# Pet Nutrition Evaluator & Bromatological Compliance Engine

This skill governs the mathematical, regulatory, and bromatological evaluation engine of **PetRankings**. It codifies the deterministic 4-pillar methodology, nutritional formulas, legal standards, and evidence custody rules for evaluating dog and cat foods.

---

## 1. Biblioteca Regulatória Obrigatória (`biblioteca_regulatoria/`)

Toda e qualquer pontuação, parâmetro ou análise deve estar ancorada nos atos oficiais arquivados no repositório mestre:

* **Manual Pet Food Brasil — ABINPET (11ª Edição):** Padrões de exigência nutricional mínima e tetos toxicológicos máximos para cães e gatos em todas as fases de vida.
* **Decreto Presidencial nº 12.031/2024:** Novo Regulamento de Fiscalização de Produtos Destinados à Alimentação Animal.
* **IN MAPA nº 30/2009 & IN MAPA nº 39/2014:** Classificação oficial de alimentos (Completos, Coadjuvantes e Específicos/Complementares).
* **IN MAPA nº 22/2009:** Obrigatoriedade da ordem decrescente de quantidade dos ingredientes na rotulagem.
* **IN MAPA nº 110/2020:** Regulamento de aditivos tecnológicos, conservantes e antioxidantes.
* **Código de Defesa do Consumidor (Lei nº 8.078/1990, Arts. 30 e 31):** Princípio da vinculação da oferta e dever de veracidade das informações ao tutor.

---

## 2. A Matemática dos 4 Pilares da Avaliação Técnica

A pontuação global de um produto (escala de 0 a 100) é determinada por um motor matemático objetivo, sem viés ou parecer subjetivo:

### Pilar 1: Adequação Nutricional em Matéria Seca — MS (35 Pontos)
A água dilui as porcentagens dos nutrientes informadas nas embalagens. Para confrontar com a literatura científica, **é obrigatório converter todos os níveis de garantia para a base seca**:

$$\text{Nutriente}_{\text{MS}} = \frac{\text{Nutriente}_{\text{MN}}}{100 - \text{Umidade}_{\text{máx}}} \times 100$$

* **Proteína Bruta (PB):**
  * *Cães Adultos:* Mínimo ABINPET = 18% MS. Faixa excelente Super Premium: $\ge 26\%$ MS.
  * *Cães Filhotes:* Mínimo ABINPET = 22% MS. Faixa excelente: $\ge 30\%$ MS.
  * *Gatos Adultos:* Mínimo ABINPET = 26% MS. Faixa excelente: $\ge 36\%$ MS.
  * *Gatos Filhotes:* Mínimo ABINPET = 30% MS. Faixa excelente: $\ge 38\%$ MS.
* **Extrato Etéreo (Gordura - EE):** Avaliação da densidade lipídica e ácidos graxos essenciais.
* **Fibra Bruta (FB) e Matéria Mineral (Cinzas):** Monitoramento contra excesso de cinzas ósseas ($> 10\%$ MS acende alerta de subprodutos de baixa digestibilidade).

### Pilar 2: Balanço Mineral Cálcio : Fósforo — Ca:P (25 Pontos)
Proporção crítica para a integridade esquelética, crescimento seguro de filhotes e proteção do trato urinário e renal de gatos:

$$\text{Razão Ca:P} = \frac{\text{Cálcio (\% MS)}}{\text{Fósforo (\% MS)}}$$

* **Alimentos Secos (Extrusados):**
  * *Faixa Fisiológica Ideal:* **1,00 : 1 até 2,00 : 1**.
  * *Alerta de Risco:* Razão $< 1,00$ (risco de desmineralização óssea/hiperparatireoidismo secundário nutricional) ou $> 2,00$ (risco de osteocondrose e sobrecarga renal).
* **Alimentos Úmidos (Sachês e Latas — Calibração Especial FEDIAF/NRC):**
  * Em sachês com 80% a 88% de umidade, a amplificação matemática da Matéria Seca é acentuada.
  * Conforme as diretrizes internacionais **FEDIAF (2025)** e **NRC (2006)**, alimentos úmidos completos com carnes e cartilagens naturais toleram teores de cálcio de até **3,00% em Matéria Seca** de forma fisiologicamente segura.

### Pilar 3: Nobreza dos Ingredientes — Ordem Decrescente (25 Pontos)
Inspeção forense dos **primeiros 5 ingredientes declarados** (IN MAPA nº 22/2009):
1. **Proteína Animal Nobre:** Bonifica produtos onde carnes frescas desossadas ou farinhas nobres (ex: *Farinha de Vísceras de Frango Low Ash*, *Salmão*, *Cordeiro*) encabeçam o 1º e 2º lugares da batelada.
2. **Filtragem de Água em Úmidos:** Como caldo/água é veículo físico obrigatório de cocção e aparece em 1º lugar, o motor ignora a água inerte e pontua os dois primeiros ingredientes nutritivos reais.
3. **Detecção do "Splitting de Grãos":** Alerta quando milho ou trigo são fracionados intencionalmente (*milho integral*, *glúten de milho*, *quirera de arroz*) para que a proteína animal aparente estar em 1º lugar.

### Pilar 4: Transparência, Conservantes e Atributos Funcionais (15 Pontos)
* **Conservação 100% Natural (+5 pts):** Uso de tocoferóis mistos (vitamina E), extrato de alecrim e ácido cítrico.
* **Eliminação de BHT e BHA (+5 pts):** Ausência total de antioxidantes sintéticos fenólicos.
* **Livre de Transgênicos (+5 pts):** Ausência de milho e soja geneticamente modificados (sem o símbolo triangular "T" do Decreto nº 4.680/2003).
* **Aditivos Funcionais Comprovados:** Presença garantida de sulfato de condroitina, glicosamina, EPA/DHA e prebióticos (MOS/FOS).

---

## 3. As 4 Faixas Técnicas de Conformidade

Com base na pontuação ponderada (0 a 100), o produto é enquadrado exclusivamente em:

| Faixa | Pontuação | Selo Visual | Significado Técnico |
| :--- | :--- | :--- | :--- |
| **Referência Nutricional** | **85 a 100** | 🟢 Verde Escuro | Matéria Seca nobre, balanço mineral exemplar, conservação 100% natural, carnes nobres no topo. |
| **Alta Conformidade** | **70 a 84** | 🔵 Azul | Atende com folga as tabelas da ABINPET, bom perfil proteico, conservação equilibrada. |
| **Conformidade Básica** | **60 a 69** | 🟡 Âmbar | Atende aos limites legais mínimos de manutenção, maior participação de subprodutos vegetais. |
| **Sob Observação** | **< 60** | 🔴 Vermelho | Dados nutricionais inconsistentes, desequilíbrio Ca:P ou parâmetros limítrofes na literatura. |

---

## 4. Regras Invioláveis de Governança (AGENTS.md)

1. **Proibição Estrita do Termo "Auditoria" (Regra Mandatória 3):**
   * É **terminantemente vedado** utilizar termos como "auditoria", "auditado", "auditar", "extrato auditável".
   * **Substitutos obrigatórios:** "Avaliação Técnica", "Análise de Rótulo", "Confronto Documental", "Laudo Técnico", "Produtos Analisados".
2. **Fidelidade Estrita à Ficha Técnica Oficial (HTML/SHA-256):**
   * Toda informação deve ter origem comprovável na página oficial do produto custodiada em HTML com hash SHA-256.
   * Tolerância zero a alucinações, deduções ou valores estimados. Se uma garantia não foi informada pelo fabricante, o dado permanece nulo (`null` / *"Não informado"*).
3. **Isolamento de Alimentos Coadjuvantes:**
   * Rações de prescrição terapêutica (Renal, Urinária, Obesidade, etc.) **nunca recebem nota e nunca competem em rankings**. Elas possuem catálogo isolado sem gamificação.
