# Especificação Funcional — PetRankings

**Versão de referência:** agosto de 2026  
**Finalidade:** orientar a reprodução do PetRankings com a mesma organização de conteúdo, regras de negócio, comportamentos de interface, operações administrativas e critérios de qualidade, sem vincular a solução a tecnologias, linguagens, bibliotecas, plataformas ou fornecedores específicos.

> **Definição do produto:** PetRankings é um serviço público de comparação de produtos para cães e gatos. Ele organiza produtos semelhantes em rankings por categoria, calcula uma nota média a partir das avaliações disponíveis nas lojas vinculadas e conduz o visitante às respectivas páginas de produto.

---

## 1. Objetivo, público e limites

O objetivo do PetRankings é facilitar uma comparação inicial entre produtos para pets. O visitante deve conseguir encontrar uma categoria, identificar os produtos melhor avaliados, verificar a nota de cada loja participante e abrir a página de produto da loja desejada. O sistema não substitui orientação veterinária, nem deve apresentar os rankings como recomendação absoluta de compra.

O público externo somente consulta o conteúdo. A manutenção de rankings, produtos, avaliações, imagens, lojas e mensagens é responsabilidade exclusiva de administradores autorizados.

| Dentro do escopo | Fora do escopo atual |
|---|---|
| Rankings de produtos para cães e gatos | Venda direta, carrinho ou checkout |
| Cadastro centralizado de produtos | Contas de visitantes e listas de favoritos |
| Lançamento manual de avaliações por loja | Coleta automática de avaliações, preços ou estoque |
| Links de produto e de afiliado opcionais | Comparação de preços e destaque de menor oferta |
| Contato público e caixa de entrada administrativa | Comentários públicos, avaliações de usuários ou depoimentos |
| Espaços publicitários reservados | Publicidade ativa sem identificadores configurados |

### 1.1 Princípios obrigatórios

As informações de avaliação devem ser inseridas e revisadas manualmente. Nenhuma rotina deve consultar lojas automaticamente, substituir dados já cadastrados ou inferir notas e quantidades de avaliações. O produto precisa exibir apenas dados efetivamente registrados pela administração.

Também é proibido criar avaliações, notas, comentários ou depoimentos fictícios para preencher a interface. Produtos sem nota devem permanecer claramente identificáveis como ainda não avaliados, sem dados simulados.

---

## 2. Perfis de acesso

| Perfil | Capacidades |
|---|---|
| Visitante | Navegar por rankings, filtrar categorias, abrir lojas, ampliar imagens, compartilhar recomendação e enviar mensagem de contato |
| Administrador | Criar, editar e publicar rankings; gerir catálogo, lojas, imagens, avaliações e vínculos; ler e classificar contatos |

As páginas administrativas devem exigir autenticação e validar, no lado protegido da aplicação, que o usuário possui papel administrativo. Esconder opções no menu não é uma medida suficiente de autorização.

O acesso administrativo deve ser discreto no site público: um ícone no rodapé, acompanhado de rótulo acessível, sem chamada promocional no cabeçalho.

---

## 3. Taxonomia e organização editorial

Todo produto e todo ranking têm uma espécie e um tipo de produto. A estrutura de navegação recomendada é:

| Nível | Exemplos |
|---|---|
| Espécie | Cães; Gatos |
| Necessidade editorial | Alimentação; Higiene; Lazer e bem-estar |
| Tipo de produto | Ração seca; Areia; Brinquedo; Petisco |
| Perfil, quando aplicável | Adultos; Filhotes; Castrados; Porte específico |

O cadastro atual usa diretamente **espécie** e **tipo de produto**, com títulos editoriais que devem deixar a categoria explícita. Nomes como “Brinquedos para cães” e “Areias para gatos” são preferíveis a rótulos genéricos como “Cães” ou “Gatos”. Quando houver descrição, ela deve usar linguagem objetiva e comparável entre categorias.

### 3.1 Regra de compatibilidade

