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
 * Validação de antispam em 3 camadas de segurança:
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

  const openedTimestamp = typeof formOpenedAt === 'string' ? parseInt(formOpenedAt, 10) : Number(formOpenedAt);
  const now = Date.now();

  if (!openedTimestamp || isNaN(openedTimestamp)) {
    return {
      allowed: false,
      reason: 'Sessão do formulário inválida. Por favor, recarregue a página.',
    };
  }

  // Rejeita timestamp no futuro (manipulação de relógio do bot)
  if (openedTimestamp > now + 5000) {
    return {
      allowed: false,
      reason: 'Horário do formulário inconsistente. Por favor, tente novamente.',
    };
  }

  const timeElapsed = now - openedTimestamp;

  // Rejeita envio muito rápido (< 2.5s)
  if (timeElapsed < 2500) {
    return {
      allowed: false,
      reason: 'O formulário foi enviado rápido demais. Por favor, aguarde alguns instantes e tente novamente.',
    };
  }

  // Rejeita formulário aberto há mais de 2 horas (sessão expirada / replay de bot)
  if (timeElapsed > 2 * 60 * 60 * 1000) {
    return {
      allowed: false,
      reason: 'A sessão deste formulário expirou. Por favor, recarregue a página antes de enviar.',
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
