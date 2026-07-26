import { useEffect, useState } from 'react';
import { fetchCompanyDrivers, type CompanyDriver } from '../api/fetchCompanyDrivers';

const POLL_INTERVAL_MS = 15000;

export type CompanyDriversOverviewStatus = 'loading' | 'success' | 'error';

interface UseCompanyDriversOverviewResult {
  status: CompanyDriversOverviewStatus;
  drivers: CompanyDriver[];
  errorMessage: string | null;
}

/**
 * Sondea la lista de choferes de la empresa — misma estrategia simple que `useDriverTracking`.
 * `enabled` en `false` evita llamar al endpoint (ej. SUPER_ADMIN, que no tiene empresa asociada y
 * para quien `GET /api/company/drivers` siempre devuelve 403).
 */
export function useCompanyDriversOverview(enabled: boolean): UseCompanyDriversOverviewResult {
  const [status, setStatus] = useState<CompanyDriversOverviewStatus>('loading');
  const [drivers, setDrivers] = useState<CompanyDriver[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const result = await fetchCompanyDrivers();
        if (cancelled) {
          return;
        }
        setDrivers(result);
        setStatus('success');
        setErrorMessage(null);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : 'Error inesperado.');
        setStatus('error');
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [enabled]);

  return { status, drivers, errorMessage };
}
