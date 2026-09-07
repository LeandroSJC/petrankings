# Workflow — Criação e Publicação de Novo Ranking

> **Objetivo:** Procedimento passo a passo para criar, redigir, vincular produtos e publicar com segurança um novo ranking editorial no **PetRankings**.

---

## 📋 Fase 1: Definição Editorial e Taxonomia

1. **Escolha de Espécie e Tipo de Produto:**
   - **Espécie:** `caes` ou `gatos` (obrigatório).
   - **Tipo de Produto:** Nome substantivo claro (ex: *"Ração Seca"*, *"Areia Sanitária"*, *"Brinquedo Interativo"*).
2. **Elaboração do Título (Padrão `pet-editorial-copywriter`):**
   - Formato recomendado: `"Melhores [Tipo de Produto] para [Espécie] [Perfil Opcional]"`
   - Exemplos:
     - ✅ `"Melhores Rações Secas para Cães de Porte Pequeno"`
     - ✅ `"Melhores Brinquedos Interativos para Gatos Filhotes"`
3. **Geração do Slug Canônico:**
   - Deve ser único, em minúsculas e sem acentos (ex: `melhores-racoes-secas-para-caes-pequeno-porte`).

---

## ✍️ Fase 2: Redação e Aviso Legal Obrigatório

1. **Descrição Introdutória (1 a 2 parágrafos):**
   - Explicar os critérios de comparação: ingredientes, resistência, aceitação dos tutores e faixa de preço.
2. **Aviso Veterinário (Inclusão Obrigatória no Texto):**
   > *"O PetRankings é um comparativo editorial independente baseado na satisfação do mercado. Não substitui a orientação, o diagnóstico ou a prescrição de um médico veterinário. Consulte sempre o profissional de confiança do seu pet."*

---

## 🛍️ Fase 3: Cadastro e Vínculo de Produtos

1. **Seleção de Produtos Reais:**
   - Mínimo recomendado: 4 a 10 produtos para garantir densidade de comparação.
   - Cadastrar marca (`brand`), título oficial e imagem clara de alta qualidade.
2. **Lançamento das Lojas e Notas (`affiliate-store-engine`):**
   - Adicionar as lojas vinculadas (`amazon`, `mercadolivre`, `petlove`, `cobasi`, `shopee`).
   - Inserir a nota real (0.0 a 5.0) e contagem de avaliações coletadas na loja.
   - **Cálculo da Média:**
     $$\text{averageRating} = \frac{\sum \text{notas válidas}}{\text{número de lojas avaliadas}}$$
3. **Links de Afiliados:**
   - Inserir URLs com tag de rastreamento do parceiro (ex: `tag=...` na Amazon).
   - Manter a URL canônica do produto como fallback caso o afiliado expire.

---

## 🏷️ Fase 4: SEO e Dados Estruturados (JSON-LD)

1. **Validação de Schema (`schema-org-structured-data-expert`):**
   - Garantir que a página gere o bloco `<script type="application/ld+json">` contendo `ItemList` com posições ordenadas (`ListItem` de 1 a N), `AggregateRating` e `Brand`.
2. **Metadados e Canônica:**
   - Conferir se a rota `/ranking/[slug]` emite `alternates: { canonical: 'https://petrankings.com.br/ranking/[slug]' }`.

---

## 🚀 Fase 5: Publicação e Invalidação de Cache

1. **Publicar no Banco de Dados:**
   - Atualizar `isPublished: true` e registrar `dataUpdatedAt: new Date()`.
2. **Invalidar Cache do Next.js (`content-caching-strategy`):**
   - Chamar `revalidatePath('/ranking/[slug]')` e `revalidatePath('/')`.
   - Revalidar a tag global: `revalidateTag('rankings')`.
3. **Auditoria Pós-Publicação:**
   - Rodar o validador de sitemap para confirmar inclusão imediata:
     ```bash
     npx tsx .agents/skills/nextjs-performance-seo/scripts/validate-sitemap-canonicals.ts
     ```
