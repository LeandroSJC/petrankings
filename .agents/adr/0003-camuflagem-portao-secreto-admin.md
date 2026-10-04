# 0003: Camuflagem Stealth e Portão Secreto do Painel Administrativo

* **Status:** Aceito
* **Data:** 2026-09-22
* **Contexto:** Painéis administrativos expostos em `/admin` ou `/login` são alvos constantes de ataques de força bruta, bots automatizados e enumeração de vulnerabilidades. Exibir telas públicas de login ou retornar HTTP 401/403 confirma a existência do painel para agentes hostis.
* **Decisão:** Implementamos camuflagem total em camadas: qualquer acesso direto a `/admin`, `/admin/*` ou `/api/auth/login` retorna estritamente `404 Not Found`. O painel só se torna acessível mediante passagem prévia pelo Portão Secreto (`ADMIN_SECRET_GATE_PATH` com `ADMIN_GATE_KEY`), que emite um cookie assinado criptograficamente (`petrankings_admin_gate`). Em produção, a flag `ALLOW_ADMIN_IN_PRODUCTION="true"` atua como disjuntor mestre físico.
* **Consequências:** Zero ruído de scanners externos na aplicação, ausência de superfícies públicas óbvias de ataque e blindagem da área administrativa mesmo em caso de vazamento isolado de rotas comuns.
