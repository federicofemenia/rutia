import type { RouteSession } from '../../route';

export interface PersistenceProvider {
  save(session: RouteSession): Promise<void>;
  load(): Promise<RouteSession | null>;
  clear(): Promise<void>;
}
