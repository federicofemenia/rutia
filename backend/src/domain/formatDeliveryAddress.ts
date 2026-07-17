import type { DeliveryAddress } from './DeliveryAddress.js';

function joinParts(parts: Array<string | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(', ');
}

/**
 * Indica si la dirección tiene suficiente información estructurada (calle y localidad)
 * como para armar una consulta de geocodificación confiable. Si no, `rawAddress` (el texto
 * original de la etiqueta) suele ser un mejor punto de partida que campos vacíos.
 */
export function hasStructuredAddress(address: DeliveryAddress): boolean {
  return address.street.trim().length > 0 && address.locality.trim().length > 0;
}

/**
 * Texto completo para geocodificación, deep links de navegación o cualquier fallback que
 * necesite una sola cadena. Omite campos vacíos, sin comas ni espacios duplicados.
 */
export function formatFullAddress(address: DeliveryAddress): string {
  const streetLine = [address.street.trim(), address.streetNumber?.trim()]
    .filter((part): part is string => Boolean(part))
    .join(' ');

  return joinParts([streetLine, address.locality, address.province, address.postalCode, address.country]);
}
