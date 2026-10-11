# Scripts Históricos Arquivados (One-Off Migrations & Patches)

Esta pasta contém scripts de correções pontuais, patches pontuais de dados e migrações que já foram executados com sucesso em ciclos anteriores do banco de dados.

Eles são mantidos aqui para fins de rastreabilidade e histórico probatório, evitando poluir o diretório principal `scripts/`.

### Conteúdo Arquivado:
- **`aplicar-ajustes-dois-produtos.ts`**: Ajuste manual de dois produtos PremieR/GoldeN.
- **`atualizar-imagens-prohealth.ts`**: Atualização pontual das fotos da linha Pro Health.
- **`check-broken-images.ts` / `fix-broken-images.ts`**: Protótipos preliminares (substituídos por `auditar-e-reparar-imagens.ts`).
- **`executar-recalculo-com-tunel.ts`**: Wrapper pontual de túnel SSH para o recálculo de cálcio.
- **`fix-friskies-and-internal-racao.js`**: Remoção residual da palavra "Ração" em nomes comerciais de sachês.
- **`fix-promotional-names.js`**: Correção de nomes com claims promocionais em lote.
- **`iniciar-tunel.bat`**: Script batch do Windows (substituído pelo comando `npm run tunel`).
- **`recalcular-proplan.ts` / `recalcular-vitta.ts`**: Recálculo pontual de marcas específicas.
- **`revisar-qualiday-transgenicos.ts`**: Verificação documental de transgênicos da Qualiday.
- **`revisar-science-diet-definitivo.ts`**: Revisão e recálculo das garantias da Hill's Science Diet.
- **`update-commercial-names.js`**: Atualização legada de nomenclaturas comerciais.
