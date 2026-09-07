import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import {
  GATE_COOKIE_NAME,
  GATE_EXPIRATION_DAYS,
  createGateToken,
  verifyGateToken,
} from './gate';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'petrankings_editorial_jwt_secret_token_2026_super_secure'
);

const TOKEN_COOKIE_NAME = 'petrankings_admin_token';

export interface UserSessionPayload {
  userId: string;
  email: string;
  name?: string | null;
  role: string;
}

export async function createSessionToken(payload: UserSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string | null | undefined,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAdmin(): Promise<UserSessionPayload> {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    throw new Error('Acesso não autorizado');
  }
  return session;
}

export async function hasGateAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(GATE_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyGateToken(token);
}

export {
  TOKEN_COOKIE_NAME,
  GATE_COOKIE_NAME,
  GATE_EXPIRATION_DAYS,
  createGateToken,
  verifyGateToken,
};
