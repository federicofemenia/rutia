import { useCallback, useState } from 'react';
import type { Delivery } from '../../route';
import { optimizeRoute, type OptimizeRouteParams } from '../api/optimizeRoute';

export type OptimizeRouteStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseOptimizeRouteResult {
  status: OptimizeRouteStatus;
  errorMessage: string | null;
  optimize: (params: OptimizeRouteParams) => Promise<Delivery[] | null>;
}

export function useOptimizeRoute(): UseOptimizeRouteResult {
  const [status, setStatus] = useState<OptimizeRouteStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const optimize = useCallback(async (params: OptimizeRouteParams) => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const result = await optimizeRoute(params);
      setStatus('success');
      return result;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error inesperado.');
      setStatus('error');
      return null;
    }
  }, []);

  return { status, errorMessage, optimize };
}
