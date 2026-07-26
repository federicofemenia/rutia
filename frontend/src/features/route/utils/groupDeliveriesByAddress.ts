import type { Delivery } from '../types';
import { formatFullAddress, hasStructuredAddress } from './formatDeliveryAddress';

export interface DeliveryGroup {
  key: string;
  deliveries: Delivery[];
}

function addressGroupKey(delivery: Delivery): string {
  // Direcciones todavía sin resolver (calle/localidad vacías, ej. mientras se revisan a mano)
  // nunca se agrupan entre sí — agruparlas por casualidad (todas con campos vacíos) sería un
  // falso positivo.
  if (!hasStructuredAddress(delivery.address)) {
    return `unresolved:${delivery.id}`;
  }

  if (delivery.address.placeId) {
    return `place:${delivery.address.placeId}`;
  }

  return `address:${formatFullAddress(delivery.address).trim().toLowerCase()}`;
}

/**
 * Agrupa entregas que comparten la misma dirección (mismo Google Place, o mismo texto de
 * dirección normalizado si no vino de Places) — para mostrarlas como una sola card con contador
 * en vez de una card duplicada por cada paquete. Preserva el orden: cada grupo aparece en la
 * posición de su primera entrega.
 */
export function groupDeliveriesByAddress(deliveries: Delivery[]): DeliveryGroup[] {
  const groupsByKey = new Map<string, Delivery[]>();
  const orderedKeys: string[] = [];

  for (const delivery of deliveries) {
    const key = addressGroupKey(delivery);
    const existing = groupsByKey.get(key);

    if (existing) {
      existing.push(delivery);
    } else {
      groupsByKey.set(key, [delivery]);
      orderedKeys.push(key);
    }
  }

  return orderedKeys.map((key) => ({ key, deliveries: groupsByKey.get(key) as Delivery[] }));
}
