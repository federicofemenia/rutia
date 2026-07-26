import type { RouteSession } from '../domain/RouteSession.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';
import type { User } from '../domain/User.js';
import type { UserRepository } from '../domain/UserRepository.js';

export interface GetDriverRouteSessionInput {
  driverId: string;
  /** `null` para SUPER_ADMIN (sin scoping por empresa, pero el rol DRIVER se valida igual). */
  requesterCompanyId: string | null;
}

export interface DriverRouteSession {
  driver: Pick<User, 'id' | 'name' | 'role'>;
  session: RouteSession | null;
}

export class GetDriverRouteSession {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly routeSessionRepository: RouteSessionRepository,
  ) {}

  async execute({ driverId, requesterCompanyId }: GetDriverRouteSessionInput): Promise<DriverRouteSession | null> {
    const driver =
      requesterCompanyId === null
        ? await this.userRepository.findDriverById(driverId)
        : await this.userRepository.findDriverByIdAndCompany(driverId, requesterCompanyId);

    if (!driver) {
      return null;
    }

    const session = await this.routeSessionRepository.findByUserId(driver.id);

    return { driver: { id: driver.id, name: driver.name, role: driver.role }, session };
  }
}
