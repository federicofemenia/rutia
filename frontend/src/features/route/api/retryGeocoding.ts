import { authFetch } from '../../auth';
import type { Coordinates, DeliveryAddress, GeocodingStatus } from '../types';

export interface GeocodingResolution {
  coordinates?: Coordinates;
  geocodingStatus: GeocodingStatus;
}

const API_URL = import.meta.env.VITE_API_URL ?? '';

export async function retryGeocoding(address: DeliveryAddress): Promise<GeocodingResolution> {
  const response = await authFetch(`${API_URL}/api/deliveries/geocode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener la ubicación de la dirección.');
  }

  return (await response.json()) as GeocodingResolution;
}
