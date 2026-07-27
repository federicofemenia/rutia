import { useEffect, useState } from 'react';
import { fetchDriverHistory } from '../api/fetchDriverHistory';
import type { DriverHistorySummary } from '../types';

export type DriverHistoryStatus = 'loading' | 'success' | 'error';

interface UseDriverHistoryResult {
  status: DriverHistoryStatus;
  history: DriverHistorySummary[];
  errorMessage: string | null;
}

/** Sin `driverId`: el propio historial del chofer autenticado. Con `driverId`: vista de admin sobre ese chofer. */
export function useDriverHistory(driverId?: string): UseDriverHistoryResult {
  const [status, setStatus] = useState<DriverHistoryStatus>('loading');
  const [history, setHistory] = useState<DriverHistorySummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    async function load() {
      try {
        const result = await fetchDriverHistory(driverId);
        if (cancelled) {
          return;
        }
        setHistory(result);
        setStatus('success');
      } catch (error) {
        if (cancelled) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : 'Error inesperado.');
        setStatus('error');
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [driverId]);

  return { status, history, errorMessage };
}
