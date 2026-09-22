/**
 * Sliding Window In-Memory Rate Limiter.
 * 
 * Implementa controle de taxa por identificador (IP ou chave composta)
 * com janela deslizante de tempo e limpeza automática de registros expirados.
 * 
 * Adequado para proteger endpoints contra abuso, DoS e automação de bots.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private lastCleanup = Date.now();
  private readonly cleanupIntervalMs = 60 * 1000; // Limpeza a cada 60s

  constructor(options: { maxRequests: number; windowMs: number }) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
  }

  /**
   * Verifica se a requisição do identificador é permitida.
   * Retorna { success: true } ou { success: false, retryAfterSeconds }.
   */
  public limit(identifier: string): { success: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    this.maybeCleanup(now);

    let record = this.records.get(identifier);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(identifier, record);
    }

    // Filtra timestamps dentro da janela atual
    const windowStart = now - this.windowMs;
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldestInWindow = record.timestamps[0];
      const resetTime = oldestInWindow + this.windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));
      return { success: false, retryAfterSeconds };
    }

    record.timestamps.push(now);
    return { success: true, retryAfterSeconds: 0 };
  }

  /**
   * Remove entradas obsoletas do mapa para prevenir vazamento de memória.
   */
  private maybeCleanup(now: number) {
    if (now - this.lastCleanup < this.cleanupIntervalMs) return;
    this.lastCleanup = now;

    const windowStart = now - this.windowMs;
    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }
  }
}

/**
 * Utilitário para extrair o melhor IP do cliente a partir dos cabeçalhos da requisição.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Pega o primeiro IP da lista (o cliente original)
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

// Limitadores pré-configurados por rota / risco
// 1. Contato Público: 5 envios a cada 10 minutos por IP
export const contactRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 5,
  windowMs: 10 * 60 * 1000,
});

// 2. Chamados de Fabricantes: 4 envios a cada 15 minutos por IP
export const fabricanteRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 4,
  windowMs: 15 * 60 * 1000,
});

// 3. Busca de Produtos: 40 buscas por minuto por IP (anti-DoS de ILIKE)
export const searchRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 40,
  windowMs: 60 * 1000,
});

// 4. Solicitação de OTP: 5 tentativas a cada 15 minutos por IP
export const otpRequestRateLimiter = new SlidingWindowRateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
});
