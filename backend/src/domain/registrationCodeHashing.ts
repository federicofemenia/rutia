import { createHmac } from 'node:crypto';

/**
 * El código de registro es un token aleatorio de alta entropía (ver `generateRegistrationCode`),
 * no un secreto de baja entropía elegido por una persona — a diferencia de las contraseñas
 * (`passwordHashing.ts`, que usa scrypt lento a propósito), acá un hash rápido y determinístico
 * es lo correcto: permite `WHERE registration_code_hash = ?` indexado en vez de iterar y comparar
 * contra cada empresa. HMAC (no SHA-256 a secas) para que el hash no sea reproducible sin el
 * secreto del server.
 */
export function normalizeRegistrationCode(code: string): string {
  return code.trim();
}

export function hashRegistrationCode(code: string, secret: string): string {
  return createHmac('sha256', secret).update(normalizeRegistrationCode(code)).digest('hex');
}
