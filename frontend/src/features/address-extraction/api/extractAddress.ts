import { authFetch } from '../../auth';
import type { DeliveryAddress } from '../../route';

export type ExtractedAddress = DeliveryAddress;
const API_URL = import.meta.env.VITE_API_URL ?? '';
export async function extractAddress(imageBase64: string): Promise<ExtractedAddress> {
  const response = await authFetch(`${API_URL}/api/addresses/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
  });

  if (!response.ok) {
    throw new Error('No se pudo extraer la dirección de la imagen.');
  }

  return (await response.json()) as ExtractedAddress;
}
