import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'petrankings_editorial_jwt_secret_token_2026_super_secure'
);

export const GATE_COOKIE_NAME = 'petrankings_admin_gate';
export const GATE_EXPIRATION_DAYS = 7;

/**
 * Cria um token criptográfico assinado para o cookie do Portão Secreto (Stealth Gatekeeper).
 * Válido por 7 dias.
 */
export async function createGateToken(): Promise<string> {
  return new SignJWT({
    gate: 'unlocked',
    scope: 'admin_stealth_gate',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${GATE_EXPIRATION_DAYS}d`)
    .sign(SECRET_KEY);
}

/**
 * Verifica a validade e integridade criptográfica do token do portão.
 */
export async function verifyGateToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload.gate === 'unlocked' && payload.scope === 'admin_stealth_gate';
  } catch {
    return false;
  }
}
