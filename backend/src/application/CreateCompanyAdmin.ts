import { randomUUID } from 'node:crypto';
import type { CompanyRepository } from '../domain/CompanyRepository.js';
import { normalizeUsername } from '../domain/normalizeUsername.js';
import { hashPassword } from '../domain/passwordHashing.js';
import { isPasswordValid } from '../domain/passwordPolicy.js';
import type { User } from '../domain/User.js';
import { UserRole } from '../domain/UserRole.js';
import type { UserRepository } from '../domain/UserRepository.js';

export interface CreateCompanyAdminInput {
  companyId: string;
  username: string;
  password: string;
}

export type CreateCompanyAdminFailureReason = 'company-not-found' | 'username-taken' | 'weak-password';

export type CreateCompanyAdminResult =
  | { success: true; user: User }
  | { success: false; reason: CreateCompanyAdminFailureReason };

export class CreateCompanyAdmin {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(input: CreateCompanyAdminInput): Promise<CreateCompanyAdminResult> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      return { success: false, reason: 'company-not-found' };
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
      role: UserRole.CompanyAdmin,
      companyId: company.id,
      passwordHash: hashPassword(input.password),
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.userRepository.create(user);

    return { success: true, user };
  }
}