Um produto só pode ser associado a rankings da mesma espécie e do mesmo tipo de produto. Por exemplo, uma areia para gatos não pode ser incluída em ranking de brinquedos ou de produtos para cães.

---

## 4. Modelo lógico de informações

O modelo abaixo descreve as informações que devem existir independentemente da forma de armazenamento escolhida.

### 4.1 Usuário administrativo

| Informação | Obrigatoriedade | Regra |
|---|---|---|
| Identificador de usuário | Obrigatória | Único por pessoa autenticada |
| Nome | Opcional | Usado para identificação de sessão |
| E-mail | Opcional | Usado para comunicação e identificação |
| Papel de acesso | Obrigatória | `usuário` ou `administrador` |
| Datas de criação, atualização e último acesso | Obrigatórias | Registradas para auditoria operacional |

### 4.2 Ranking

| Informação | Obrigatoriedade | Regra |
|---|---|---|
| Identificador | Obrigatória | Único |
| Endereço amigável | Obrigatória | Único e derivado do título |
| Título | Obrigatória | Entre 3 e 180 caracteres |
| Espécie | Obrigatória | Cães ou gatos |
| Tipo de produto | Obrigatória | Entre 2 e 120 caracteres |
| Descrição | Opcional | Até 3.000 caracteres |
| Publicado | Obrigatória | Somente rankings publicados são públicos |
| Última atualização de dados | Opcional | Atualizada quando uma avaliação de produto vinculado é alterada |
| Datas de criação e atualização | Obrigatórias | Mantidas para rastreabilidade |

### 4.3 Produto de catálogo

| Informação | Obrigatoriedade | Regra |
|---|---|---|
| Identificador | Obrigatória | Único |
| Título | Obrigatória | Entre 3 e 220 caracteres |
| Espécie | Obrigatória | Cães ou gatos |
| Tipo de produto | Obrigatória | Entre 2 e 120 caracteres |
| Marca | Opcional | Até 120 caracteres |
| Descrição | Opcional | Até 3.000 caracteres |
| Imagem | Opcional | Referência segura à imagem enviada pela administração |
| Nota média | Calculada | Não editável diretamente |
| Última atualização de avaliação | Opcional | Alterada após lançamento manual em qualquer loja |
| Datas de criação e atualização | Obrigatórias | Mantidas para rastreabilidade |

### 4.4 Loja vinculada ao produto

Cada produto deve possuir ao menos uma loja. As lojas aceitas são Amazon, Mercado Livre, Petlove, Cobasi e Shopee.

| Informação | Obrigatoriedade | Regra |
|---|---|---|
| Produto vinculado | Obrigatória | Uma loja pertence a um único produto |
| Loja | Obrigatória | Uma ocorrência por produto para cada loja |
| Endereço da página do produto | Obrigatória | Deve corresponder à loja selecionada |
| Endereço de afiliado | Opcional | Quando preenchido, é o destino preferencial do botão público |
| Nota | Opcional | Valor de 0 a 5, lançado manualmente |
| Quantidade de avaliações | Opcional | Número inteiro maior ou igual a zero |
| Datas de criação e atualização | Obrigatórias | Mantidas para rastreabilidade |

### 4.5 Vínculo entre ranking e produto

O produto é uma informação única do catálogo. A participação em ranking é um vínculo independente, permitindo que um produto esteja em nenhum, um ou vários rankings compatíveis. O vínculo não possui posição manual, pois a posição é calculada dinamicamente.

### 4.6 Mensagem de contato

| Informação | Obrigatoriedade | Regra |
|---|---|---|
| Nome | Obrigatória | 2 a 120 caracteres |
| E-mail | Obrigatória | Endereço válido, até 320 caracteres |
| Assunto | Opcional | Até 160 caracteres |
| Mensagem | Obrigatória | 10 a 5.000 caracteres |
| Situação | Obrigatória | Nova, lida ou arquivada |
| Datas de criação e atualização | Obrigatórias | Mantidas para organização da caixa de entrada |

---

