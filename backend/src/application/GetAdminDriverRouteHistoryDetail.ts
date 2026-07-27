import type { RouteSessionHistoryEntry } from '../domain/RouteSessionHistoryEntry.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';
import type { UserRepository } from '../domain/UserRepository.js';

export interface GetAdminDriverRouteHistoryDetailInput {
  driverId: string;
  entryId: string;
  /** `null` para SUPER_ADMIN (sin scoping por empresa, pero el rol DRIVER se valida igual). */
  requesterCompanyId: string | null;
}

export class GetAdminDriverRouteHistoryDetail {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly routeSessionRepository: RouteSessionRepository,
  ) {}

  async execute({
    driverId,
    entryId,
    requesterCompanyId,
  }: GetAdminDriverRouteHistoryDetailInput): Promise<RouteSessionHistoryEntry | null> {
    const driver =
      requesterCompanyId === null
        ? await this.userRepository.findDriverById(driverId)
        : await this.userRepository.findDriverByIdAndCompany(driverId, requesterCompanyId);

    if (!driver) {
      return null;
    }

    return this.routeSessionRepository.findHistoryEntryById(entryId, driver.id);
  }
}
