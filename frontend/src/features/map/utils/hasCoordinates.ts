import type { Coordinates, Delivery } from '../../route';

export function hasCoordinates(delivery: Delivery): delivery is Delivery & { coordinates: Coordinates } {
  return delivery.coordinates !== undefined;
}
