# PetRankings — Diretrizes de Engenharia e Orquestração de Agentes

> Este documento estabelece as regras arquiteturais, convenções inegociáveis de código e a matriz de orquestração de skills para o desenvolvimento do **PetRankings**.

---

## 🛠️ 1. Stack Tecnológica e Versões Oficiais

* **Framework:** Next.js 15 (App Router, Server Components & Route Handlers)
* **Linguagem & Runtime:** TypeScript 5.8, Node.js 20+
* **Frontend Core:** React 19 (Server Functions, Server Actions, `useActionState`)
* **Estilização:** **Vanilla CSS puro com Design Tokens (Variáveis CSS)**.
  > ⚠️ **REGRA CRÍTICA:** **NÃO use Tailwind CSS.** O projeto utiliza variáveis CSS globais e classes semânticas. Nunca injete utilitários do Tailwind (`bg-slate-900`, `flex-col`, etc.).
* **Banco de Dados & ORM:** PostgreSQL padronizado para todos os ambientes com **Prisma ORM 6.4**.
* **Autenticação:** JWT stateless com `jose` (`HS256`), cookies `httpOnly`, `bcryptjs` (salt 10) e middleware em duas camadas.
* **Ícones:** `lucide-react`.

---

## 📌 2. Invariantes Arquiteturais Inegociáveis

1. **APIs Assíncronas do Next.js 15:**
   - Em componentes de página (`page.tsx`), layouts (`layout.tsx`) e Route Handlers (`route.ts`), as props `params` e `searchParams` são **Promises**.
   - Sempre declare `{ params }: { params: Promise<{ id: string }> }` e faça `const { id } = await params;`.
2. **Design Tokens & Identidade Visual:**
   - Nunca utilize valores hexadecimais soltos nos componentes. Utilize os tokens de cores, sombras e raios definidos em CSS (`var(--color-primary)`, `var(--bg-surface)`, etc.).
   - Mantenha alta densidade de dados e legibilidade nas tabelas comparativas de produtos e catálogos.
3. **Páginas Dedicadas para CRUD Administrativo (Sem Modais):**
   - Criação e edição de produtos e rankings devem residir em rotas dedicadas (`/admin/produtos/novo`, `/admin/produtos/[id]/editar`), com guardião `beforeunload` contra perda acidental de dados. Nunca use modais suspensos para formulários longos.
4. **Cálculo Aritmético de Avaliações:**
   - A nota média de um produto é a média aritmética simples das notas válidas (0.0 a 5.0) cadastradas manualmente nas lojas vinculadas.
   - É estritamente proibido inventar avaliações falsas ou criar dados simulados.
