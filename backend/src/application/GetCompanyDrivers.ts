import { DeliveryStatus } from '../domain/DeliveryStatus.js';
import type { RouteSessionRepository } from '../domain/RouteSessionRepository.js';
import type { User } from '../domain/User.js';
import type { UserRepository } from '../domain/UserRepository.js';

export interface CompanyDriverOverview {
  driver: User;
  /** `true` si la última sesión guardada tiene entregas sin resolver (pending/inProgress). */
  hasActiveRoute: boolean;
}

const UNRESOLVED_STATUSES: DeliveryStatus[] = [DeliveryStatus.Pending, DeliveryStatus.InProgress];

export class GetCompanyDrivers {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly routeSessionRepository: RouteSessionRepository,
  ) {}

  async execute(companyId: string): Promise<CompanyDriverOverview[]> {
    const drivers = await this.userRepository.listDriversByCompany(companyId);

    return Promise.all(
      drivers.map(async (driver) => {
        const session = await this.routeSessionRepository.findByUserId(driver.id);
        const hasActiveRoute =
          session?.deliveries.some((delivery) => delivery.status && UNRESOLVED_STATUSES.includes(delivery.status)) ??
          false;

        return { driver, hasActiveRoute };
      }),
    );
  }
}
