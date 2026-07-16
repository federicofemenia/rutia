import type { RouteSession } from '../../route';
import type { PersistenceProvider } from './PersistenceProvider';

const STORAGE_KEY = 'rutia:route-session';
const CURRENT_VERSION = 1;

interface PersistedRouteSession {
  version: number;
  updatedAt: string;
  route: RouteSession;
}

export class SessionStorageProvider implements PersistenceProvider {
  async save(session: RouteSession): Promise<void> {
    const record: PersistedRouteSession = {
      version: CURRENT_VERSION,
      updatedAt: session.updatedAt.toISOString(),
      route: session,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // localStorage puede fallar por cuota excedida o modo privado (Safari) — se degrada a solo memoria.
    }
  }

  async load(): Promise<RouteSession | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const record = JSON.parse(raw) as PersistedRouteSession;

      if (record.version !== CURRENT_VERSION) {
        return null;
      }

      return {
        ...record.route,
        createdAt: new Date(record.route.createdAt),
        updatedAt: new Date(record.route.updatedAt),
      };
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op: si falla borrar, no hay una acción segura adicional que tomar.
    }
  }
}
