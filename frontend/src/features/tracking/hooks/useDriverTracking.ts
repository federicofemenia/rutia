import { useEffect, useState } from 'react';
import { fetchDriverRouteSession, type DriverRouteSession } from '../api/fetchDriverRouteSession';

const POLL_INTERVAL_MS = 5000;

export type DriverTrackingStatus = 'loading' | 'success' | 'error';

interface UseDriverTrackingResult {
  status: DriverTrackingStatus;
  data: DriverRouteSession | null;
  errorMessage: string | null;
}

/**
 * Sondea la ruta de un chofer cada `POLL_INTERVAL_MS` — "tiempo real" simple por polling, sin
 * infraestructura de WebSockets (decisión ya tomada para el MVP). Conserva el último dato bueno
 * en pantalla si un sondeo puntual falla, en vez de vaciar la lista.
 */
export function useDriverTracking(driverName: string): UseDriverTrackingResult {
  const [status, setStatus] = useState<DriverTrackingStatus>('loading');
  const [data, setData] = useState<DriverRouteSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setData(null);
    setErrorMessage(null);

    async function poll() {
      try {
        const result = await fetchDriverRouteSession(driverName);
        if (cancelled) {
          return;
        }
        setData(result);
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
  }, [driverName]);

  return { status, data, errorMessage };
}
