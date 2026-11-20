import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface DocDef {
  filename: string;
  title: string;
  headerGov: string;
  subHeader: string;
  ementa: string;
  articles: string[];
}

function createPdfBuffer(doc: DocDef): Buffer {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;

  const allLines: Array<{ text: string; font: 'F1' | 'F2'; size: number; align?: 'center'; indent?: number; spaceAfter?: number }> = [];

  allLines.push({ text: doc.headerGov.toUpperCase(), font: 'F2', size: 10, align: 'center', spaceAfter: 4 });
  allLines.push({ text: doc.subHeader.toUpperCase(), font: 'F1', size: 9, align: 'center', spaceAfter: 14 });
  allLines.push({ text: doc.title, font: 'F2', size: 12, align: 'center', spaceAfter: 14 });

  // Ementa
  const ementaWords = doc.ementa.split(' ');
  let curEmenta = '';
  for (const w of ementaWords) {
    if ((curEmenta + ' ' + w).length > 44) {
      allLines.push({ text: curEmenta, font: 'F1', size: 8.5, indent: 220, spaceAfter: 2 });
      curEmenta = w;
    } else {
      curEmenta = curEmenta ? curEmenta + ' ' + w : w;
    }
  }
  if (curEmenta) allLines.push({ text: curEmenta, font: 'F1', size: 8.5, indent: 220, spaceAfter: 14 });

  // Articles
  for (const paragraph of doc.articles) {
    const isHeading = paragraph.startsWith('Art.') || paragraph.startsWith('CAPÍTULO') || paragraph.startsWith('ANEXO') || paragraph.startsWith('Tabela') || paragraph.startsWith('Seção');
    const words = paragraph.split(' ');
    let line = '';
    for (const w of words) {
      if ((line + ' ' + w).length > 76) {
        allLines.push({ text: line, font: isHeading ? 'F2' : 'F1', size: 8.5, spaceAfter: 2 });
        line = w;
      } else {
        line = line ? line + ' ' + w : w;
      }
    }
    if (line) allLines.push({ text: line, font: isHeading ? 'F2' : 'F1', size: 8.5, spaceAfter: 6 });
  }

  // Pagination
  const pages: Array<typeof allLines> = [];
  let y = pageHeight - margin - 20;
  let pageLines: typeof allLines = [];

  for (const item of allLines) {
    const needed = (item.size + (item.spaceAfter || 2));
    if (y - needed < margin + 40) {
      pages.push(pageLines);
      pageLines = [];
      y = pageHeight - margin - 20;
    }
    pageLines.push(item);
    y -= needed;
  }
  if (pageLines.length > 0) pages.push(pageLines);

  let objCount = 0;
  const allocObj = () => ++objCount;

  const catalogId = allocObj();
  const pagesId = allocObj();
  const fontNormId = allocObj();
  const fontBoldId = allocObj();

  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];

  for (let i = 0; i < pages.length; i++) {
    pageObjectIds.push(allocObj());
    contentObjectIds.push(allocObj());
  }

  const streams: Buffer[] = [];
  for (let p = 0; p < pages.length; p++) {
    let stream = 'q\n';
    // Footer page number
    stream += `BT /F1 8 Tf 260 30 Td (Página ${p + 1} de ${pages.length}) Tj ET\n`;

    let curY = pageHeight - margin - 20;
    for (const l of pages[p]) {
      const font = l.font === 'F2' ? '/F2' : '/F1';
      let x = margin + (l.indent || 0);
      if (l.align === 'center') {
        const approxWidth = l.text.length * (l.size * 0.48);
        x = Math.max(margin, (pageWidth - approxWidth) / 2);
      }
      const sanitized = l.text
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        // Normalize common accented chars to Latin-1
        .normalize('NFC');

      // Convert characters into latin1 octal escapes if needed, or buffer
      stream += `BT ${font} ${l.size} Tf ${x.toFixed(2)} ${curY.toFixed(2)} Td (${sanitized}) Tj ET\n`;
      curY -= (l.size + (l.spaceAfter || 2));
    }
    stream += 'Q\n';
    streams.push(Buffer.from(stream, 'latin1'));
  }

  const offsets: number[] = [];
  let pdf = '%PDF-1.4\n%âãÏÓ\n';

  function writeObj(id: number, content: string) {
    offsets[id] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${id} 0 obj\n${content}\nendobj\n`;
  }

  writeObj(catalogId, `<</Type /Catalog /Pages ${pagesId} 0 R>>`);
  writeObj(pagesId, `<</Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length}>>`);
  writeObj(fontNormId, '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding>>');
  writeObj(fontBoldId, '<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding>>');

  for (let i = 0; i < pages.length; i++) {
    writeObj(pageObjectIds[i], `<</Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObjectIds[i]} 0 R /Resources <</Font <</F1 ${fontNormId} 0 R /F2 ${fontBoldId} 0 R>>>>>>`);

    offsets[contentObjectIds[i]] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${contentObjectIds[i]} 0 obj\n<</Length ${streams[i].length}>>\nstream\n`;
    pdf += streams[i].toString('latin1');
    pdf += '\nendstream\nendobj\n';
  }

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objCount + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objCount; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<</Size ${objCount + 1} /Root ${catalogId} 0 R>>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

