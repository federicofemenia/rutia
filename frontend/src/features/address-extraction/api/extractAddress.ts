import { authFetch } from '../../auth';

export interface ExtractedAddressQuery {
  /** Texto de búsqueda listo para pasarle a Places Autocomplete como valor inicial. */
  query: string;
  /** 0-1, qué tan seguro está el extractor de haber leído la dirección correctamente. */
  confidence: number;
  /** true cuando conviene pedirle al chofer que revise/corrija el texto antes de buscarlo. */
  needsUserConfirmation: boolean;
}

const API_URL = import.meta.env.VITE_API_URL ?? '';
/** Generoso a propósito: incluye margen para un cold-start del backend, no solo la llamada a Gemini. */
const EXTRACT_TIMEOUT_MS = 40000;

export async function extractAddress(imageBase64: string): Promise<ExtractedAddressQuery> {
  let response: Response;

  try {
    response = await authFetch(`${API_URL}/api/addresses/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
      signal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS),
    });
  } catch (error) {
    // Sin esto, un pedido colgado (cold-start del backend, mala señal) nunca resuelve ni
    // rechaza — la pantalla queda pegada en "Leyendo dirección..." para siempre, sin mostrar
    // nunca el error ni el botón de reintentar.
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('La extracción tardó demasiado. Probá de nuevo.');
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error('No se pudo extraer la dirección de la imagen.');
  }

  return (await response.json()) as ExtractedAddressQuery;
}
