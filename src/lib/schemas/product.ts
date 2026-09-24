import { z } from 'zod';

const safeUrlSchema = z
  .string()
  .trim()
  .refine(
    (val) => !val || /^https?:\/\//i.test(val) || val.startsWith('/uploads/') || val.startsWith('/'),
    {
      message: 'A URL deve utilizar protocolo seguro (https:// ou http://).',
    }
  );

export const affiliateLinkSchema = z.object({
  store: z.string().trim().min(1, 'Nome da loja é obrigatório.').max(80),
  productUrl: z
    .string()
    .trim()
    .min(1, 'URL da loja é obrigatória.')
    .max(1000)
    .refine((val) => /^https?:\/\//i.test(val), {
      message: 'A URL do produto na loja deve começar com https:// ou http://',
    }),
  affiliateUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: 'A URL de afiliado deve começar com https:// ou http://',
    })
    .optional()
    .nullable(),
});

export const productInputSchema = z.object({
  commercialName: z.string().trim().min(2, 'Nome comercial é obrigatório.').max(200),
  brand: z.string().trim().min(1, 'Marca é obrigatória.').max(100),
  manufacturerLegalName: z.string().trim().max(200).optional().default(''),
  legalCategory: z.enum(['ALIMENTO_COMPLETO', 'ALIMENTO_COADJUVANTE', 'ALIMENTO_COMPLEMENTAR']).default('ALIMENTO_COMPLETO'),
  species: z.enum(['CAO', 'GATO', 'CAO_E_GATO']),
  lifeStage: z.enum(['ADULTO', 'CRESCIMENTO_INICIAL', 'CRESCIMENTO_FINAL', 'SENIOR']),
  breedSize: z.string().trim().max(50).default('TODOS'),
  foodType: z.enum(['SECO', 'UMIDO']).default('SECO'),
  coadjuvanteCondition: z.string().trim().max(100).nullable().optional(),

  sourceUrl: safeUrlSchema.default(''),
  sourceArchiveUrl: safeUrlSchema.nullable().optional(),
  sourceDocumentUrl: safeUrlSchema.nullable().optional(),
  analyzedBatch: z.string().trim().max(100).nullable().optional(),
  labelCollectionDate: z.string().or(z.date()).optional(),
  frontLabelImageUrl: safeUrlSchema.nullable().optional(),
  backLabelImageUrl: safeUrlSchema.nullable().optional(),

  moistureMaxPct: z.coerce.number().min(0).max(95).default(10),
  crudeProteinMinPct: z.coerce.number().min(0).max(100).default(0),
  etherExtractMinPct: z.coerce.number().min(0).max(100).default(0),
  crudeFiberMaxPct: z.coerce.number().min(0).max(100).default(0),
  mineralMatterMaxPct: z.coerce.number().min(0).max(100).default(0),
  calciumMinPct: z.coerce.number().min(0).max(50).default(0),
  calciumMaxPct: z.coerce.number().min(0).max(50).nullable().optional(),
  phosphorusMinPct: z.coerce.number().min(0).max(50).default(0),
  sodiumMinPct: z.coerce.number().min(0).max(50).nullable().optional(),
  omega3MinPct: z.coerce.number().min(0).max(50).nullable().optional(),

  id: z.string().trim().max(100).optional(),
  meatClaimType: z.enum(['COM_CARNE', 'COM_CARNE_FRESCA', 'SABOR_CARNE', 'NENHUM']).default('NENHUM'),
  omega3OuPrebioticosGarantidos: z.boolean().default(true),
  claimCarneAdequado: z.boolean().default(true),
  containsGmo: z.coerce.boolean().default(false),
  gmoIngredients: z.string().trim().max(500).nullable().optional(),
  antioxidantType: z.enum(['NATURAL', 'SINTETICO', 'MISTO']).default('NATURAL'),
  topIngredients: z.union([z.string(), z.array(z.string())]),
  editorialOpinion: z.string().trim().max(3000).nullable().optional(),

  slug: z.string().trim().max(200).optional(),
  forceDuplicate: z.boolean().optional(),
  isPublished: z.boolean().default(true),
  affiliateLinks: z.array(affiliateLinkSchema).optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;
