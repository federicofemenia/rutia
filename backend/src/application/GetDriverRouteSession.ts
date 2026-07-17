import type { RouteSession } from '../domain/RouteSession.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';
import type { User } from '../domain/User.js';
import type { UserRepository } from '../domain/UserRepository.js';

export interface DriverRouteSession {
  driver: Pick<User, 'id' | 'name' | 'role'>;
  session: RouteSession | null;
}

export class GetDriverRouteSession {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly routeSessionRepository: RouteSessionRepository,
  ) {}

  async execute(driverName: string): Promise<DriverRouteSession | null> {
    const driver = await this.userRepository.findByName(driverName);

    if (!driver) {
      return null;
    }

    const session = await this.routeSessionRepository.findByUserId(driver.id);

    return { driver: { id: driver.id, name: driver.name, role: driver.role }, session };
  }
}
