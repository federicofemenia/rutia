import { useCallback, useState } from 'react';
import { retryGeocoding, type GeocodingResolution } from '../api/retryGeocoding';
import type { DeliveryAddress } from '../types';

export type RetryGeocodingStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseRetryGeocodingResult {
  status: RetryGeocodingStatus;
  errorMessage: string | null;
  retry: (address: DeliveryAddress) => Promise<GeocodingResolution | null>;
}

export function useRetryGeocoding(): UseRetryGeocodingResult {
  const [status, setStatus] = useState<RetryGeocodingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const retry = useCallback(async (address: DeliveryAddress) => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const resolution = await retryGeocoding(address);
      setStatus('success');
      return resolution;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error inesperado.');
      setStatus('error');
      return null;
    }
  }, []);

  return { status, errorMessage, retry };
}
