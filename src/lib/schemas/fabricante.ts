import { z } from 'zod';

export const fabricanteTicketSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, 'Razão Social da Empresa deve conter pelo menos 2 caracteres.')
    .max(160, 'Razão Social deve ter no máximo 160 caracteres.'),
  cnpj: z
    .string()
    .trim()
    .max(30, 'CNPJ inválido.')
    .nullable()
    .optional(),
  mapaRegistration: z
    .string()
    .trim()
    .max(60, 'Registro no MAPA pode ter no máximo 60 caracteres.')
    .nullable()
    .optional(),
  requesterName: z
    .string()
    .trim()
    .min(2, 'Nome do solicitante deve conter pelo menos 2 caracteres.')
    .max(120, 'Nome do solicitante deve ter no máximo 120 caracteres.'),
  requesterRole: z
    .string()
    .trim()
    .min(2, 'Cargo/Função técnica deve conter pelo menos 2 caracteres.')
    .max(120, 'Cargo/Função técnica deve ter no máximo 120 caracteres.'),
  requesterEmail: z
    .string()
    .trim()
    .email('E-mail institucional inválido.')
    .max(254, 'E-mail deve ter no máximo 254 caracteres.'),
  requesterPhone: z
    .string()
    .trim()
    .max(30, 'Telefone pode ter no máximo 30 caracteres.')
    .nullable()
    .optional(),
  requestType: z
    .enum(['ATUALIZACAO_LOTE', 'RETIFICACAO_DADOS', 'DIVERGENCIA_ANALITICA'])
    .default('ATUALIZACAO_LOTE'),
  batchNumber: z
    .string()
    .trim()
    .max(80, 'Número de lote pode ter no máximo 80 caracteres.')
    .nullable()
    .optional(),
  message: z
    .string()
    .trim()
    .min(10, 'A justificativa técnica deve conter pelo menos 10 caracteres.')
    .max(4000, 'A justificativa técnica deve ter no máximo 4.000 caracteres.'),
  documentUrl: z
    .string()
    .trim()
    .max(500, 'URL do documento muito longa.')
    .refine((val) => !val || val.startsWith('https://') || val.startsWith('/uploads/'), {
      message: 'O link do documento deve ser uma URL segura (https://) ou arquivo arquivado no sistema.',
    })
    .nullable()
    .optional(),
  productSlug: z
    .string()
    .trim()
    .max(160, 'Slug do produto inválido.')
    .nullable()
    .optional(),
});

export type FabricanteTicketInput = z.infer<typeof fabricanteTicketSchema>;
