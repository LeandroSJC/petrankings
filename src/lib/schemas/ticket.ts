import { z } from 'zod';

export const updateTicketSchema = z.object({
  status: z.enum(['ABERTO', 'EM_ANALISE', 'DEFERIDO', 'INDEFERIDO']),
  internalNotes: z.string().trim().max(4000).nullable().optional(),
});

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
