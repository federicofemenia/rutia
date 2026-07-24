import { authFetch } from '../../auth';
import type { Coordinates, DeliveryAddress, GeocodeCandidateOption, GeocodingStatus } from '../types';

export interface GeocodingResolution {
  coordinates?: Coordinates;
  geocodingStatus: GeocodingStatus;
  /** Presente solo cuando hay más de una ubicación empatada, para ofrecérselas al chofer. */
  options?: GeocodeCandidateOption[];
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
