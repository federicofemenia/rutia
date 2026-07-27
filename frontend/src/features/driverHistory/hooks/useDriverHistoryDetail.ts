import { useEffect, useRef, useState } from 'react';
import { fetchDriverHistoryDetail } from '../api/fetchDriverHistoryDetail';
import type { DriverHistoryDetail } from '../types';

export type DriverHistoryDetailStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseDriverHistoryDetailResult {
  status: DriverHistoryDetailStatus;
  detail: DriverHistoryDetail | null;
  errorMessage: string | null;
}

/**
 * Carga el detalle solo cuando `shouldLoad` es true (el Accordion ya se expandió al menos una
 * vez) — nunca antes, para no traer `deliveries[]` de todo el histórico de una. Una vez cargado
 * con éxito, `loadedRef` evita repetir el fetch si se vuelve a expandir el mismo Accordion.
 */
/** Sin `driverId`: el propio historial del chofer autenticado. Con `driverId`: vista de admin sobre ese chofer. */
export function useDriverHistoryDetail(id: string, shouldLoad: boolean, driverId?: string): UseDriverHistoryDetailResult {
  const [status, setStatus] = useState<DriverHistoryDetailStatus>('idle');
  const [detail, setDetail] = useState<DriverHistoryDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!shouldLoad || loadedRef.current) {
      return;
    }

    let cancelled = false;
    setStatus('loading');

    async function load() {
      try {
        const result = await fetchDriverHistoryDetail(id, driverId);
        if (cancelled) {
          return;
        }
        loadedRef.current = true;
        setDetail(result);
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
  }, [id, shouldLoad, driverId]);

  return { status, detail, errorMessage };
}
