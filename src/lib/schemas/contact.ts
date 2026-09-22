import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome deve conter pelo menos 2 caracteres.')
    .max(120, 'O nome deve ter no máximo 120 caracteres.'),
  email: z
    .string()
    .trim()
    .email('Informe um e-mail válido.')
    .max(320, 'O e-mail deve ter no máximo 320 caracteres.'),
  subject: z
    .string()
    .trim()
    .max(160, 'O assunto pode ter no máximo 160 caracteres.')
    .nullable()
    .optional(),
  message: z
    .string()
    .trim()
    .min(10, 'A mensagem deve conter pelo menos 10 caracteres.')
    .max(5000, 'A mensagem deve ter no máximo 5.000 caracteres.'),
  honeypot: z
    .string()
    .optional()
    .default(''),
  formOpenedAt: z
    .union([z.number(), z.string()])
    .optional(),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