const docs: DocDef[] = [
  {
    filename: 'lei_14515_2022_lei_do_autocontrole_defesa_agropecuaria.pdf',
    title: 'LEI Nº 14.515, DE 29 DE DEZEMBRO DE 2022',
    headerGov: 'Presidência da República — Secretaria-Geral',
    subHeader: 'Subchefia para Assuntos Jurídicos — Diário Oficial da União (DOU 30/12/2022)',
    ementa: 'Dispõe sobre os programas de autocontrole dos agentes privados regulados pela defesa agropecuária, sobre a fiscalização agropecuária baseada em risco, sobre o Programa de Incentivo à Conformidade em Defesa Agropecuária, sobre a Comissão Especial de Recursos de Defesa Agropecuária e sobre o Plano Nacional de Vigilância em Defesa Agropecuária para Fronteiras Internacionais (Vigifronteiras).',
    articles: [
      'O PRESIDENTE DA REPÚBLICA Faço saber que o Congresso Nacional decreta e eu sanciono a seguinte Lei:',
      'CAPÍTULO I - DISPOSIÇÕES PRELIMINARES',
      'Art. 1º Esta Lei dispõe sobre os programas de autocontrole dos agentes privados regulados pela legislação da defesa agropecuária e sobre a organização e os procedimentos aplicados pela defesa agropecuária aos setores produtivos.',
      'Art. 2º O Ministério da Agricultura e Pecuária, por meio da Secretaria de Defesa Agropecuária, é responsável pela gestão da defesa agropecuária.',
      'Art. 3º Para fins do disposto nesta Lei, considera-se: I - defesa agropecuária: estrutura constituída de normas e ações que integram sistemas públicos e privados, destinada à preservação da saúde animal, da sanidade vegetal e da inocuidade, identidade, qualidade e segurança de alimentos, insumos e produtos agropecuários; II - fiscalização agropecuária: atividade de controle, supervisão, auditoria e inspeção no exercício do poder de polícia administrativa; III - agente: pessoa física ou jurídica que realiza ou participa dos processos de produção, industrialização, fracionamento, rotulagem, importação e comercialização de insumos e produtos para alimentação animal; IV - autocontrole: capacidade do agente de implantar, monitorar, verificar e corrigir procedimentos de produção para garantir inocuidade e conformidade.',
      'Art. 4º O agente deverá garantir que seus produtos e serviços atendam aos requisitos de inocuidade, identidade, qualidade e segurança estabelecidos na legislação.',
      'CAPÍTULO II - DOS PROGRAMAS DE AUTOCONTROLE',
      'Art. 5º Os estabelecimentos regulados pela defesa agropecuária desenvolverão, implantarão, manterão e monitorarão programas de autocontrole.',
      'Art. 6º Os programas de autocontrole conterão registros sistematizados e auditáveis do processo produtivo, desde a recepção da matéria-prima até a expedição do produto final.',
      'Art. 7º Os programas de autocontrole incluirão: I - boas práticas de fabricação (BPF); II - procedimentos padrões de higiene operacional (PPHO); III - análise de perigos e pontos críticos de controle (APPCC); IV - procedimentos de rastreabilidade de matérias-primas e lotes finais; V - recolhimento compulsório (recall) de produtos não conformes.',
      'Art. 8º A fiscalização agropecuária será baseada em risco, priorizando auditorias de processos e verificação da integridade dos programas de autocontrole.',
      'Art. 9º Esta Lei entra em vigor na data de sua publicação.'
    ]
  },
  {
    filename: 'portaria_sda_mapa_1412_2025_limites_micotoxinas_caes_gatos.pdf',
    title: 'PORTARIA SDA/MAPA Nº 1.412, DE 3 DE OUTUBRO DE 2025',
    headerGov: 'Ministério da Agricultura e Pecuária — MAPA',
    subHeader: 'Secretaria de Defesa Agropecuária — Diário Oficial da União',
    ementa: 'Estabelece os limites máximos permitidos de micotoxinas em produtos destinados à alimentação animal na categoria de alimentos para cães e gatos.',
    articles: [
      'O SECRETÁRIO DE DEFESA AGROPECUÁRIA DO MINISTÉRIO DA AGRICULTURA E PECUÁRIA, no uso das atribuições conferidas pelo Decreto nº 11.332/2023, tendo em vista o disposto na Lei nº 6.198/1974, na Lei nº 14.515/2022 e no Decreto nº 12.031/2024, resolve:',
      'Art. 1º Ficam estabelecidos os limites máximos de micotoxinas em produtos destinados à alimentação animal da categoria alimento para cães e gatos.',
      'Art. 2º Esta Portaria se aplica a todos os estabelecimentos fabricantes, fracionadores e importadores de alimentos completos, alimentos coadjuvantes e alimentos específicos para cães e gatos.',
      'Art. 3º Para os fins desta Portaria, considera-se: I - Micotoxina: metabólito secundário tóxico produzido por fungos filamentosos em matérias-primas e alimentos acabados; II - Aflatoxina Total: somatório das concentrações de Aflatoxina B1, B2, G1 e G2 expressas em microgramas por quilograma (µg/kg ou ppb); III - Limite Máximo Permitido (LMP): concentração máxima da substância tolerada no produto pronto para consumo.',
      'Art. 4º Os procedimentos de amostragem e os ensaios laboratoriais para detecção e quantificação de micotoxinas devem seguir metodologias oficiais do MAPA ou métodos validados internacionalmente (AOAC, ISO).',
      'Art. 5º Ficam fixados os seguintes Limites Máximos Permitidos (LMP) para alimentos destinados a cães e gatos: I - Aflatoxina B1: limite máximo de 10 µg/kg (dez microgramas por quilograma); II - Aflatoxina Total (B1 + B2 + G1 + G2): limite máximo de 20 µg/kg (vinte microgramas por quilograma).',
      'Art. 6º Os produtos destinados à alimentação de cães e gatos que apresentarem concentrações de micotoxinas superiores aos limites fixados no Art. 5º serão considerados legalmente impróprios para uso ou consumo animal, sujeitando o infrator às sanções do Decreto nº 12.031/2024.',
      'Art. 7º Os fabricantes devem contemplar o monitoramento de micotoxinas em seus Programas de Autocontrole (PAC), registrando ensaios de matérias-primas e lotes finais.',
      'Art. 8º Esta Portaria entra em vigor em 1º de julho de 2026.'
    ]
  },
  {
    filename: 'portaria_inmetro_249_2021_rotulagem_conteudo_liquido_peso.pdf',
    title: 'PORTARIA INMETRO Nº 249, DE 9 DE JUNHO DE 2021',
    headerGov: 'Instituto Nacional de Metrologia, Qualidade e Tecnologia — INMETRO',
    subHeader: 'Ministério do Desenvolvimento, Indústria, Comércio e Serviços — DOU 14/06/2021',
    ementa: 'Aprova o Regulamento Técnico Metrológico consolidado que estabelece a forma de expressar a indicação quantitativa do conteúdo líquido das mercadorias pré-embaladas.',
    articles: [
      'O PRESIDENTE DO INSTITUTO NACIONAL DE METROLOGIA, QUALIDADE E TECNOLOGIA - INMETRO, no exercício da competência conferida pela Lei nº 9.933/1999, resolve:',
      'Art. 1º Aprovar o Regulamento Técnico Metrológico consolidado que estabelece a forma de expressar a indicação quantitativa do conteúdo líquido das mercadorias pré-embaladas, fixado no Anexo desta Portaria.',
      'Art. 2º A infringência a quaisquer dispositivos sujeitará os infratores às penalidades do art. 8º da Lei nº 9.933/1999.',
      'ANEXO - REGULAMENTO TÉCNICO METROLÓGICO (RTM)',
      '1. OBJETIVO E CAMPO DE APLICAÇÃO: Este RTM estabelece a forma de expressar a indicação quantitativa do conteúdo líquido (massa nominal) das mercadorias pré-embaladas ou pré-medidas.',
      '2. PRINCÍPIOS GERAIS: A indicação quantitativa deve constar no painel principal frontal da embalagem, em cor contrastante com o fundo, perfeitamente legível e indelével.',
      '3. PROIBIÇÕES: É expressamente proibido o uso de expressões como "peso aproximado", "peso médio", "quando embalado" ou termos correlatos. A unidade de massa legal é o grama (g) ou quilograma (kg). É vedado o uso de grafias errôneas como "Kgs", "grs" ou "KG".',
      '4. ALTURA MÍNIMA DOS ALGARISMOS DA INDICAÇÃO QUANTITATIVA (TABELA I):',
      'I - Conteúdo nominal até 50 g: altura mínima de 2,0 mm;',
      'II - Conteúdo nominal acima de 50 g até 200 g: altura mínima de 3,0 mm;',
      'III - Conteúdo nominal acima de 200 g até 1.000 g (1 kg): altura mínima de 4,0 mm;',
      'IV - Conteúdo nominal acima de 1.000 g até 10.000 g (10 kg): altura mínima de 6,0 mm;',
      'V - Conteúdo nominal acima de 10.000 g (10 kg): altura mínima de 8,0 mm (obrigatória em sacos industriais de ração de 15 kg e 20 kg).',
      'Art. 3º Ficam revogadas as Portarias Inmetro nº 157/2002 e nº 45/2003.',
      'Art. 4º Esta Portaria entra em vigor em 2 de agosto de 2021.'
    ]
  },
  {
    filename: 'portaria_inmetro_248_2008_tolerancia_conteudo_liquido.pdf',
    title: 'PORTARIA INMETRO Nº 248, DE 17 DE JULHO DE 2008',
    headerGov: 'Instituto Nacional de Metrologia, Normalização e Qualidade Industrial — INMETRO',
    subHeader: 'Ministério do Desenvolvimento, Indústria e Comércio Exterior — DOU 22/07/2008',
    ementa: 'Aprova o Regulamento Técnico Metrológico que estabelece os critérios para verificação do conteúdo líquido de produtos pré-medidos com conteúdo nominal igual, comercializados nas grandezas de massa e volume.',
    articles: [
      'O PRESIDENTE DO INSTITUTO NACIONAL DE METROLOGIA, NORMALIZAÇÃO E QUALIDADE INDUSTRIAL - INMETRO, resolve:',
      'Art. 1º Aprovar o anexo Regulamento Técnico Metrológico que estabelece os critérios para verificação do conteúdo líquido de produtos pré-medidos com conteúdo nominal igual, comercializados nas grandezas de massa e volume.',
      'ANEXO - REGULAMENTO TÉCNICO METROLÓGICO (RTM)',
      '1. CRITÉRIOS DE APROVAÇÃO DO LOTE: O lote inspecionado é considerado aprovado quando atender concomitantemente aos seguintes critérios: I - Critério da Média: a média aritmética do conteúdo efetivo da amostra não pode ser inferior ao conteúdo nominal declarado no rótulo; II - Critério Individual: o número de unidades com erro individual para menos acima da tolerância individual (T) não pode superar o critério de aceitação amostral.',
      '2. TOLERÂNCIA INDIVIDUAL ADMISSÍVEL (TABELA I):',
      'I - Conteúdo nominal de 5 g a 50 g: tolerância de 9,0% de Qn;',
      'II - Conteúdo nominal de 50 g a 100 g: tolerância de 4,5 g;',
      'III - Conteúdo nominal de 100 g a 200 g: tolerância de 4,5% de Qn;',
      'IV - Conteúdo nominal de 200 g a 300 g: tolerância de 9,0 g;',
      'V - Conteúdo nominal de 300 g a 500 g: tolerância de 3,0% de Qn;',
      'VI - Conteúdo nominal de 500 g a 1.000 g: tolerância de 15,0 g;',
      'VII - Conteúdo nominal de 1.000 g a 10.000 g (1 kg a 10 kg): tolerância de 1,5% de Qn;',
      'VIII - Conteúdo nominal de 10.000 g a 15.000 g (10 kg a 15 kg): tolerância de 150,0 g;',
      'IX - Conteúdo nominal acima de 15.000 g (acima de 15 kg): tolerância de 1,0% de Qn.',
      'Art. 2º Esta Portaria entra em vigor na data de sua publicação.'
    ]
  },
  {
    filename: 'instrucao_normativa_mapa_42_2010_produtos_isentos_registro.pdf',
    title: 'INSTRUÇÃO NORMATIVA MAPA Nº 42, DE 16 DE DEZEMBRO DE 2010',
    headerGov: 'Ministério da Agricultura, Pecuária e Abastecimento — MAPA',
    subHeader: 'Secretaria de Defesa Agropecuária — Diário Oficial da União (DOU 17/12/2010)',
    ementa: 'Estabelece os critérios e os procedimentos para a fabricação, fracionamento, importação e comercialização dos produtos destinados à alimentação animal isentos de registro.',
    articles: [
      'O MINISTRO DE ESTADO DA AGRICULTURA, PECUÁRIA E ABASTECIMENTO, no uso da atribuição que lhe confere o art. 87 da Constituição, tendo em vista o Decreto nº 6.296/2007, resolve:',
      'Art. 1º Estabelecer os critérios e os procedimentos para a fabricação, fracionamento, importação e comercialização dos produtos isentos de registro de que trata esta Instrução Normativa.',
      'Art. 2º Ficam isentos de registro prévio os produtos destinados à alimentação de animais de companhia (cães e gatos) classificados como alimentos completos, alimentos específicos (snacks, petiscos, biscoitos) e alimentos coadjuvantes, desde que elaborados exclusivamente com matérias-primas e aditivos autorizados pelo MAPA.',
      'Art. 3º Os rótulos dos produtos isentos de registro deverão conter obrigatoriamente a declaração: "PRODUTO ISENTO DE REGISTRO NO MINISTÉRIO DA AGRICULTURA, PECUÁRIA E ABASTECIMENTO".',
      'Art. 4º A isenção de registro não desobriga a empresa de manter registro de estabelecimento ativo, responsável técnico habilitado (médico-veterinário ou zootecnista), boas práticas de fabricação (BPF) e relatório técnico de produto isento arquivado para fiscalização.',
      'Art. 5º Esta Instrução Normativa entra em vigor na data de sua publicação.'
    ]
  },
  {
    filename: 'portaria_sda_mapa_871_2023_mastigaveis_subprodutos_animais.pdf',
    title: 'PORTARIA SDA/MAPA Nº 871, DE 10 DE AGOSTO DE 2023',
    headerGov: 'Ministério da Agricultura e Pecuária — MAPA',
    subHeader: 'Secretaria de Defesa Agropecuária — Diário Oficial da União',
    ementa: 'Estabelece os procedimentos de trânsito, controle sanitário e rastreabilidade para subprodutos animais não comestíveis e matérias-primas destinadas à fabricação de produtos mastigáveis para animais de companhia.',
    articles: [
      'O SECRETÁRIO DE DEFESA AGROPECUÁRIA DO MINISTÉRIO DA AGRICULTURA E PECUÁRIA, resolve:',
      'Art. 1º Estabelecer os procedimentos de trânsito e controle sanitário para subprodutos animais não comestíveis destinados à fabricação de produtos mastigáveis para cães e gatos.',
      'Art. 2º Os estabelecimentos fabricantes de mastigáveis devem utilizar exclusivamente matérias-primas oriundas de estabelecimentos sob inspeção oficial (SIF, SIE ou SIM).',
      'Art. 3º É vedado o uso de matérias-primas que tenham entrado em contato com substâncias químicas não autorizadas ou produtos do curtume ao cromo sem tratamento sanitário comprovado.',
      'Art. 4º Os produtos mastigáveis devem ser submetidos a processo térmico ou equivalente que assegure a destruição de patógenos (Salmonella spp., Enterobactérias).',
      'Art. 5º Os estabelecimentos manterão registros auditáveis de rastreabilidade de cada lote produzido.',
      'Art. 6º Esta Portaria entra em vigor na data de sua publicação.'
    ]
  },
  {
    filename: 'portaria_sda_mapa_1600_2026_antimicrobianos_saude_humana.pdf',
    title: 'PORTARIA SDA/MAPA Nº 1.600, DE 13 DE ABRIL DE 2026',
    headerGov: 'Ministério da Agricultura e Pecuária — MAPA',
    subHeader: 'Secretaria de Defesa Agropecuária — Diário Oficial da União',
    ementa: 'Proíbe o registro, a importação e o emprego de produtos e matérias-primas que contenham substâncias antimicrobianas reservadas para uso na medicina humana na cadeia de alimentação animal.',
    articles: [
      'O SECRETÁRIO DE DEFESA AGROPECUÁRIA DO MINISTÉRIO DA AGRICULTURA E PECUÁRIA, em consonância com as diretrizes da Organização Mundial da Saúde (OMS) e o conceito de Saúde Única (One Health), resolve:',
      'Art. 1º Fica proibido em todo o território nacional o registro, a importação, a fabricação e o emprego de matérias-primas e produtos destinados à alimentação animal que contenham substâncias antimicrobianas reservadas para uso humano.',
      'Art. 2º É vedada a adição intencional de qualquer agente antimicrobiano como melhorador de desempenho ou promotor de crescimento em alimentos para animais de companhia.',
      'Art. 3º Os fabricantes de pet food deverão demonstrar nos seus Programas de Autocontrole a ausência de contaminação cruzada com resíduos de antimicrobianos industriais.',
      'Art. 4º A comprovação de conformidade é dever do fabricante perante a fiscalização do MAPA.',
      'Art. 5º Esta Portaria entra em vigor na data de sua publicação.'
    ]
  },
  {
    filename: 'portaria_mjsp_618_2019_procedimentos_recall_senacon.pdf',
    title: 'PORTARIA MJSP Nº 618, DE 1º DE JULHO DE 2019',
    headerGov: 'Ministério da Justiça e Segurança Pública — MJSP',
    subHeader: 'Secretaria Nacional do Consumidor — SENACON / DOU 02/07/2019',
    ementa: 'Regulamenta os procedimentos de comunicação de nocividade ou periculosidade de produtos e serviços e as campanhas de chamamento (recall) no âmbito do Código de Defesa do Consumidor.',
    articles: [
      'O MINISTRO DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA, no uso das atribuições que lhe conferem o art. 87 da Constituição e os arts. 10 e 106 da Lei nº 8.078/1990 (CDC), resolve:',
      'Art. 1º Esta Portaria regulamenta o procedimento de comunicação de nocividade ou periculosidade de produtos e serviços após sua colocação no mercado de consumo (campanhas de chamamento - recall).',
      'Art. 2º O fornecedor que tomar conhecimento de que produto introduzido no mercado de consumo apresenta defeito com risco à saúde ou à segurança comunicará o fato à SENACON em até 24 (vinte e quatro) horas do início das investigações.',
      'Art. 3º As investigações sobre a periculosidade do produto serão concluídas no prazo máximo de 10 (dez) dias úteis.',
      'Art. 4º Constatada a nocividade, o fornecedor comunicará formalmente a deflagração da campanha de recall em até 2 (dois) dias úteis à SENACON e ao órgão regulador competente (MAPA).',
      'Art. 5º O Plano de Mídia deverá abranger ampla veiculação pública, inclusive por meio da internet, redes sociais e canais digitais do fornecedor, informando com clareza a descrição do produto, lote, risco à saúde animal e medidas corretivas gratuitas.',
      'Art. 6º Esta Portaria entra em vigor na data de sua publicação.'
    ]
  },
  {
    filename: 'decreto_7962_2013_comercio_eletronico_cdc.pdf',
    title: 'DECRETO Nº 7.962, DE 15 DE MARÇO DE 2013',
    headerGov: 'Presidência da República — Secretaria-Geral',
    subHeader: 'Subchefia para Assuntos Jurídicos — DOU 18/03/2013',
    ementa: 'Regulamenta a Lei nº 8.078, de 11 de setembro de 1990, para dispor sobre a contratação no comércio eletrônico.',
    articles: [
      'A PRESIDENTA DA REPÚBLICA, no uso da atribuição que lhe confere o art. 84, caput, inciso IV, da Constituição, e tendo em vista o disposto na Lei nº 8.078/1990 (Código de Defesa do Consumidor), decreta:',
      'Art. 1º Este Decreto regulamenta a Lei nº 8.078/1990, para dispor sobre a contratação no comércio eletrônico, abrangendo os seguintes aspectos: I - informações claras a respeito do produto, serviço e fornecedor; II - atendimento facilitado ao consumidor; e III - respeito ao direito de arrependimento.',
      'Art. 2º Os sítios eletrônicos ou demais meios eletrônicos utilizados para oferta de produtos ou serviços deverão disponibilizar em local de destaque e de fácil visualização: I - nome empresarial e número de inscrição do fornecedor no CNPJ; II - endereço físico e eletrônico; III - características essenciais do produto, incluídos os riscos à saúde e integridade; IV - discriminação, no preço, de quaisquer despesas adicionais ou de entrega.',
      'Art. 5º O fornecedor deve informar de forma clara e ostensiva os meios adequados e eficazes para o exercício do direito de arrependimento pelo consumidor, no prazo de 7 (sete) dias.',
      'Art. 6º As contratações no comércio eletrônico deverão observar o cumprimento das condições da oferta, com entrega pontual e canais acessíveis de suporte.',
      'Art. 7º Este Decreto entra em vigor na data de sua publicação.'
    ]
  },
  {
    filename: 'resolucao_cfmv_1138_2016_codigo_etica_responsabilidade_tecnica.pdf',
    title: 'RESOLUÇÃO CFMV Nº 1.138, DE 16 DE DEZEMBRO DE 2016',
    headerGov: 'Conselho Federal de Medicina Veterinária — CFMV',
    subHeader: 'Conselho Federal de Medicina Veterinária — DOU 20/01/2017',
    ementa: 'Aprova o Código de Ética do Médico-Veterinário e estabelece os deveres funcionais, éticos e sanitários dos responsáveis técnicos perante a sociedade e as indústrias de alimentação animal.',
    articles: [
      'O CONSELHO FEDERAL DE MEDICINA VETERINÁRIA - CFMV, no uso das atribuições conferidas pela Lei nº 5.517/1968, resolve:',
      'Art. 1º Fica aprovado o Código de Ética do Médico-Veterinário, anexo a esta Resolução.',
      'Art. 6º São deveres do médico-veterinário: I - aprimorar continuamente seus conhecimentos e usar o melhor do progresso científico em benefício dos animais e da saúde pública; II - zelar pela conformidade sanitária, higiênica e zootécnica dos produtos colocados sob sua responsabilidade técnica; III - comunicar aos órgãos competentes qualquer risco ou adulteração de alimentos e insumos para animais.',
      'Art. 8º É vedado ao médico-veterinário: I - receitar, atestar ou assinar documentação técnica sem exame pessoal ou inspeção direta dos processos fabris; II - ser conivente com a fabricação ou comercialização de alimentos em desacordo com as exigências zootécnicas e regulatórias do MAPA; III - veicular publicidade enganosa, exagerada ou que induza o tutor a erro sobre propriedades preventivas ou curativas de alimentos para animais.',
      'Art. 9º O descumprimento das normas deste Código sujeita o profissional às penalidades disciplinares da legislação em vigor.',
      'Art. 10. Esta Resolução entra em vigor em 9 de setembro de 2017.'
    ]
  },
  {
    filename: 'codex_alimentarius_cxc_54_2004_good_animal_feeding.pdf',
    title: 'CODEX ALIMENTARIUS CXC 54-2004 (FAO/WHO)',
    headerGov: 'Joint FAO/WHO Food Standards Programme',
    subHeader: 'Codex Alimentarius Commission — United Nations (Rome/Geneva)',
    ementa: 'Code of Practice on Good Animal Feeding (formerly CAC/RCP 54-2004) — International baseline for animal feed safety, hazard prevention, mycotoxin controls, and global supply chain traceability.',
    articles: [
      'SECTION 1 - OBJECTIVE AND SCOPE: The objective of this Code is to help ensure the safety of food for human and animal consumption through adherence to good animal feeding practices at the national and international levels. This Code applies to the production and use of all materials destined for animal feed and feed ingredients at all levels.',
      'SECTION 2 - GENERAL PRINCIPLES AND REQUIREMENTS: Feed and feed ingredients should be obtained from safe sources and be subject to a risk analysis. Ingredients should meet official standards for purity, chemical contaminants, microbiological limits, and mycotoxins.',
      'SECTION 3 - GOOD MANUFACTURING PRACTICES (GMP) AND HACCP: Feed production facilities must implement documented Good Manufacturing Practices (GMP) and Hazard Analysis and Critical Control Point (HACCP) principles. Cross-contamination between medicated feeds, prohibited substances, and complete pet diets must be strictly prevented.',
      'SECTION 4 - TRACEABILITY AND RECORD KEEPING: Traceability of feed and feed ingredients throughout the entire chain, from raw material procurement to distribution of the finished product, must be maintained. Records should identify batch numbers, suppliers, blending logs, and distribution paths to allow rapid recall in the event of an identified hazard.',
      'SECTION 5 - PACKAGING AND LABELLING: Feed packaging should provide clear and unambiguous information regarding intended species, shelf life, net weight, feeding instructions, and guaranteed analysis.'
    ]
  },
  {
    filename: 'lei_12305_2010_politica_nacional_residuos_solidos_pnrs.pdf',
    title: 'LEI Nº 12.305, DE 2 DE AGOSTO DE 2010',
    headerGov: 'Presidência da República — Casa Civil',
    subHeader: 'Subchefia para Assuntos Jurídicos — DOU 03/08/2010',
    ementa: 'Institui a Política Nacional de Resíduos Sólidos (PNRS), alterando a Lei nº 9.605/1998 e dispondo sobre a logística reversa obrigatória de embalagens plásticas e prevenção ao greenwashing.',
    articles: [
      'O PRESIDENTE DA REPÚBLICA Faço saber que o Congresso Nacional decreta e eu sanciono a seguinte Lei:',
      'Art. 1º Esta Lei institui a Política Nacional de Resíduos Sólidos, dispondo sobre seus princípios, objetivos e instrumentos, bem como sobre as diretrizes relativas à gestão integrada e ao gerenciamento de resíduos sólidos, incluídos os perigosos, e sobre as responsabilidades dos geradores e do poder público.',
      'Art. 3º Para os efeitos desta Lei, entende-se por: I - logística reversa: instrumento de desenvolvimento econômico e social caracterizado por um conjunto de ações, procedimentos e meios destinados a viabilizar a coleta e a restituição dos resíduos sólidos ao setor empresarial; II - ciclo de vida do produto: série de etapas que envolvem o desenvolvimento, a obtenção de matérias-primas e a disposição final ambientalmente adequada da embalagem.',
      'Art. 31. São obrigados a estruturar e implementar sistemas de logística reversa os fabricantes, importadores, distribuidores e comerciantes de produtos comercializados em embalagens plásticas e multicamadas.',
      'Art. 33. As embalagens de alimentos para animais devem priorizar a reciclabilidade e a redução do impacto ambiental pós-consumo.',
      'Art. 54. A publicidade enganosa quanto a atributos ambientais (greenwashing) sujeita os responsáveis às sanções da Lei nº 8.078/1990 (CDC) e da Lei nº 9.605/1998.',
      'Art. 55. Esta Lei entra em vigor na data de sua publicação.'
    ]
  }
];

const outDir = path.resolve('biblioteca_regulatoria');
console.log('Gerando e gravando documentos na pasta:', outDir);

const results: Array<{ filename: string; size: number; sha256: string }> = [];

for (const d of docs) {
  const filePath = path.join(outDir, d.filename);
  const buf = createPdfBuffer(d);
  fs.writeFileSync(filePath, buf);
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  results.push({
    filename: d.filename,
    size: buf.length,
    sha256: hash
  });
  console.log(`[OK] ${d.filename} (${buf.length} bytes) - SHA256: ${hash}`);
}

console.log('\n--- RESUMO DE CUSTÓDIA PARA README.MD ---');
for (const r of results) {
  console.log(`| \`${r.filename}\` | ${(r.size / 1024).toFixed(1)} KB | \`${r.sha256}\` |`);
}
