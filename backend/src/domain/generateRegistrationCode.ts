import { randomBytes } from 'node:crypto';

const CODE_BYTE_LENGTH = 10;

export function generateRegistrationCode(): string {
  return randomBytes(CODE_BYTE_LENGTH).toString('base64url');
}
