# GLOSSARY.md — Linguagem Ubíqua do PetRankings

> Este documento define a terminologia oficial e canônica do **PetRankings**. Todos os agentes, curadores e componentes de software devem utilizar estritamente esta linguagem para garantir coerência técnica, precisão jurídica e concisão.

---

## 🔬 1. Bromatologia & Avaliação Nutricional

**Matéria Natural (MN)**:
A composição percentual do alimento exatamente como ele é comercializado e consumido pelo animal, incluindo sua umidade intrínseca.
_Evitar_: Como alimentado, base úmida, percentual cru.

**Matéria Seca (MS)**:
A composição nutricional do alimento após a remoção matemática total da sua umidade, permitindo a comparação equitativa e direta entre rações secas e úmidas.
_Evitar_: Base desidratada, base anidra.

**Níveis de Garantia**:
Os limites mínimos e máximos de nutrientes declarados obrigatoriamente pelo fabricante na rotulagem oficial conforme regulamentação do MAPA.
_Evitar_: Tabela nutricional comum, fatos nutricionais, composição química estimada.

**Relação Cálcio:Fósforo (Ca:P)**:
A proporção aritmética estequiométrica entre cálcio e fósforo na dieta, crucial para a mineralização óssea correta e prevenção de distúrbios osteoarticulares e renais.
_Evitar_: Balanço mineral geral, índice cálcio-fósforo.

**Extrativos Não Nitrogenados (ENN)**:
A fração residual estimada de carboidratos digeríveis (amido e açúcares), obtida subtraindo-se da Matéria Seca as frações de proteína, gordura, fibra e matéria mineral.
_Evitar_: Carboidratos totais, carboidrato simples, açúcares da ração.

**Energia Metabolizável (EM)**:
A quantidade efetiva de calorias que o organismo do animal consegue absorver e utilizar biologicamente, calculada segundo o NRC (2006) ou FEDIAF.
_Evitar_: Calorias brutas, valor calórico nominal.

**Avaliação Técnica / Confronto Documental**:
O confronto técnico e bromatológico de um produto contra as normas científicas oficiais (ABINPET 11ª Edição, MAPA, NRC, FEDIAF) e fichas oficiais do fabricante.
_Evitar_: Auditoria, sistema de auditoria, extrato auditável, auditoria nutricional, laudo pericial, perícia técnica, laudo pericial independente.

---

## 🏛️ 2. Marco Regulatório & Legislação

**ABINPET 11ª Edição**:
O Manual Pet Food Brasil da Associação Brasileira da Indústria de Produtos para Animais de Estimação, adotado pelo PetRankings como referencial científico e normativo primário para limites nutricionais.
_Evitar_: Tabela ABINPET antiga, normas genéricas.

**MAPA**:
Ministério da Agricultura e Pecuária, autoridade federal reguladora responsável pela fiscalização, registro e atos normativos da alimentação animal no Brasil (Decreto nº 12.031/2024, IN 30/2009, IN 22/2009).
_Evitar_: Ministério da Saúde, ANVISA (para rações).

**Organismo Geneticamente Modificado (OGM / Transgênico)**:
Ingrediente derivado de cultivares transgênicas (milho, soja) aprovadas pela CTNBio, com declaração compulsória do símbolo triangular "T" na rotulagem brasileira.
_Evitar_: Grão modificado, componente biológico alterado.

**Antioxidante Sintético**:
Aditivos químicos conservantes de baixo custo (BHT, BHA, Etoxiquina) utilizados para prevenir rancificação lipídica, auditados criticamente pelo PetRankings por potenciais riscos a longo prazo.
_Evitar_: Químicos da ração, veneno, conservante artificial genérico.

**Antioxidante Natural**:
Aditivos conservantes de origem biológica nobre (concentrado de tocoferóis, extrato de alecrim, ácido cítrico, extrato de chá verde) que preservam o alimento sem risco toxicológico.
_Evitar_: Conservante natural caseiro.

**Claims de Rotulagem**:
Expressões legais de apelo comercial regulamentadas pela IN 22/2009 do MAPA com base na inclusão percentual de ingredientes específicos (ex: `"Sabor..."`, `"Com..."`, `"Rico em..."`).
_Evitar_: Propagandas da ração, frases de marketing avulsas.

---

## 🏷️ 3. Taxonomia de Produtos & Engenharia Editorial

**Nome Comercial (`commercialName`)**:
Identificador oficial de exibição de um produto, estruturado obrigatoriamente pela fórmula canônica: `[Marca] [Linha] [Espécie / Porte] [Fase / Especialidade] [Sabor / Claim Principal] [Formato se Úmido]`.
_Evitar_: Uso de "Ração" no início do nome, pesos/gramaturas no título (ex: 15kg, 85g), símbolos de marca (®, ™).

**Dossiê Técnico**:
A página pública detalhada de um produto (`/produto/[slug]`), contendo numeração lógica de seções (custódia documental, extrato nutricional, níveis MN vs MS, ingredientes em ordem decrescente e ofertas).
_Evitar_: Dossiê pericial, laudo pericial, ficha de venda, página de produto genérica, vitrine.

**Fórmula Bimembre**:
A estrutura ortotipográfica e semântica mandatória para títulos de artigos e estudos (`/guias`), com fórmula `[Gatilho de Busca] : [Dilema do Tutor + Ancoragem Técnica]`, em Sentence Case culta.
_Evitar_: Title Case em inglês (todas as palavras com inicial maiúscula), títulos sensacionalistas, títulos sem dois-pontos.

**Equipe de Curadoria Técnica**:
A assinatura e autoria institucional obrigatória e coletiva de todos os artigos, estudos e análises bromatológicas do PetRankings.
_Evitar_: Autores individuais fictícios, pseudônimos médicos (ex: Dr. Zootecnia, Dra. Veterinária).

---

## 🔒 4. Arquitetura, Segurança & Infraestrutura

**Portão Secreto (`ADMIN_SECRET_GATE_PATH`)**:
A rota dinâmica ofuscada com chave de segurança (`ADMIN_GATE_KEY`) que destrava o cookie assinado `petrankings_admin_gate`.
_Evitar_: Login direto `/admin/login`, tela de login exposta.

**Camuflagem Administrativa**:
Mecanismo de segurança que força retorno estrito de `404 Not Found` para qualquer scanner ou acesso direto a rotas `/admin` sem o cookie do Portão Secreto.
_Evitar_: Redirecionamento 302 para login, 401/403 visíveis.

**Disjuntor Mestre de Produção (`ALLOW_ADMIN_IN_PRODUCTION`)**:
Variável de ambiente booleana mestra que desativa completamente qualquer funcionalidade administrativa no ambiente de produção caso não esteja explicitamente como `"true"`.
_Evitar_: Flag de debug, bypass manual.

**Custódia Documental Oficial**:
O armazenamento íntegro do código-fonte HTML da rotulagem oficial do fabricante do produto, com hash criptográfico SHA-256 gerado no momento da captura.
_Evitar_: Upload de PDFs legados, transcrição manual sem prova, scraping em tempo de execução.

**Guardião `beforeunload`**:
Script de proteção contra perda de dados em formulários administrativos que intercepta navegações acidentais antes da persistência de alterações no catálogo.
_Evitar_: Salvamento automático silencioso sem consentimento.

**Design Tokens**:
Conjunto de variáveis CSS globais semânticas (`--color-primary`, `--bg-surface`, `--font-heading`) que padronizam a identidade visual em Vanilla CSS puro.
_Evitar_: Classes utilitárias do Tailwind CSS, valores hexadecimais soltos hardcoded em componentes.
