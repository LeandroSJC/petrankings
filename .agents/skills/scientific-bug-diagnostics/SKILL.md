---
name: scientific-bug-diagnostics
description: Disciplina de diagnóstico científico e isolamento determinístico para bugs complexos, falhas de schema, erros de query no Prisma e regressões no PetRankings. Ative quando um bug for reportado, uma rota quebrar, um cálculo divergir ou um comportamento inesperado exigir investigação profunda antes do patch.
---

# Scientific Bug Diagnostics — PetRankings

> **Regra de Ouro:** *Nunca tente adivinhar ou aplicar um patch sem antes construir um feedback loop mínimo e determinístico que reproduza a falha.*

Inspirado nas práticas de engenharia de software de alta disciplina, este runbook estabelece o protocolo científico para diagnosticar e eliminar bugs no ecossistema do **PetRankings** (Next.js 15, Prisma 6, PostgreSQL, Vanilla CSS e APIs assíncronas).

---

## 🛡️ Passo 0: Ofuscação Mandatória de Segredos (Redaction)

Antes de exibir logs, payloads de requisições ou saídas de terminal para análise:
* **Substitua qualquer segredo por `<REDACTED>`:** Chaves como `DATABASE_URL`, `JWT_SECRET`, `ADMIN_GATE_KEY`, cookies de sessão (`petrankings_admin_token`) ou dados sensíveis de contato.
* Nunca rode scripts que imprimam dumps inteiros de variáveis de ambiente sem filtro.

---

## 🔁 Fase 1: Construir o Feedback Loop Mínimo

O trabalho mais importante é criar um sinal binário confiável (**Passa / Falha**) que execute em poucos segundos.

### Estratégias de reprodução por ordem de preferência:

1. **Script de Reprodução em `scratch/` (Node.js / TypeScript):**
   - Crie um arquivo temporário em `scratch/repro_<nome_do_bug>.ts` ou `.js`.
   - Conecte diretamente ao Prisma Client ou à função isolada com dados sintéticos.
   - Execute via PowerShell: `npx tsx scratch/repro_exemplo.ts`.
2. **Teste Automatizado com Vitest:**
   - Adicione um teste unitário ou de integração focado estritamente no caso de borda com falha.
   - Execute: `npm test -- -t "caso específico"`.
3. **Chamada HTTP Local (curl / fetch):**
   - Dispare contra a rota local do dev server (`http://localhost:3000/...`).
   - Inspecione status HTTP e cabeçalhos retornados.
4. **Subagente com Navegador Real (`browser_subagent`):**
   - Para bugs de UI, hidratação React, `beforeunload` ou renderização visual, lance um `browser_subagent` para gravar a sessão e confirmar o erro no DOM/console.

> ⚠️ **Critério de Saída da Fase 1:** Você precisa ter executado **um comando exato** que resulte de forma reprodutível no erro esperado ("Sinal Vermelho"). Sem isso, é proibido alterar o código de produção.

---

## 🔬 Fase 2: Hipótese Falsificável e Bisseção

Com a falha isolada:
1. **Consulte a Linguagem Ubíqua (`GLOSSARY.md`):** Garanta que não há confusão de termos ou conceitos (ex: Matéria Natural vs Matéria Seca, parâmetros assíncronos no Next.js 15).
2. **Consulte os ADRs (`.agents/adr/`):** Verifique se o comportamento que parece estranho não é fruto de uma decisão arquitetural intencional (ex: 404 proposital no painel admin).
3. **Formule uma hipótese única e testável:** *"O erro ocorre porque a propriedade `params` em `src/app/produto/[slug]/page.tsx` não está sendo aguardada como Promise assíncrona."*
4. **Isole o culpado:** Se necessário, utilize `console.error` cirúrgico no script de reprodução para inspecionar tipos e valores intermediários.

---

## 🛠️ Fase 3: Patch Cirúrgico & Validação ("Sinal Verde")

1. **Aplique a correção estritamente no ponto causal:** Não refatore módulos alheios nem misture estilização/features durante a correção de um bug.
2. **Reexecute o feedback loop construído na Fase 1:**
   - O mesmo comando que falhava anteriormente agora deve retornar sucesso (`Exit Code 0`, HTTP 200, ou assert aprovado).
3. **Limpeza de Artefatos:** Remova scripts temporários de `scratch/` que contenham dados de teste transitórios antes de submeter o commit.
4. **Verificação de Regressão Global:** Rode a checagem de tipos e build do projeto para garantir integridade:
   ```powershell
   npm run build
   ```

---

## 📋 Resumo da Disciplina

| Estado | Ação do Agente |
| :--- | :--- |
| **Bug relatado** | Montar reprodução isolada (`scratch/` ou teste). |
| **Erro não reproduzido** | Coletar inputs reais ou parâmetros exatos antes de mexer no código. |
| **Sinal Vermelho obtido** | Diagnosticar a causa raiz usando `GLOSSARY.md` e ADRs. |
| **Patch aplicado** | Executar o feedback loop até obter Sinal Verde. |
| **Conclusão** | Validar build global e registrar aprendizado se foi um bug arquitetural. |
