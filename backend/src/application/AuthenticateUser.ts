import { verifyPassword } from '../domain/passwordHashing.js';
import type { TokenService } from '../domain/TokenService.js';
import type { User } from '../domain/User.js';
import type { UserRepository } from '../domain/UserRepository.js';

export interface AuthenticateUserInput {
  name: string;
  password: string;
}

export interface AuthenticateUserResult {
  user: User;
  token: string;
}

export class AuthenticateUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute({ name, password }: AuthenticateUserInput): Promise<AuthenticateUserResult | null> {
    const user = await this.userRepository.findByName(name);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return null;
    }

    const token = this.tokenService.sign({ userId: user.id, role: user.role });
    return { user, token };
  }
}