## 5. Regras de cálculo, ordenação e atualização

### 5.1 Média das notas

A nota média de um produto considera exclusivamente as notas válidas das lojas vinculadas. A interface pública apresenta o valor com duas casas decimais ou na formatação visual estabelecida, mas a documentação editorial não precisa enfatizar esse detalhe ao visitante.

1. Reunir todas as notas existentes do produto.
2. Descartar valores ausentes ou fora do intervalo de 0 a 5.
3. Calcular a média aritmética das notas restantes.
4. Arredondar o resultado de modo consistente.
5. Se não houver nota válida, não calcular média e posicionar o produto após aqueles avaliados.

### 5.2 Ordem do ranking

| Prioridade | Critério |
|---|---|
| 1 | Maior nota média |
| 2 | Maior soma das quantidades de avaliações disponíveis nas lojas |
| 3 | Produto mais antigo no catálogo |
| 4 | Identificador menor, apenas para estabilidade determinística |

Não deve existir campo para o administrador definir manualmente a posição. A posição deve mudar automaticamente quando uma avaliação for alterada.

### 5.3 Propagação de atualização

Quando uma nota ou quantidade de avaliações é salva em qualquer loja de um produto, o sistema deve recalcular a média do produto, registrar a data da revisão e atualizar a data de dados de todos os rankings aos quais o produto pertence.

### 5.4 Proteção contra exclusão indevida

Um produto com participação ativa em rankings não pode ser excluído do catálogo. A resposta ao administrador deve indicar claramente quais rankings precisam ter o vínculo removido antes da exclusão. Excluir um ranking, por outro lado, remove apenas os vínculos e preserva os produtos cadastrados.

---

## 6. Experiência pública

### 6.1 Navegação principal e rodapé

O cabeçalho público deve conter apenas três destinos: **Início**, **Sobre o PetRankings** e **Contato**. A página ativa deve ter estado visual diferente. Em telas pequenas, a mesma navegação deve aparecer em menu lateral acessível.

O conteúdo metodológico detalhado não deve competir como item próprio no menu. Ele é um tópico interno da página “Sobre o PetRankings”, com destino direto disponível nos chamados contextuais da Home.

O rodapé deve apresentar links para “Sobre o PetRankings”, “Perguntas frequentes” e “Contato”, além do acesso administrativo discreto.

### 6.2 Página inicial

A página inicial deve conter:

1. Apresentação editorial do propósito do serviço, apoiada por mascotes de gato e cachorro.
2. Chamada para consultar rankings e chamada secundária para conhecer a metodologia.
3. Filtros por espécie e tipo de produto.
4. Grade de rankings publicados, com espécie, tipo, título, descrição e acesso ao detalhe.
5. Estado de carregamento, estado vazio e orientações claras.
6. Resumo de metodologia e perguntas frequentes.
7. Espaços publicitários reservados, sem quebrar a leitura.

Os filtros devem mostrar somente rankings publicados. Ao navegar, páginas públicas devem começar no topo; links para tópicos internos devem preservar a rolagem até a seção indicada.

### 6.3 Página “Sobre o PetRankings”

Esta página combina apresentação institucional e metodologia. Sua abertura explica o propósito do serviço, a organização por categoria e o uso responsável das comparações. Uma seção interna intitulada “Como calculamos” deve explicar, em linguagem direta:

* as notas disponíveis nas lojas vinculadas são reunidas;
* a média do produto é calculada a partir dessas notas;
* a maior média aparece primeiro;
* em empate, prevalece o maior volume total de avaliações;
* os links levam às lojas e alguns podem ser afiliados.

### 6.4 Página de ranking

A página de ranking apresenta título, espécie, tipo, descrição e data de atualização. Os produtos aparecem na ordem calculada, com destaque visual de ouro, prata e bronze para as três primeiras posições. O número da posição deve ser o único conteúdo textual do indicador; a cor comunica a classificação.

Cada card de produto deve respeitar a sequência visual abaixo.

