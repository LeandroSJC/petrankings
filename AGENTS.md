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
6. **Fidelidade Estrita ao PDF e Proibição Absoluta de Invenção de Dados:**
   - Toda e qualquer informação cadastrada no sistema (níveis de garantia, ingredientes na ordem decrescente, conservantes, transgênicos e notas) deve seguir estrita e fielmente o conteúdo do **PDF da ficha técnica oficial do produto**.
   - É terminantemente proibido inventar, simular, deduzir ou estimar dados não verificáveis.
   - Se algo não for possível de ser verificado na documentação oficial com certeza probatória, a impossibilidade deve ser informada ao usuário/curador e o dado **não deve ser inventado**, permanecendo nulo ou não declarado.

---

## 🧭 3. Matriz de Especialistas (Skills Disponíveis)

Sempre que atuar em uma área específica do projeto, ative e siga o runbook do respectivo skill em `.agents/skills/`:

| Domínio / Tarefa | Skill Especialista | Diretrizes Principais |
| :--- | :--- | :--- |
| **Backoffice & CRUD Admin** | `admin-dashboard-engineer` | Formulários em rotas dedicadas, guardião `beforeunload`, tabelas de dados. |
| **Monetização & AdSense** | `adsense-monetization-architect` | Conformidade Google 2026 (Consent Mode v2, TCF v2.3, slots anti-CLS). |
| **Lojas & Afiliados** | `affiliate-store-engine` | Links de grandes varejistas e lojas parceiras com `rel="sponsored"`. |
| **Segurança & Headers** | `appsec-data-shield` | Cabeçalhos HTTP (`next.config.mjs`), OWASP Top 10, sanitização. |
| **Autenticação & Sessões** | `auth-security-guardian` | JWT com `jose`, middleware em duas camadas, proteção contra brute-force. |
| **Cache & Performance ISR** | `content-caching-strategy` | `unstable_cache` no Prisma, `revalidatePath`, invalidação por tags. |
| **Aparência & Anti-Slop** | `design-taste-frontend` | Heurísticas visuais anti-slop, ausência de templates genéricos, tokens puros. |
| **Deploy & Infraestrutura** | `devops-deployment-expert` | Configurações Docker, Vercel, Railway, migrações no deploy e CI/CD. |
| **Observabilidade & Logs** | `error-monitoring-observability` | Sentry SDK, `instrumentation.ts`, Error Boundaries para prevenir telas brancas. |
| **Acessibilidade Web** | `frontend-a11y-auditor` | WCAG 2.1 AA, navegação completa por teclado, contraste 4.5:1, ARIA. |
| **E2E & Testes de UI** | `frontend-testing` | `browser_subagent` para testes visuais imediatos, Vitest / Playwright. |
| **Componentes & Micro-interações** | `frontend-ui-ux-design` | Estados completos (loading, hover, empty, error), CSS Grid responsivo. |
| **Uploads de Imagens** | `image-upload-manager` | Validação de magic bytes (`file-type`), processamento com `sharp`. |
| **Auditoria de Links** | `link-health-watchdog` | Verificação assíncrona de status HTTP, timeouts e degradação suave. |
| **SEO & Core Web Vitals** | `nextjs-performance-seo` | Metadados dinâmicos, OpenGraph, sitemap/robots, otimização LCP/CLS/INP. |
| **Redação & Taxonomia Pet** | `pet-editorial-copywriter` | Taxonomia cães/gatos, aviso veterinário obrigatório, tom imparcial. |
| **Modelagem & Migrações** | `prisma-database-architect` | Estrutura de dados relacional, migrações PostgreSQL, integridade referencial. |
| **Consultas & Índices Prisma** | `prisma-query-patterns` | Índices de chaves estrangeiras, transações `$transaction`, paginação. |
| **Rich Snippets & JSON-LD** | `schema-org-structured-data-expert` | Schemas `ItemList`, `Product`, `AggregateRating`, `FAQPage`, `BreadcrumbList`. |
| **Indexação & Search Console** | `search-console-indexing-watchdog` | Resolução de erros no GSC, canônicas, crawl budget e requisição de indexação. |
