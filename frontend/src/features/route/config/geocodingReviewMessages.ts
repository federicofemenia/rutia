import { GeocodingStatus } from '../types';

/**
 * Explicación para el chofer de por qué una entrega no está lista para optimizar. Compartido
 * entre `DeliveryListItem` (ícono de alerta en la lista) y `DeliveryActionsSheet` (resultado del
 * reintento manual de ubicación) para no mantener dos copias del mismo texto.
 */
export const GEOCODING_REVIEW_MESSAGES: Partial<Record<GeocodingStatus, string>> = {
  [GeocodingStatus.Ambiguous]: 'Dirección ambigua: hay varias coincidencias posibles. Revisá localidad y provincia.',
  [GeocodingStatus.NotFound]: 'No se encontró la dirección en el mapa. Revisá los datos.',
  [GeocodingStatus.Pending]: 'No se pudo ubicar todavía. Probá "Ubicar nuevamente".',
};
