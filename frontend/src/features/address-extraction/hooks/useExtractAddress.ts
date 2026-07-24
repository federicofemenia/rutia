import { useCallback, useState } from 'react';
import { extractAddress, type ExtractedAddressQuery } from '../api/extractAddress';

export type ExtractAddressStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseExtractAddressResult {
  status: ExtractAddressStatus;
  errorMessage: string | null;
  extract: (imageBase64: string) => Promise<ExtractedAddressQuery | null>;
}

export function useExtractAddress(): UseExtractAddressResult {
  const [status, setStatus] = useState<ExtractAddressStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const extract = useCallback(async (imageBase64: string) => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const result = await extractAddress(imageBase64);
      setStatus('success');
      return result;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error inesperado.');
      setStatus('error');
      return null;
    }
  }, []);

  return { status, errorMessage, extract };
}
