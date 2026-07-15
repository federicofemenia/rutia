import { useCallback, useState } from 'react';
import type { Coordinates } from '../../route';
import { getGeolocationErrorMessage } from '../utils/getGeolocationErrorMessage';

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseCurrentLocationResult {
  status: GeolocationStatus;
  coordinates: Coordinates | null;
  errorMessage: string | null;
  requestLocation: () => Promise<Coordinates | null>;
}

export function useCurrentLocation(): UseCurrentLocationResult {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation = useCallback((): Promise<Coordinates | null> => {
    setStatus('loading');
    setErrorMessage(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCoordinates(result);
          setStatus('success');
          resolve(result);
        },
        (error) => {
          setErrorMessage(getGeolocationErrorMessage(error));
          setStatus('error');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
      );
    });
  }, []);

  return { status, coordinates, errorMessage, requestLocation };
}
