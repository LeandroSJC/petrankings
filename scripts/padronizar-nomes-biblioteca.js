const fs = require('fs');
const path = require('path');

const map = {
  // 1. Manuais e Guias Científicos Internacionais & Nacionais
  'Manual Pet Food Brasil - Abinpet.pdf': 'abinpet_manual_pet_food_brasil_11_edicao.pdf',
  'Nutrient Requirements of Dogs and Cats (2006).pdf': 'nrc_2006_nutrient_requirements_of_dogs_and_cats.pdf',
  'FEDIAF-Nutritional-Guidelines_2025-ONLINE.pdf': 'fediaf_nutritional_guidelines_2025.pdf',
  'FINAL_PFC_MBRC_for_Pet_Food_and_Specialty_Pet_Food.pdf': 'aafco_2023_model_regulations_for_pet_food.pdf',
  'Essential cat and dog nutrition booklet V2 - electronic version.pdf': 'waltham_pocket_book_of_essential_dog_and_cat_nutrition.pdf',
  'walthampocketbookofhealthyweightmaintenanceforcatsanddogs.pdf': 'waltham_pocket_book_of_healthy_weight_maintenance.pdf',
  'walthampocketbookofpuppynutritionandcare.pdf': 'waltham_pocket_book_of_puppy_nutrition_and_care.pdf',
  'WSAVA-Nutrition-Assessment-Guidelines-2011-JSAP.pdf': 'wsava_nutrition_assessment_guidelines_2011.pdf',
  'Selecting-a-pet-food-for-your-pet-updated-2021_WSAVA-Global-Nutrition-Toolkit.pdf': 'wsava_selecionar_alimento_pet_guia_tutores_2021.pdf',

  // 2. Leis Federais
  'lei-no-6-198-de-26-de-dezembro-de-1974.pdf': 'lei_6198_1974_inspecao_fiscalizacao_alimentacao_animal.pdf',
  'lei-8078-11-setembro-1990-365086-normaatualizada-pl.pdf': 'lei_8078_1990_codigo_defesa_consumidor.pdf',
  'lei-no-10-831-de-23-de-dezembro-de-2003.pdf': 'lei_10831_2003_agricultura_organica.pdf',
  'Lei Sansão - Lei Federal nº 14.064-2020.pdf': 'lei_14064_2020_lei_sansao_protecao_caes_gatos.pdf',

  // 3. Decretos Federais
  'decreto-no-4-680-de-24-de-abril-de-2003.pdf': 'decreto_4680_2003_rotulagem_transgenicos.pdf',
  'decreto-12031-28-maio-2024-795694-normaatualizada-pe.pdf': 'decreto_12031_2024_inspecao_fiscalizacao_alimentacao_animal.pdf',

  // 4. Instruções Normativas MAPA
  'InstruoNormativa04.2007.pdf': 'instrucao_normativa_mapa_04_2007_bpf_fabricacao.pdf',
  'instrucao-normativa-no-34-de-28-de-maio-de-2008.pdf': 'instrucao_normativa_mapa_34_2008_residuos_farinhas_animais.pdf',
  'instrucao-normativa-no-22-de-2-de-junho-de-2009.pdf': 'instrucao_normativa_mapa_22_2009_bpf_ingredientes.pdf',
  'instrucao-normativa-no-26-de-9-de-julho-de-2009.pdf': 'instrucao_normativa_mapa_26_2009_antimicrobianos_veterinarios.pdf',
  'instrucao-normativa-no-30-de-5-de-agosto-de-2009.pdf': 'instrucao_normativa_mapa_30_2009_rotulagem_alimentos_animais.pdf',
  'instrucao-normativa-no-29-de-14-de-setembro-de.pdf': 'instrucao_normativa_mapa_29_2010_importacao_alimentacao_animal.pdf',
  'Instrução Normativa MAPA nº 07-2011.pdf': 'instrucao_normativa_mapa_07_2011_requisitos_fitossanitarios.pdf',
  'instrucao-normativa-no-17-de-18-de-junho-de-2014.pdf': 'instrucao_normativa_mapa_17_2014_organicos_alimentacao_animal.pdf',
  'instrucao-normativa-no-39-de-21-de-novembro-de.pdf': 'instrucao_normativa_mapa_39_2014_rotulos_representacoes_graficas.pdf',
  'INSTRUCAONORMATIVAN17DE15DEABRILDE2020alteradaIN6010julho2020.pdf': 'instrucao_normativa_mapa_17_2020_importacao_alimentacao_animal.pdf',
  'in_110-2020_lista_matérias-primas_autorizadas_aa.pdf': 'instrucao_normativa_mapa_110_2020_catalogo_materias_primas.pdf',

  // 5. Portarias MAPA & MJ
  'portaria-no-2-658-de-22-de-dezembro-de-2003.pdf': 'portaria_mj_2658_2003_simbolo_transgenico_t.pdf',
  'PORTARIA Nº 359, DE 9 DE JULHO DE 2021.pdf': 'portaria_mapa_359_2021_materias_primas_alimentacao_animal.pdf',
  'Port6642022RTIQcarnemoda1.pdf': 'portaria_mapa_1076_2024_rtiq_carne_moida.pdf',

  // 6. Catálogos e Listas Oficiais do MAPA
  'Anexo 1 - LISTA DE INGREDIENTES E VEÍCULOS AUTORIZADOS PELO MAPA PARA USO NA ALIMENTAÇÃO ANIMAL NO BRASIL.pdf': 'mapa_lista_ingredientes_veiculos_autorizados.pdf',
  'Lista de substâncias proibidas e legislação correspondente.pdf': 'mapa_lista_substancias_proibidas_alimentacao_animal.pdf',

  // 7. Resoluções Anvisa, CTNBio e CFMV
  'Instrução Normativa ANVISA 2022_160.pdf': 'instrucao_normativa_anvisa_160_2022_aditivos_alimentares.pdf',
  'Resolução Normativa CTNBio 32_2021.pdf': 'resolucao_ctnbio_32_2021_rotulagem_ogm.pdf',
  'reso-CFMV-1236_2018.pdf': 'resolucao_cfmv_1236_2018_crueldade_abuso_maus_tratos.pdf'
};

const dir = path.resolve(__dirname, '../biblioteca_regulatoria');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));

console.log('Verificando cobertura do mapeamento...');
let allMapped = true;
for (const f of files) {
  if (!map[f]) {
    console.log('NÃO MAPEADO:', f);
    allMapped = false;
  }
}

if (allMapped) {
  console.log(`Todos os ${files.length} PDFs estão perfeitamente mapeados!`);
  for (const [oldName, newName] of Object.entries(map)) {
    const oldPath = path.join(dir, oldName);
    const newPath = path.join(dir, newName);
    if (oldPath !== newPath && fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`Renomeado: ${oldName} -> ${newName}`);
    }
  }
  console.log('Padronização concluída com sucesso!');
} else {
  console.error('Abortando renomeação devido a arquivos não mapeados.');
}