| Ordem | Bloco do card | Comportamento |
|---|---|---|
| 1 | Imagem do produto | Fundo branco, ampliação por clique ou toque, indicação visual de interação |
| 2 | Informações do produto | Título, marca quando existente, tags de espécie e tipo abaixo do título, descrição |
| 3 | Nota média e compartilhamento | Rótulo “Nota média” legível e próximo do valor; valor e estrela na mesma linha, com estrela à direita; botão de compartilhar |
| 4 | Orientação de lojas | Mensagem “Escolha uma loja” com ícone de carrinho e destaque discreto |
| 5 | Grade de lojas | Após imagem e descrição, antes da última atualização |
| 6 | Última atualização | Rodapé do card, com data de revisão do produto |

### 6.5 Botões de lojas

Os botões precisam ter dimensões visualmente consistentes e suportar o maior nome de loja, “Mercado Livre”, sem quebra de linha. A grade deve se adaptar à largura disponível: apresenta múltiplas colunas quando houver espaço e reorganiza os botões em telas muito estreitas, sem corte de conteúdo ou rolagem horizontal indesejada.

Cada botão contém, nesta ordem: logotipo oficial, nome da loja em linha única, nota da loja com a estrela após o valor, e a legenda “Visitar loja”. A quantidade de avaliações não é exposta ao visitante.

O botão abre primeiro o endereço de afiliado, quando ele existir; caso contrário, abre a página do produto. Links externos devem ser claramente seguros e não alterar a página atual sem intenção do visitante.

### 6.6 Imagens de produto

As imagens dos cards devem ser contidas, sem ocupar toda a tela em dispositivos móveis. Enquanto uma imagem é carregada, a área exibe uma representação visual de carregamento progressivo. Quando carregada, a foto deve aparecer com transição suave.

Em dispositivos com cursor, aplicar zoom leve durante o hover para indicar que a imagem é interativa. Em dispositivos de toque, manter um indicador de ampliação visível. Todo movimento não essencial deve ser reduzido para visitantes que solicitam menos animação.

Ao abrir a imagem, exibir uma sobreposição responsiva com fundo branco, borda fina e a foto preservando sua proporção. O visitante deve conseguir fechar por botão, tecla de escape e clique fora da área da foto. O foco deve permanecer controlado dentro da sobreposição enquanto ela estiver aberta.

### 6.7 Compartilhamento

Cada card deve oferecer ação de compartilhamento. O texto compartilhado precisa conter, em destaque, o nome do produto e sua nota média, além de uma frase curta de recomendação e do endereço da página do ranking.

Quando o dispositivo não oferecer compartilhamento direto, o sistema deve copiar a mensagem e o endereço, exibindo notificação suave de confirmação. Cancelamentos ou falhas precisam apresentar retorno compreensível, sem interromper a navegação.

### 6.8 Página de contato

O formulário público deve conter nome, e-mail, assunto opcional e mensagem. Após envio válido, mostrar confirmação de recebimento. A página também deve conter contexto sobre o tipo de mensagem esperado e links de orientação no rodapé.

---

## 7. Painel administrativo

### 7.1 Gestão de rankings

A área de rankings administra somente as informações do ranking: título, espécie, tipo de produto, descrição e estado de publicação. A associação de produtos não deve ser feita nessa área, evitando duplicidade de responsabilidade.

O formulário deve informar erros amigáveis, especialmente quando título ou tipo de produto estiverem ausentes. O endereço amigável é gerado a partir do título e não deve exigir preenchimento manual do administrador.

### 7.2 Catálogo de produtos

O catálogo central é a principal área operacional. A lista deve ter filtros por espécie e tipo, além de ordenação por:

| Ordem disponível | Finalidade |
|---|---|
| Última atualização: mais recente | Acompanhar revisões recentes |
| Última atualização: mais antiga | Encontrar produtos que precisam de revisão |
| Sem revisão primeiro | Priorizar itens ainda sem lançamento de dados |
| Nome do produto | Localização alfabética |