5. **Segurança e Proteção de Dados (AppSec & Stealth Gatekeeper):**
   - **Camuflagem do Painel Administrativo:** As rotas `/admin`, `/admin/*` e `/api/auth/login` retornam estritamente 404 (Not Found) para qualquer acesso direto ou scanner. O acesso é destravado apenas através do Portão Secreto (`ADMIN_SECRET_GATE_PATH` com `ADMIN_GATE_KEY`), gerando o cookie assinado `petrankings_admin_gate`. Em produção, `ALLOW_ADMIN_IN_PRODUCTION="true"` atua como disjuntor mestre.
   - Todas as mutações administrativas exigem verificação de JWT de sessão (`petrankings_admin_token`).
   - Rotas públicas com formulários (contato) devem ter proteção tripla: campo invisível honeypot (`website_hp`), trava temporal mínima (2,5s) e rate limit por IP/e-mail.
   - Nunca exponha variáveis confidenciais (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_GATE_KEY`) com o prefixo `NEXT_PUBLIC_`.
6. **Fidelidade Estrita à Ficha Técnica Oficial (HTML/Rotulagem) e Proibição Absoluta de Invenção de Dados:**
   - Toda e qualquer informação cadastrada no sistema (níveis de garantia, ingredientes na ordem decrescente, conservantes, transgênicos e notas) deve seguir estrita e fielmente o conteúdo da **página oficial do produto (HTML/rotulagem do fabricante)**.
   - O projeto eliminou a dependência de PDFs, padronizando a ingestão e custódia em HTML oficial com hash SHA-256.
   - É terminantemente proibido inventar, simular, deduzir ou estimar dados não verificáveis.
   - Se algo não for possível de ser verificado na documentação oficial com certeza probatória, a impossibilidade deve ser informada ao usuário/curador e o dado **não deve ser inventado**, permanecendo nulo ou não declarado.
7. **Biblioteca Regulatória e Marco Normativo Oficial (`biblioteca_regulatoria/`):**
   - A pasta `biblioteca_regulatoria/` é o repositório mestre de consulta obrigatória para qualquer questão relativa a limites nutricionais (Manual Pet Food Brasil - ABINPET 11ª Edição), atos regulatórios do MAPA (Decreto nº 12.031/2024, IN 30/2009, IN 22/2009), legislação de rotulagem e normas de defesa do consumidor (CDC - Lei nº 8.078/1990).
   - Quaisquer novas regras, faixas de nutrientes ou parâmetros do motor de avaliação nutricional devem obrigatoriamente estar fundamentados nos documentos e legislações arquivados nesta biblioteca.
8. **Proibição Estrita do Termo "Auditoria" / "Auditado" (Regra Mandatória 3 do DRS):**
   - É estritamente proibido o uso do termo "Auditoria" ou de qualquer de seus derivados gramaticais ("auditar", "auditado", "auditada", "auditados", "auditadas", "auditável", "extrato auditável", "sistema de auditoria") em qualquer elemento visível de interface pública, institucional, administrativa, metadados ou parecer editorial (`editorialOpinion`).
   - O PetRankings é um portal independente de jornalismo de dados e não órgão fiscalizador de Estado (MAPA). Portanto, realiza **análise de rótulo**, **avaliação nutricional**, **confronto documental** e **laudo técnico de conformidade** com base na literatura científica (ABINPET/MAPA).
   - **Termos obrigatórios de substituição:** "Avaliação Técnica", "Análise de Rótulo", "Confronto Documental", "Laudo Técnico", "Produtos Analisados", "Fichas Avaliadas", "Analisar Produto".
9. **Fidelidade Estrita de Citações em Artigos, Estudos e Guias (Proibição de Produtos Aleatórios):**
   - Nos artigos, estudos bromatológicos e guias técnicos (`/guias`), a seção **"Produtos Analisados Citados neste Estudo"** destina-se estritamente aos produtos que tenham sido expressamente citados, analisados ou confrontados no corpo do texto da publicação.
   - É terminantemente proibido vincular produtos aleatórios, preencher `relatedProductSlugs` por conveniência visual/estética ou associar itens que não façam parte do escopo editorial da matéria.
   - Caso um estudo ou guia seja de natureza puramente didática, conceitual, metodológica ou regulatória (ex: explicação matemática de conversão para Matéria Seca ou panorama geral sobre aditivos e conservantes) sem menção formal a produtos específicos do banco de dados, o campo `relatedProductSlugs` deve ser obrigatoriamente um array vazio (`[]`), e a seção de produtos citados não deve ser renderizada.
10. **Assinatura e Autoria Institucional Padronizada em Estudos e Guias:**
    - Todos os artigos, duelos, estudos bromatológicos e guias técnicos possuem autoria estritamente institucional, assinados compulsoriamente como **"Equipe de Curadoria Técnica"** (com papel *"Observatório PetRankings"*).
    - É terminantemente proibido inventar autores individuais fictícios, pseudônimos médicos ou caricaturas acadêmicas (ex.: "Dr. Zootecnia"). O PetRankings opera como veículo coletivo e independente de jornalismo de dados e curadoria técnica.
11. **Rigor Probatório e Tolerância Zero a Alucinações ou Informações Fictícias:**
    - Na elaboração, revisão e manutenção de artigos, estudos bromatológicos, duelos comparativos e guias técnicos (`/guias`), é expressamente vedada qualquer alucinação, extrapolação hipotética ou invenção de dados e afirmações.
    - **Fontes Primárias Obrigatórias:**
      1. Níveis de garantia, ingredientes na ordem decrescente, conservantes e transgênicos devem originar-se estritamente das fichas técnicas oficiais dos fabricantes custodiadas em HTML com hash SHA-256 no banco de dados.
      2. Padrões de exigência nutricional e tetos toxicológicos devem estar fundamentados na 11ª Edição do Manual Pet Food Brasil (ABINPET), FEDIAF e NRC arquivados na pasta `biblioteca_regulatoria/`.
      3. Atos regulatórios e leis citados devem ser estritamente autênticos e vigentes (MAPA, Decretos Federais, CDC), sendo proibido inventar artigos de lei ou resoluções inexistentes.
    - **Incerteza Probatória:** Se uma informação não for comprovável com certeza probatória nos documentos oficiais, ela jamais deve ser estimada ou simulada; o texto deve declarar expressamente a ausência da informação pelo fabricante ou omiti-la.
12. **Padrão Ortotipográfico e Visual para Títulos de Estudos e Guias (`/guias`):**
    - Todos os títulos de artigos, estudos bromatológicos e guias técnicos devem adotar a **Fórmula Bimembre** (`[Gatilho de Busca / Objeto do Confronto] : [Dilema do Tutor + Ancoragem Técnica/Regulatória]`).
    - **Capitalização Oficial (Sentence Case):** Seguir estritamente a norma culta da língua portuguesa (Sentence Case), com inicial maiúscula apenas na primeira palavra da oração e maiúscula após os dois-pontos (`:`). É expressamente proibido o *Title Case* em inglês (maiúscula em cada palavra solta).
    - **Nomes Próprios, Marcas e Siglas:** Preservar a grafia comercial oficial das marcas (`PremieR Formula`, `GoldeN Formula`, `Purina Pro Plan`, `Farmina N&D`) e siglas em maiúsculas (`MAPA`, `ABINPET`, `WSAVA`, `FEDIAF`, `CDC`, `OGM`, `CTNBio`, `BHT`, `BHA`, `MS`).
    - **Aspas em Termos Literais:** Expressões literais de rotulagem ou claims regulatórios devem ser grafados entre aspas duplas retas (`"Com Carne"`, `"Sabor Carne"`, símbolo `"T"`).
    - **Pontuação:** Perguntas diretas encerram obrigatoriamente com ponto de interrogação (`?`); frases declarativas nunca levam ponto final.
    - **Extensão:** Entre 65 e 85 caracteres no total, com o gatilho primário (antes dos `:`) contendo até 45 caracteres para evitar truncamento em dispositivos móveis no Google Discover/SERP.
13. **Padronização Taxonômica e Visual de Títulos (Produtos, Páginas e Seções):**
    - **Títulos de Produtos (`commercialName`):** Seguem a fórmula canônica `[Marca Comercial] [Linha] [Espécie / Porte] [Fase de Vida / Especialidade] [Sabor / Claim Principal] [Formato se Úmido]`. É terminantemente proibido o uso da palavra genérica "Ração" no início de nomes comerciais, a inclusão de gramaturas/pesos (`15kg`, `85g`), símbolos de registro (`®`, `™`) ou duplicações da marca. Preservar o plural técnico (`Cães Adultos`, `Gatos Castrados`) e a acentuação oficial (`Raças Médias`, `Sênior`).
    - **Títulos de Páginas (`<title>` e `<h1>`):**
      - `<title>` (Navegador/SERP): Segue a estrutura de autoridade com separador padronizado (`[Assunto / Nome do Produto] — [Complemento / Análise de Rótulo] | PetRankings`).
      - `<h1>` (Interface Visual): Sempre implementado no padrão "Hero Kit" em três camadas: Kicker/Eyebrow superior (`text-transform: uppercase`, `letter-spacing: 0.04em` a `0.06em`, `font-size: 0.72rem` com ícone Lucide temático), `<h1>` em fonte `var(--font-heading)` com peso 800, cor `var(--brand-forest-900)` em Sentence Case (ou Nome Comercial em produtos) e Lead/Subtítulo explicativo em fonte `0.90rem` a `1.0rem`.
    - **Títulos de Seções Internas (`<h2>` e `<h3>`):**
      - **Sentence Case Mandatório:** É expressamente proibido o uso de `<h2>` em caixa alta total (ALL CAPS). A caixa alta é restrita exclusivamente a kickers/badges de apoio com até 3 palavras.
      - **Hierarquia Visual:** `font-weight: 800`, cor `var(--brand-forest-900)` (ou `#ffffff` em seções escuras), entrelinha compacta (`line-height: 1.25`).
      - **Dossiê Pericial nas Fichas de Produto (`/produto/[slug]`):** As seções da ficha técnica adotam ordenação lógica e numeração pericial (`1. Custódia documental e evidência oficial`, `2. Extrato da avaliação nutricional (0 a 100)`, `3. Níveis de garantia: Matéria Natural (MN) vs. Matéria Seca (MS)`, `4. Composição básica e ingredientes declarados`, `5. Onde encontrar este produto`).
14. **Paridade e Equilíbrio Editorial entre Espécies (Cães vs. Gatos):**
    - A linha editorial do PetRankings deve manter paridade e alternância equilibrada entre conteúdos dedicados a cães e gatos na trilha de estudos, duelos e guias técnicos (`/guias`).
    - Estudos com foco exclusivo em uma espécie devem ser alternados de modo a evitar sobrepeso de uma categoria sobre a outra (proporção equilibrada na esteira de publicações específicas, complementada por estudos transversais de metodologia bromatológica com foco "Cães e Gatos").
    - Ao planejar novas pautas, o curador deve verificar a distribuição corrente de publicações específicas e priorizar a espécie com menor densidade de estudos exclusivos publicados.
15. **Linguagem Ubíqua e Registros de Decisão Arquitetural (`GLOSSARY.md` e ADRs):**
    - O projeto mantém um glossário canônico na raiz ([`GLOSSARY.md`](file:///d:/Projetos/PetRankings/GLOSSARY.md)) que estabelece a terminologia oficial (Bromatologia, MAPA, Segurança e Taxonomia) e lista termos mandatórios a serem evitados (`_Evitar_`).
    - Decisões estruturais de alto impacto, de difícil reversão ou que demandem contexto histórico são registradas na pasta `.agents/adr/` no formato enxuto de ADR (Architecture Decision Record). Todo agente deve consultar o glossário e os ADRs pertinentes antes de propor alterações conceituais ou refatorações de arquitetura.

---

## 🧭 3. Matriz de Especialistas (Skills Disponíveis)

Sempre que atuar em uma área específica do projeto, ative e siga o runbook do respectivo skill em `.agents/skills/`:

| Domínio / Tarefa | Skill Especialista | Diretrizes Principais |
| :--- | :--- | :--- |
| **Backoffice & CRUD Admin** | `admin-dashboard-engineer` | Formulários em rotas dedicadas, guardião `beforeunload`, tabelas de dados. |
| **Monetização & AdSense** | `adsense-monetization-architect` | Conformidade Google 2026 (Consent Mode v2, TCF v2.3, slots anti-CLS). |
| **Busca por IA & GEO (LLMs)** | `ai-search-geo-optimizer` | Otimização para IAs (Perplexity, ChatGPT, AI Overviews), `/llms.txt` e densidade factual. |
| **Lojas & Afiliados** | `affiliate-store-engine` | Links de grandes varejistas e lojas parceiras com `rel="sponsored"`. |
| **Segurança & Headers** | `appsec-data-shield` | Cabeçalhos HTTP (`next.config.mjs`), OWASP Top 10, sanitização. |
| **Autenticação & Sessões** | `auth-security-guardian` | JWT com `jose`, middleware em duas camadas, proteção contra brute-force. |
| **Cache & Performance ISR** | `content-caching-strategy` | `unstable_cache` no Prisma, `revalidatePath`, invalidação por tags. |
| **Aparência & Anti-Slop** | `design-taste-frontend` | Heurísticas visuais anti-slop, ausência de templates genéricos, tokens puros. |
| **Deploy & Infraestrutura** | `devops-deployment-expert` | Configurações Docker, Vercel, Railway, migrações no deploy e CI/CD. |
| **Diagnóstico Científico de Bugs** | `scientific-bug-diagnostics` | Isolamento em `scratch/`, loop mínimo de reprodução (Vermelho -> Verde) e redaction de segredos. |
| **Observabilidade & Logs** | `error-monitoring-observability` | Sentry SDK, `instrumentation.ts`, Error Boundaries para prevenir telas brancas. |
| **Acessibilidade Web** | `frontend-a11y-auditor` | WCAG 2.1 AA, navegação completa por teclado, contraste 4.5:1, ARIA. |
| **E2E & Testes de UI** | `frontend-testing` | `browser_subagent` para testes visuais imediatos, Vitest / Playwright. |
| **Componentes & Micro-interações** | `frontend-ui-ux-design` | Estados completos (loading, hover, empty, error), CSS Grid responsivo. |
| **Uploads de Imagens** | `image-upload-manager` | Validação de magic bytes (`file-type`), processamento com `sharp`. |
| **Auditoria de Links** | `link-health-watchdog` | Verificação assíncrona de status HTTP, timeouts e degradação suave. |
| **SEO & Core Web Vitals** | `nextjs-performance-seo` | Metadados dinâmicos, OpenGraph, sitemap/robots, otimização LCP/CLS/INP. |
| **Servidor Oracle & Infra VPS** | `oracle-vps-sysadmin` | Gestão da VM Oracle Cloud ARM 12GB, Docker Compose, backups 3-2-1 e fail2ban. |
| **Redação & Taxonomia Pet** | `pet-editorial-copywriter` | Taxonomia cães/gatos, aviso veterinário obrigatório, tom imparcial. |
| **Motor Bromatológico & Rótulos** | `pet-nutrition-evaluator` | Fórmulas em Matéria Seca (MS), balanço Ca:P, 4 pilares e normas MAPA/ABINPET 11ª Ed. |
| **Modelagem & Migrações** | `prisma-database-architect` | Estrutura de dados relacional, migrações PostgreSQL, integridade referencial. |
| **Consultas & Índices Prisma** | `prisma-query-patterns` | Índices de chaves estrangeiras, transações `$transaction`, paginação. |
| **Rich Snippets & JSON-LD** | `schema-org-structured-data-expert` | Schemas `ItemList`, `Product`, `AggregateRating`, `FAQPage`, `BreadcrumbList`. |
| **Indexação & Search Console** | `search-console-indexing-watchdog` | Resolução de erros no GSC, canônicas, crawl budget e requisição de indexação. |

