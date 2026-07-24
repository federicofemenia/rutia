import { GeocodingStatus } from '../types';

/**
 * Explicación para el chofer de por qué una entrega no está lista para optimizar — todas
 * heredadas de entregas creadas antes de la migración a Google Places (`DeliveryListItem`,
 * ícono de alerta en la lista): bajo el flujo actual una entrega nueva nace `Verified` o no nace,
 * así que estos estados ya no pueden originarse. Se resuelven editando la dirección (que la
 * reemplaza por una seleccionada vía Places) o eliminando la entrega.
 */
export const GEOCODING_REVIEW_MESSAGES: Partial<Record<GeocodingStatus, string>> = {
  [GeocodingStatus.Ambiguous]: 'Dirección ambigua: hay varias coincidencias posibles. Editá la dirección para elegir una.',
  [GeocodingStatus.NotFound]: 'No se encontró la dirección en el mapa. Editá la dirección o eliminá la entrega.',
  [GeocodingStatus.Pending]: 'No se pudo ubicar. Editá la dirección o eliminá la entrega.',
};