Produtos sem revisão ou com mais de 30 dias desde a última atualização devem receber destaque visual, contagem de itens a revisar e mensagem de situação. A lista exibe imagem, título, marca, descrição, espécie, tipo e data de atualização.

### 7.3 Cadastro e edição de produto

O formulário de produto possui título, espécie, tipo, marca opcional, descrição pública opcional, imagem e uma ou mais lojas. Cada loja pode ser ativada ou removida individualmente. Para loja ativada, o endereço da página do produto é obrigatório e o endereço de afiliado é opcional.

Aceitar apenas imagens em formatos de foto compatíveis, com tamanho máximo de 5 MB. A imagem deve ser armazenada fora do cadastro principal e o produto deve guardar uma referência segura para ela.

### 7.4 Vínculos de ranking

Ao selecionar um produto, a administração visualiza os rankings em que ele participa e os rankings compatíveis ainda disponíveis. A inclusão e remoção devem ser operações explícitas, com confirmação quando necessário.

Remover o produto de um ranking o mantém no catálogo. Excluir o produto exige que nenhum vínculo permaneça ativo.

### 7.5 Lançamento manual de avaliações

Para cada loja de um produto, a interface deve apresentar o nome da loja como link externo para a página do produto, nota entre 0 e 5, quantidade opcional de avaliações e botão de salvar. O administrador deve receber retorno claro de sucesso ou falha.

O lançamento de avaliação atualiza automaticamente a média, a ordem pública e as datas de atualização. Não deve existir fluxo ativo de preço, disponibilidade, coleta automática ou tarefa programada.

### 7.6 Caixa de entrada de contato

A caixa de entrada organiza mensagens por situação: todas, não lidas, lidas e arquivadas. Ao abrir uma mensagem nova, ela se torna lida. O administrador deve conseguir alterar a situação manualmente e responder pelo cliente de e-mail configurado no dispositivo.

---

## 8. Antispam, integridade e segurança funcional

O formulário de contato deve aplicar três defesas complementares:

| Proteção | Regra |
|---|---|
| Campo isca | Campo invisível preenchido indica envio automatizado e deve ser ignorado sem revelar a regra |
| Tempo mínimo | Rejeitar submissões feitas em menos de 2,5 segundos após abrir o formulário |
| Limite por e-mail | Rejeitar novo envio do mesmo e-mail por 60 segundos |

Toda operação administrativa precisa ser autorizada. As validações decisivas devem ocorrer na camada protegida do sistema, mesmo que já existam verificações preventivas no formulário. Mensagens de erro devem explicar o próximo passo para o administrador sem mostrar detalhes internos.

Informações de imagens, endereços de lojas, links de afiliado, avaliações e mensagens de contato devem ser preservadas de forma durável e protegida. Segredos de operação e credenciais não podem ser expostos ao visitante.

---

## 9. Publicidade e links de afiliado

O produto possui espaços discretos para publicidade no topo da página inicial, entre conteúdos, dentro ou próximo à página de ranking e antes do rodapé. Quando não houver configuração de publicidade, esses espaços devem apresentar apenas uma reserva visual neutra, sem anúncios simulados.

Links de afiliado são opcionais e não devem alterar a nota, média, ordem ou qualquer destaque editorial de um produto. A existência de um link de afiliado deve ser comunicada de modo transparente na metodologia pública.

---

## 10. Diretrizes visuais, responsivas e de acessibilidade

| Aspecto | Especificação |
|---|---|
| Linguagem visual | Refinada, acolhedora e editorial; não deve parecer um marketplace genérico |
| Paleta | Verde floresta, creme e dourado como cores predominantes |
| Títulos | Serifados e expressivos; textos de interface limpos e legíveis |
| Mascotes | Um gato e um cachorro em estilo editorial tridimensional, usados com moderação |
| Cards | Bordas suaves, cantos arredondados, sombras leves e hierarquia clara |
| Estados vazios | Mensagem útil, ilustração contextual e caminho de retorno |
| Movimento | Curto, discreto e não essencial; deve respeitar preferência de redução de movimento |
| Telas pequenas | Experiência validada a partir de 320 px de largura, sem recortes ou overflow horizontal |
| Foco e teclado | Todo elemento interativo tem foco visível e navegação por teclado |

