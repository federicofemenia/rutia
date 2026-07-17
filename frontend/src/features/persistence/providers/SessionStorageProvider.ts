import type { RouteSession } from '../../route';
import { migratePersistedRouteSession } from '../utils/migrateRouteSession';
import type { PersistenceProvider } from './PersistenceProvider';

const STORAGE_KEY = 'rutia:route-session';
const CURRENT_VERSION = 2;

interface PersistedRouteSession {
  version: number;
  updatedAt: string;
  route: RouteSession;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
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

      const record: unknown = JSON.parse(raw);
      const routeCandidate = isRecord(record) ? record.route : undefined;
      const migrated = migratePersistedRouteSession(routeCandidate);

      if (!migrated) {
        console.warn('RUTIA: se descartó una sesión persistida corrupta o irreconocible. Se inicia una ruta vacía.');
        return null;
      }

      const persistedVersion = isRecord(record) && typeof record.version === 'number' ? record.version : undefined;

      if (migrated.wasLegacy || persistedVersion !== CURRENT_VERSION) {
        // Persiste ya migrada como v2 para no repetir la migración en cada carga.
        await this.save(migrated.session);
      }

      return migrated.session;
    } catch {
      console.warn('RUTIA: no se pudo leer la sesión persistida (JSON inválido). Se inicia una ruta vacía.');
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
