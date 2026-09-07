# Workflow — Auditoria Pré-Deploy em Produção

> **Objetivo:** Procedimento obrigatório de verificação de qualidade técnica, integridade de dados e conformidade SEO antes de disparar o deploy em produção (Vercel, Docker, Railway ou VPS).

---

## 🚦 Etapa 1: Validação de Variáveis de Ambiente

Conferir se todas as variáveis sensíveis e públicas estão preenchidas:
- `DATABASE_URL`: Aponta para o PostgreSQL de produção (Supabase, Neon, etc.).
- `JWT_SECRET`: Chave forte de no mínimo 32 caracteres.
- `NEXT_PUBLIC_SITE_URL`: `https://petrankings.com.br` (estritamente com HTTPS e sem barra final).
- `ALLOW_ADMIN_IN_PRODUCTION`: Definido como `"true"` somente se o acesso ao `/admin` em produção for intencional.

---

## 🔍 Etapa 2: Checagem Estrita de Tipagem (TypeScript)

Executar o compilador sem emitir arquivos:
```bash
npx tsc --noEmit
```
*Critério de aprovação: Código de saída 0, zero erros de tipagem.*

---

## 🗺️ Etapa 3: Auditoria de Sitemap XML e Tags Canônicas

Verificar se todas as URLs do sitemap possuem canônicas alinhadas:
```bash
npx tsx .agents/skills/nextjs-performance-seo/scripts/validate-sitemap-canonicals.ts
```
*Critério de aprovação: 100% de conformidade canônica, zero barras duplas ou trailing slashes inconsistentes.*

---

## 🔗 Etapa 4: Auditoria de Links de Lojas e Afiliados

Auditar as URLs externas cadastradas no catálogo:
```bash
npx tsx .agents/skills/link-health-watchdog/scripts/check-links.ts
```
*Critério de aprovação: Nenhuma loja retornando 404 permanente e presença correta de tags de afiliado.*

---

## 🏗️ Etapa 5: Validação do Build de Produção

Compilar os clientes Prisma e o bundle otimizado do Next.js:
```bash
npm run build
```
*Critério de aprovação: Build gerado com sucesso para todas as páginas estáticas e dinâmicas.*

---

## 🗄️ Etapa 6: Migrações de Banco no Ambiente Remoto

No pipeline de CI/CD ou no terminal de deploy:
```bash
npx prisma migrate deploy
```
*Critério de aprovação: Todas as migrações aplicadas sem divergência de esquema.*