As tags de espécie e tipo devem permanecer abaixo do título do produto, nunca ocupando a mesma linha de títulos longos. A última atualização deve ser menos dominante que nome, descrição, nota e botões de lojas.

---

## 11. Critérios de aceite

### 11.1 Regras de negócio

- [ ] A média considera apenas notas válidas entre 0 e 5.
- [ ] Rankings ordenam por média e usam total de avaliações como desempate.
- [ ] Não existe posição manual de produto em ranking.
- [ ] Um produto pode integrar vários rankings compatíveis sem duplicar seus dados.
- [ ] Produto vinculado não pode ser excluído sem remover vínculos.
- [ ] Atualização de avaliação altera média e atualiza a data dos rankings relacionados.
- [ ] Não há coleta automática, preço, disponibilidade ou atualização programada de lojas.

### 11.2 Área pública

- [ ] Visitante filtra rankings por espécie e tipo.
- [ ] Somente rankings publicados aparecem publicamente.
- [ ] As notas públicas por loja não mostram quantidade de avaliações.
- [ ] Botões de loja exibem logotipo, nome, nota e chamada de visita de forma estável em telas pequenas.
- [ ] A imagem abre ampliada por clique ou toque e fecha corretamente.
- [ ] O compartilhamento inclui nome do produto e nota média.
- [ ] O fallback de cópia confirma o sucesso com notificação visual.
- [ ] Home, detalhe, orientação e contato possuem navegação e rodapés consistentes.

### 11.3 Área administrativa

- [ ] Apenas administradores podem acessar e operar as funções de gestão.
- [ ] Painel de rankings não gerencia associação de produtos.
- [ ] Catálogo permite criar, editar, filtrar, ordenar e revisar produtos.
- [ ] Catálogo destaca produtos desatualizados após 30 dias.
- [ ] Cada produto possui pelo menos uma loja e não repete a mesma loja.
- [ ] Links de produto são validados conforme a loja escolhida.
- [ ] Caixa de entrada permite leitura, mudança de situação e arquivamento.

### 11.4 Qualidade de interface

- [ ] Sem rolagem horizontal em 320 px.
- [ ] Sem texto invisível por contraste insuficiente.
- [ ] Estados de carregamento, vazio, erro e sucesso são compreensíveis.
- [ ] Animações não interferem em leitura, toque ou navegação por teclado.
- [ ] Conteúdo de avaliação e contato é sempre real, nunca fictício.

---

## 12. Roteiro de reconstrução orientado a resultado

1. Definir papéis de visitante e administrador, incluindo autorização segura para operações de gestão.
2. Criar o modelo lógico de rankings, produtos, lojas, vínculos, contatos e datas de atualização.
3. Implementar média, desempate, compatibilidade de categoria e bloqueio de exclusão como regras centrais.
4. Construir o catálogo administrativo antes da página pública, pois ele é a fonte de conteúdo.
5. Implementar a administração de rankings, separada da gestão de produtos e de seus vínculos.
6. Criar a consulta pública com filtros, páginas de ranking, metodologia, FAQ e contato.
7. Adicionar upload de imagem, botões de lojas, ampliação, compartilhamento e feedbacks de interface.
8. Implementar antispam, caixa de entrada e notificações administrativas.
9. Validar todos os critérios de aceite em tela grande, tela pequena e navegação por teclado.
10. Ativar publicidade somente depois de configurar unidades reais; até lá, manter espaços reservados.

> **Regra estrutural final:** informações descritivas e avaliações pertencem ao produto; a participação pertence ao vínculo com o ranking; a posição é calculada pelo ranking; a visualização pública é uma consequência dessas regras, nunca uma fonte paralela de dados.
