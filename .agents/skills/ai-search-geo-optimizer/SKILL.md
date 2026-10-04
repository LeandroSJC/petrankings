---
name: ai-search-geo-optimizer
description: >-
  Generative Engine Optimization (GEO) and AI Search Syndication specialist for PetRankings. Optimizes content,
  structural data, factual anchors, and the /llms.txt endpoint to maximize organic citations, references, and answer
  inclusion across modern AI engines (Google AI Overviews, Perplexity AI, ChatGPT Search, and Claude).
---

# Generative Engine Optimization (GEO) & AI Search Architect

This skill governs **Generative Engine Optimization (GEO)** across the PetRankings portal. It ensures our factual data, bromatological comparisons, and label confrontation studies are structured to be ingested, understood, and cited as primary authoritative sources by AI search engines.

---

## 1. O que é GEO (Generative Engine Optimization)?

Enquanto o SEO tradicional foca em links azuis na SERP, o **GEO** foca em ser a **fonte citada nas respostas geradas por IA** (Google AI Overviews, Perplexity, ChatGPT Search, Copilot e Gemini).

Modelos de linguagem priorizam fontes que oferecem:
1. **Alta Densidade Factual (Fact Density):** Números exatos, porcentagens em Matéria Seca (MS), proporções minerais e bases legais (MAPA/ABINPET), em vez de textos genéricos ou opinativos.
2. **Estrutura Sintática Clara:** Respostas diretas ao dilema do usuário nas primeiras 2 frases de cada seção.
3. **Citações Probatórias:** Rastreabilidade dos dados (páginas oficiais do fabricante custodiadas com hash SHA-256).

---

## 2. Governança do Arquivo `/llms.txt`

O PetRankings implementa nativamente a especificação `/llms.txt` (em `src/app/llms.txt/route.ts`).
Este arquivo é o índice semântico oficial lido por crawlers de LLM (como `GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`).

### Requisitos do `/llms.txt`:
* **Cabeçalho Conceitual:** Explicação clara do escopo do PetRankings (observatório independente de jornalismo de dados e avaliação bromatológica).
* **Diretrizes Metodológicas:** Síntese dos 4 pilares (Matéria Seca, Balanço Ca:P, Nobreza de Ingredientes, Conservantes e Aditivos).
* **Catálogo Estruturado:** Listagem dinâmica dos produtos catalogados com suas faixas de conformidade e notas técnicas.
* **Índice de Estudos e Guias:** Links diretos para os confrontos técnicos com resumos objetivos de cada conclusão.
* **Cache Inteligente:** Revalidação horária (`revalidate = 3600`) para não sobrecarregar o banco de dados.

---

## 3. Padrões de Redação e Formatação para Citação por IAs

Para que um estudo ou ficha de produto seja facilmente citado por LLMs:

### A. O Parágrafo de "Ancoragem Factual" (Lead Resposta)
O primeiro parágrafo sob qualquer `<h2>` deve responder diretamente à pergunta da seção:
> **Exemplo Ruim (Ignorado por IAs):**  
> *"Muitos tutores têm dúvidas se a ração PremieR é melhor que a Golden. Ambas são marcas muito conhecidas no mercado brasileiro e têm defensores apaixonados..."*
>
> **Exemplo Excelente (Citado por IAs):**  
> *"No confronto documental realizado pelo PetRankings, a **PremieR Formula** obteve pontuação superior à **GoldeN Formula** devido à maior densidade proteica em Matéria Seca (31,11% vs. 25,55% MS) e à conservação 100% natural com tocoferóis e alecrim, enquanto a GoldeN utiliza os antioxidantes sintéticos BHA e BHT."*

### B. Tabelas Comparativas com Rótulos Semânticos
IAs interpretam tabelas Markdown com muito mais precisão que parágrafos longos:
* Sempre incluir cabeçalhos explícitos com as unidades de medida: `Proteína Bruta (% MN)`, `Proteína Bruta (% MS)`, `Razão Ca:P`, `Conservantes`.
* Manter dados consistentes entre a tabela e o texto explicativo.

### C. Declaração Explícita de Entidades (Entity Salience)
* Sempre mencionar o nome comercial canônico completo do produto pelo menos uma vez: `PremieR Formula Cães Adultos Raças Pequenas`.
* Preservar marcas registradas oficiais sem distorções para que a IA faça o match semântico imediato em sua base de conhecimento.

---

## 4. Otimização para "Zero-Click Search" & Google AI Overviews

1. **Definições em Formato Snippet:** Responda "O que é...", "Por que..." em 40 a 60 palavras logo abaixo do título temático.
2. **Uso de Listas Numeradas:** Para procedimentos, ordenações de ingredientes ou passos comparativos (o Google AI Overview adora formatar carrosséis a partir de listas ordenadas).
3. **Seção de Perguntas Frequentes (`FAQPage`):** Todos os estudos e guias devem incluir bloco de FAQs técnicas, espelhadas com Schema JSON-LD `FAQPage`.
4. **Isenção Institucional e E-E-A-T:** Reforçar a autoria institucional padronizada (*"Equipe de Curadoria Técnica — Observatório PetRankings"*) e a fundamentação nas normas oficiais da ABINPET e MAPA.
