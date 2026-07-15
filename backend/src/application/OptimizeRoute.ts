import type { Coordinates } from '../domain/Coordinates.js';
import type { Delivery } from '../domain/Delivery.js';
import type { Geocoder } from '../domain/Geocoder.js';
import type { RouteOptimizer } from '../domain/RouteOptimizer.js';

const GEOCODING_DELAY_MS = 1100;

export interface OptimizeRouteInput {
  deliveries: Delivery[];
  start: Coordinates;
  end: Coordinates | { address: string };
}

export class OptimizeRoute {
  constructor(
    private readonly geocoder: Geocoder,
    private readonly routeOptimizer: RouteOptimizer,
  ) {}

  async execute({ deliveries, start, end }: OptimizeRouteInput): Promise<Delivery[]> {
    const geocoded: Array<Delivery & { coordinates: Coordinates }> = [];
    let calledGeocoderPreviously = false;

    for (const delivery of deliveries) {
      let coordinates = delivery.coordinates;

      if (!coordinates) {
        if (calledGeocoderPreviously) {
          await sleep(GEOCODING_DELAY_MS);
        }
        coordinates = await this.geocoder.geocode(delivery.address);
        calledGeocoderPreviously = true;
      }

      geocoded.push({ ...delivery, coordinates });
    }

    const endCoordinates =
      'address' in end
        ? await this.geocoder.geocode(end.address)
        : end;

    const order = await this.routeOptimizer.optimize({
      start,
      stops: geocoded.map((delivery) => delivery.coordinates),
      end: endCoordinates,
    });

    return order.map((index) => geocoded[index]);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
