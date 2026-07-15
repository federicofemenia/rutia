import type { Coordinates } from './Coordinates.js';

export interface Delivery {
  id: string;
  address: string;
  postalCode: string;
  createdAt: string;
  coordinates?: Coordinates;
}
