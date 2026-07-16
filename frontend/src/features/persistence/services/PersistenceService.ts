import type { RouteSession } from '../../route';
import type { PersistenceProvider } from '../providers/PersistenceProvider';

export class PersistenceService {
  private readonly provider: PersistenceProvider;

  constructor(provider: PersistenceProvider) {
    this.provider = provider;
  }

  saveRoute(session: RouteSession): Promise<void> {
    return this.provider.save(session);
  }

  loadRoute(): Promise<RouteSession | null> {
    return this.provider.load();
  }

  clearRoute(): Promise<void> {
    return this.provider.clear();
  }
}
