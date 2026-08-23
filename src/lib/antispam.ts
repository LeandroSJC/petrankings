import prisma from './prisma';

export interface AntispamValidationParams {
  honeypot?: string;
  formOpenedAt?: number | string;
  email: string;
}

export interface AntispamResult {
  allowed: boolean;
  reason?: string;
  isSilentDrop?: boolean; // Para honeypot: rejeita sem revelar a regra
}

/**
 * Validação de antispam em 3 camadas conforme a Seção 8 da Especificação:
 * 1. Campo isca (Honeypot): ignorado silenciosamente se preenchido.
 * 2. Tempo mínimo: rejeitar se enviado em menos de 2.500 ms (2,5s).
 * 3. Limite por e-mail: rejeitar novo envio do mesmo e-mail nos últimos 60 segundos.
 */
export async function validateContactAntispam(params: AntispamValidationParams): Promise<AntispamResult> {
  const { honeypot, formOpenedAt, email } = params;

  // 1. Campo isca (Honeypot)
  if (honeypot && honeypot.trim().length > 0) {
    return {
      allowed: false,
      reason: 'Envio ignorado',
      isSilentDrop: true,
    };
  }

  // 2. Tempo mínimo de interação (2.5 segundos = 2500ms)
  if (!formOpenedAt) {
    return {
      allowed: false,
      reason: 'Envio inválido. Por favor, tente novamente.',
    };
  }

  const openedTimestamp = typeof formOpenedAt === 'string' ? parseInt(formOpenedAt, 10) : formOpenedAt;
  const now = Date.now();
  const timeElapsed = now - openedTimestamp;

  if (isNaN(openedTimestamp) || timeElapsed < 2500) {
    return {
      allowed: false,
      reason: 'O formulário foi enviado rápido demais. Por favor, aguarde alguns instantes e tente novamente.',
    };
  }

  // 3. Limite por e-mail (60 segundos)
  const normalizedEmail = email.trim().toLowerCase();
  const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);

  const recentSubmission = await prisma.contactRateLimit.findFirst({
    where: {
      email: normalizedEmail,
      createdAt: { gte: sixtySecondsAgo },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentSubmission) {
    return {
      allowed: false,
      reason: 'Você já enviou uma mensagem recentemente. Por favor, aguarde 60 segundos antes de enviar outra mensagem.',
    };
  }

  // Registrar a tentativa de envio para controle de taxa
  await prisma.contactRateLimit.create({
    data: {
      email: normalizedEmail,
    },
  });

  // Limpeza assíncrona opcional de registros antigos de rate limit (> 1 hora)
  prisma.contactRateLimit
    .deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) },
      },
    })
    .catch(() => {});

  return { allowed: true };
}
