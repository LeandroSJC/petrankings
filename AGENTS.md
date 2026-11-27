# PetRankings — Diretrizes de Engenharia e Orquestração de Agentes

> Regras arquiteturais, invariantes inegociáveis e matriz de skills do **PetRankings**.

---

## 1. Stack Tecnológica Oficial

* **Framework & Runtime:** Next.js 15 (App Router), React 19, TypeScript 5.8, Node.js 20+.
* **Estilização:** **Vanilla CSS puro com Design Tokens (Variáveis CSS).** **PROIBIDO usar Tailwind CSS.**
* **Banco de Dados & ORM:** PostgreSQL 16 (Oracle Cloud VPS / Docker) com **Prisma ORM 6.4**.
* **Autenticação:** Stealth Gatekeeper (`petrankings_admin_gate`) + Email OTP (`AdminOtp` via Resend) + JWT stateless (`jose` `HS256`, `petrankings_admin_token`, `httpOnly`) + `bcryptjs`.
* **Ícones & Mídia:** `lucide-react`, `sharp`, Playwright/Cheerio (ingestão).

---

## 2. Invariantes Arquiteturais Inegociáveis

1. **APIs Assíncronas do Next.js 15:** `params` e `searchParams` são `Promise` em `page.tsx`, `layout.tsx` e `route.ts` — sempre usar `await params` / `await searchParams`.
2. **Design Tokens & Identidade Visual:** Nunca usar cores hex soltas em componentes; usar tokens CSS (`var(--brand-forest-900)`, `var(--bg-surface)`, etc.) com alta legibilidade em tabelas comparativas.
3. **CRUD Administrativo em Rotas Dedicadas (Sem Modais):** Criação e edição de produtos residem em `/admin/produtos/novo` e `/admin/produtos/[id]/editar`, com guardião `beforeunload` contra perda de dados. Gestão de fabricantes reside em `/admin/chamados` e mensagens em `/admin/mensagens`.
4. **Pontuação Determinística (Motor V5 — 0 a 100):** A nota de um alimento completo (`scoreTotal`) é calculada exclusivamente pelo Motor Determinístico V5 (4 pilares em Matéria Seca, Ca:P, Ingredientes e Transparência). `ALIMENTO_COADJUVANTE` nunca recebe nota competitiva (`scoreTotal: null`). Proibido inventar notas de lojas ou avaliações simuladas.
5. **Segurança, Camuflagem & Anti-Spam:**
   - `/admin`, `/admin/*` e rotas de auth (`/api/auth/otp/*`) retornam 404 sem o cookie assinado `petrankings_admin_gate` (destravado via `ADMIN_SECRET_GATE_PATH?key=ADMIN_GATE_KEY`). Em produção, `ALLOW_ADMIN_IN_PRODUCTION="true"` é o disjuntor mestre.
   - Todas as mutações administrativas validam `petrankings_admin_token` no servidor.
   - Formulários públicos (`/contato`, `/fabricante`) exigem proteção tripla: honeypot (`website_hp`), trava temporal (`>= 2,5s`) e rate limit em banco (`ContactRateLimit`).
   - Nunca expor segredos (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_GATE_KEY`, `RESEND_API_KEY`) com `NEXT_PUBLIC_`.
6. **Custódia Oficial em HTML/SHA-256 & Zero Invenção de Dados:** Todo dado técnico (níveis de garantia, ingredientes, conservantes, transgênicos) deve originar-se estritamente da página oficial do fabricante custodiada em HTML com hash SHA-256 (sem dependência de PDFs). Dados não declarados permanecem `null` / *"Não informado"* — tolerância zero a alucinações ou estimativas.
7. **Biblioteca Regulatória (`biblioteca_regulatoria/`):** Toda regra nutricional ou normativa deve fundamentar-se no Manual Pet Food Brasil (ABINPET 11ª Ed.), FEDIAF, NRC, atos do MAPA (Decreto nº 12.031/2024, IN 30/2009, IN 22/2009, IN 39/2014, IN 110/2020) e CDC (Lei nº 8.078/1990).
8. **Proibição Estrita de "Auditoria" e "Perícia" (ADR 0004):** É terminantemente proibido usar *"Auditoria"*, *"Perícia"*, *"Laudo Pericial"* ou derivados em qualquer interface pública/admin, metadado, título ou `editorialOpinion`. Usar: *"Avaliação Técnica"*, *"Análise de Rótulo"*, *"Confronto Documental"*, *"Dossiê Técnico"*, *"Produtos Analisados"*.
9. **Glossário & ADRs:** Consultar [`GLOSSARY.md`](file:///d:/Projetos/PetRankings/GLOSSARY.md) e `.agents/adr/` antes de alterações conceituais ou arquiteturais.
10. **Editorial, Estudos & Guias (`/guias`) — Regras Inegociáveis** *(runbook completo em `pet-editorial-copywriter`)*:
    - **Autoria institucional obrigatória:** *"Equipe de Curadoria Técnica"* (*"Observatório PetRankings"*); proibido inventar autores individuais.
    - **Fidelidade de citações e fontes:** `relatedProductSlugs` contém apenas produtos analisados no texto; se `[]`, proibido incluir fontes tipo `rotulagem` em `references`. Toda publicação exige `references` reais e autênticas.
    - **Ineditismo & Destaque Exclusivo:** Conferir todo o acervo de `src/lib/content/guides.ts` antes de propor pautas (zero repetição). Novo guia recebe `isFeatured: true` e o anterior muda para `false`. Manter paridade editorial Cães vs. Gatos.
    - **Títulos & Hierarquia:** Guias em Fórmula Bimembre (`Gatilho : Dilema + Ancoragem`, Sentence Case, 65–85 chars, sem ponto final em declarativas). Produtos (`commercialName`) sem prefixo *"Ração"*, sem pesos (`15kg`/`85g`), sem `®`/`™`. Nunca usar ALL CAPS em `<h2>`/`<h3>`.
    - **Humanização & Anti-Slop:** Sem contrastes falsos (*not X but Y*), sem frases de efeito finais, sem travessões (`—`) no meio de frases, sem aberturas teatrais, sem jargões fabris (*"sacaria"*); parágrafos de 2–4 linhas com tradução prática imediata de cada termo técnico.
    - **Capas:** Duelos obrigatoriamente via `scripts/gerar-capas-duelo.js`; demais clusters em 1200×630 WebP sem textos nas imagens e sem repetir raça/pelagem nas últimas 5 publicações da espécie.
11. **Pragmatismo & Menor Diff Viável (YAGNI):** Resolver 100% da causa raiz com a menor alteração possível; não criar abstrações prematuras nem instalar pacotes npm desnecessários; verificar todos os chamadores ao alterar funções centrais ou campos Prisma; nunca cortar validações, segurança ou acessibilidade.

---

## 3. Matriz de Especialistas (Skills em `.agents/skills/`)

| Domínio / Tarefa | Skill Especialista | Diretrizes Principais |
| :--- | :--- | :--- |
| **Backoffice, Chamados & CRUD** | `admin-dashboard-engineer` | Rotas dedicadas, `beforeunload`, `/admin/produtos`, `/admin/chamados` (`ManufacturerTicket`), `ProductRedirect`. |
| **Monetização & AdSense** | `adsense-monetization-architect` | Consent Mode v2, slots anti-CLS, `ads.txt` e políticas Google Publisher. |
| **Lojas, Afiliados & Links** | `affiliate-store-engine` | `AffiliateLink`, fallback `productUrl`, `rel="sponsored"`, CDC e script `check-links.ts`. |
| **Busca por IA & GEO (LLMs)** | `ai-search-geo-optimizer` | `/llms.txt`, densidade factual e citações em AI Overviews, Perplexity e ChatGPT. |
| **Segurança, Auth & Headers** | `appsec-data-shield` | Stealth Gatekeeper 404, OTP (`AdminOtp`), JWT `jose`, Zod, headers CSP/HSTS e rate limit. |
| **Cache & Performance ISR** | `content-caching-strategy` | `unstable_cache`, `revalidatePath`, invalidação por tags e headers CDN. |
| **Aparência & Anti-Slop** | `design-taste-frontend` | Heurísticas anti-slop, tokens CSS puros, Hero Kit e hierarquia Sentence Case. |
| **Acessibilidade Web** | `frontend-a11y-auditor` | WCAG 2.1 AA, teclado, contraste 4.5:1 e semântica ARIA. |
| **Componentes & UI/UX** | `frontend-ui-ux-design` | Estados completos (loading, hover, empty, error), CSS Grid responsivo e micro-interações. |
| **Uploads & Imagens** | `image-upload-manager` | Magic bytes, pipeline `sharp`/WebP, volume Docker `/public/uploads` e `auditar:imagens`. |
| **SEO & Core Web Vitals** | `nextjs-performance-seo` | Metadados dinâmicos, OpenGraph, sitemap/canônicas (`validate-sitemap-canonicals.ts`) e CWV. |
| **Oracle VPS, Docker & Deploy** | `oracle-vps-sysadmin` | ARM 12GB, Docker Compose, checklist pré-deploy, túnel SSH, backups 3-2-1 e fail2ban. |
| **Editorial, Guias & Humanizer** | `pet-editorial-copywriter` | Taxonomia pet food, Humanizer anti-slop, títulos bimembres, capas e checklist de 8 pontos. |
| **Motor Bromatológico V5** | `pet-nutrition-evaluator` | Matéria Seca (MS), Ca:P, 4 pilares (0–100), faixas de conformidade e normas ABINPET/MAPA. |
| **Prisma & PostgreSQL 16** | `prisma-database-architect` | Modelagem, migrações, índices compostos, paginação, `$transaction` e `ProductRedirect`. |
| **Ingestão & Custódia HTML** | `product-ingestion-custody` | Playwright/Cheerio, custódia HTML + SHA-256, Wayback Machine, `cadastrar:url` e `cadastrar-produtos`. |
| **Rich Snippets & JSON-LD** | `schema-org-structured-data-expert` | `Product`, `ItemList`, `Article`/`TechArticle`, `FAQPage`, `BreadcrumbList` e `Organization`. |
| **Diagnóstico de Bugs** | `scientific-bug-diagnostics` | Isolamento em `scratch/`, reprodução mínima (Vermelho → Verde) e redaction de segredos. |
| **Indexação & Search Console** | `search-console-indexing-watchdog` | Cobertura GSC, canônicas, crawl budget e solicitação de indexação. |
