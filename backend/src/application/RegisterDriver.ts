import { randomUUID } from 'node:crypto';
import type { CompanyRepository } from '../domain/CompanyRepository.js';
import { normalizeUsername } from '../domain/normalizeUsername.js';
import { hashPassword } from '../domain/passwordHashing.js';
import { isPasswordValid } from '../domain/passwordPolicy.js';
import type { TokenService } from '../domain/TokenService.js';
import type { User } from '../domain/User.js';
import { UserRole } from '../domain/UserRole.js';
import type { UserRepository } from '../domain/UserRepository.js';

/**
 * A propósito, la única forma de construir este input: no existe manera de que un caller le pase
 * `role`, `companyId`, `active` ni `passwordHash` — el rol siempre es DRIVER y la empresa siempre
 * sale de `registrationToken`, nunca de lo que mande el cliente.
 */
export interface RegisterDriverInput {
  username: string;
  password: string;
  passwordConfirmation: string;
  registrationToken: string;
}

export type RegisterDriverFailureReason =
  | 'invalid-registration-token'
  | 'company-unavailable'
  | 'password-mismatch'
  | 'weak-password'
  | 'username-taken';

export type RegisterDriverResult =
  | { success: true; token: string; user: User; companyName: string }
  | { success: false; reason: RegisterDriverFailureReason };

export class RegisterDriver {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: RegisterDriverInput): Promise<RegisterDriverResult> {
    // El token de registro se revalida acá server-side en cada llamada — nunca se confía en que
    // el paso 1 (validar código) siga siendo cierto por sí solo.
    const tokenPayload = this.tokenService.verify(input.registrationToken);
    if (!tokenPayload || tokenPayload.purpose !== 'driver-registration') {
      return { success: false, reason: 'invalid-registration-token' };
    }

    const company = await this.companyRepository.findById(tokenPayload.companyId);
    if (!company || !company.active || !company.registrationEnabled) {
      return { success: false, reason: 'company-unavailable' };
    }

    if (input.password !== input.passwordConfirmation) {
      return { success: false, reason: 'password-mismatch' };
    }

    if (!isPasswordValid(input.password)) {
      return { success: false, reason: 'weak-password' };
    }

    const username = normalizeUsername(input.username);
    const existing = await this.userRepository.findByName(username);
    if (existing) {
      return { success: false, reason: 'username-taken' };
    }

    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      name: username,
      role: UserRole.Driver,
      companyId: company.id,
      passwordHash: hashPassword(input.password),
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.userRepository.create(user);

    const token = this.tokenService.sign({
      purpose: 'session',
      userId: user.id,
      role: user.role,
      companyId: user.companyId,
    });

    return { success: true, token, user, companyName: company.name };
  }
}
