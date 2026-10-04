# 0002: Vanilla CSS Puro com Design Tokens e Proibição de Tailwind CSS

* **Status:** Aceito
* **Data:** 2026-09-15
* **Contexto:** Frameworks como Tailwind CSS geram alto ruído semântico no JSX, poluem o DOM com dezenas de classes utilitárias efêmeras, complicam refatorações globais em larga escala e geram conflitos com micro-interações customizadas e renderização server-side no Next.js 15.
* **Decisão:** O PetRankings adota estritamente Vanilla CSS com variáveis de Design Tokens (`var(--color-primary)`, `var(--bg-surface)`, etc.) em arquivos `.css` modulares e semânticos. É expressamente vedado o uso de utilitários de Tailwind CSS em qualquer parte do projeto.
* **Consequências:** Estilos 100% desacoplados da lógica React, zero runtime de CSS-in-JS, total controle sobre a hierarquia em cascata, performance máxima de renderização sem purga e integridade visual estável entre deploys.
