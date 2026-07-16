import { useCallback } from 'react';
import type { RouteSession } from '../../route';
import { SessionStorageProvider } from '../providers/SessionStorageProvider';
import { PersistenceService } from '../services/PersistenceService';

const persistenceService = new PersistenceService(new SessionStorageProvider());

interface UsePersistenceResult {
  saveRoute: (session: RouteSession) => Promise<void>;
  loadRoute: () => Promise<RouteSession | null>;
  clearRoute: () => Promise<void>;
}

export function usePersistence(): UsePersistenceResult {
  const saveRoute = useCallback((session: RouteSession) => persistenceService.saveRoute(session), []);
  const loadRoute = useCallback(() => persistenceService.loadRoute(), []);
  const clearRoute = useCallback(() => persistenceService.clearRoute(), []);

  return { saveRoute, loadRoute, clearRoute };
}
