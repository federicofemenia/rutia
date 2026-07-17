import type { DeliveryAddress } from '../types';

function joinParts(parts: Array<string | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(', ');
}

/**
 * Indica si la dirección tiene suficiente información estructurada (calle y localidad) como
 * para mostrarse o geocodificarse con confianza. Si no, `rawAddress` (el texto original de la
 * etiqueta) suele ser un mejor fallback que campos vacíos.
 */
export function hasStructuredAddress(address: DeliveryAddress): boolean {
  return address.street.trim().length > 0 && address.locality.trim().length > 0;
}

/** Ej: "Av. Rivadavia 1234" */
export function formatStreetLine(address: DeliveryAddress): string {
  return [address.street.trim(), address.streetNumber?.trim()]
    .filter((part): part is string => Boolean(part))
    .join(' ');
}

/** Ej: "Merlo, Buenos Aires, 1722" */
export function formatLocalityLine(address: DeliveryAddress): string {
  return joinParts([address.locality, address.province, address.postalCode]);
}

/** Ej: "Av. Rivadavia 1234, Merlo, Buenos Aires, 1722, Argentina" */
export function formatFullAddress(address: DeliveryAddress): string {
  return joinParts([formatStreetLine(address), formatLocalityLine(address), address.country]);
}
