import type { DeliveryAddress } from '../types';

/**
 * Compara los campos que importan para geocodificar. `country` no se compara (siempre
 * "Argentina" en este MVP) y `rawAddress` tampoco (es metadata de auditoría, no afecta la
 * geocodificación).
 */
export function hasAddressChanged(previous: DeliveryAddress, next: DeliveryAddress): boolean {
  return (
    previous.street !== next.street ||
    previous.streetNumber !== next.streetNumber ||
    previous.postalCode !== next.postalCode ||
    previous.locality !== next.locality ||
    previous.province !== next.province
  );
}
