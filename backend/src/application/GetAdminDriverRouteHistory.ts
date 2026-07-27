import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';
import type { User } from '../domain/User.js';
import type { UserRepository } from '../domain/UserRepository.js';
import { toDriverRouteHistorySummary, type DriverRouteHistorySummary } from './GetDriverRouteHistory.js';

export interface GetAdminDriverRouteHistoryInput {
  driverId: string;
  /** `null` para SUPER_ADMIN (sin scoping por empresa, pero el rol DRIVER se valida igual). */
  requesterCompanyId: string | null;
}

export interface AdminDriverRouteHistory {
  driver: Pick<User, 'id' | 'name' | 'role'>;
  history: DriverRouteHistorySummary[];
}

export class GetAdminDriverRouteHistory {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly routeSessionRepository: RouteSessionRepository,
  ) {}

  async execute({ driverId, requesterCompanyId }: GetAdminDriverRouteHistoryInput): Promise<AdminDriverRouteHistory | null> {
    const driver =
      requesterCompanyId === null
        ? await this.userRepository.findDriverById(driverId)
        : await this.userRepository.findDriverByIdAndCompany(driverId, requesterCompanyId);

    if (!driver) {
      return null;
    }

    const entries = await this.routeSessionRepository.findHistoryByUserId(driver.id);

    return {
      driver: { id: driver.id, name: driver.name, role: driver.role },
      history: entries.map(toDriverRouteHistorySummary),
    };
  }
}
