import type { Coordinates } from '../domain/Coordinates.js';
import type { Delivery } from '../domain/Delivery.js';
import type { DeliveryAddress } from '../domain/DeliveryAddress.js';
import type { Geocoder } from '../domain/Geocoder.js';
import { GeocodingStatus } from '../domain/GeocodingStatus.js';
import type { RouteOptimizer } from '../domain/RouteOptimizer.js';

const GEOCODING_DELAY_MS = 1100;

export interface OptimizeRouteInput {
  deliveries: Delivery[];
  start: Coordinates;
  end: Coordinates | { address: DeliveryAddress };
}

export interface OptimizeRouteStats {
  verified: number;
  ambiguous: number;
  notFound: number;
}

export interface OptimizeRouteResult {
  /** Todas las entregas: las verificadas primero (en el orden optimizado), después las no
   *  resueltas (sin coordinates, conservan su geocodingStatus para que la UI las señale). */
  deliveries: Delivery[];
  stats: OptimizeRouteStats;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OptimizeRoute {
  constructor(
    private readonly geocoder: Geocoder,
    private readonly routeOptimizer: RouteOptimizer,
  ) {}

  async execute({ deliveries, start, end }: OptimizeRouteInput): Promise<OptimizeRouteResult> {
    let calledGeocoderPreviously = false;

    const geocode = async (address: DeliveryAddress) => {
      if (calledGeocoderPreviously) {
        await sleep(GEOCODING_DELAY_MS);
      }
      calledGeocoderPreviously = true;
      return this.geocoder.geocode(address);
    };

    const resolvedDeliveries: Delivery[] = [];

    for (const delivery of deliveries) {
      // Ya verificada (y, por ahora, la dirección nunca cambia después de confirmada — no hay
      // edición post-confirmación todavía) — se reutiliza sin volver a geocodificar.
      if (delivery.geocodingStatus === GeocodingStatus.Verified && delivery.coordinates) {
        resolvedDeliveries.push(delivery);
        continue;
      }

      try {
        const result = await geocode(delivery.address);

        if (result.status === 'verified') {
          resolvedDeliveries.push({ ...delivery, coordinates: result.coordinates, geocodingStatus: GeocodingStatus.Verified });
        } else {
          resolvedDeliveries.push({
            ...delivery,
            coordinates: undefined,
            geocodingStatus: result.status === 'ambiguous' ? GeocodingStatus.Ambiguous : GeocodingStatus.NotFound,
          });
        }
      } catch (error) {
        // Error temporal del proveedor (red, rate limit, respuesta inválida): no es lo mismo que
        // "no encontrado". La entrega queda pending para reintentar en la próxima optimización
        // en vez de marcarse como irresoluble; no había coordinates verificadas que perder.
        console.error(`Error temporal al geocodificar la entrega ${delivery.id}`, error);
        resolvedDeliveries.push({ ...delivery, coordinates: undefined, geocodingStatus: GeocodingStatus.Pending });
      }
    }

    const verifiedDeliveries = resolvedDeliveries.filter(
      (delivery): delivery is Delivery & { coordinates: Coordinates } =>
        delivery.geocodingStatus === GeocodingStatus.Verified && delivery.coordinates !== undefined,
    );
    const unresolvedDeliveries = resolvedDeliveries.filter((delivery) => delivery.geocodingStatus !== GeocodingStatus.Verified);

    const stats: OptimizeRouteStats = {
      verified: verifiedDeliveries.length,
      ambiguous: unresolvedDeliveries.filter((delivery) => delivery.geocodingStatus === GeocodingStatus.Ambiguous).length,
      notFound: unresolvedDeliveries.filter((delivery) => delivery.geocodingStatus === GeocodingStatus.NotFound).length,
    };

    if (verifiedDeliveries.length === 0) {
      return { deliveries: unresolvedDeliveries, stats };
    }

    const endCoordinates = 'address' in end ? await this.resolveEndCoordinates(end.address, calledGeocoderPreviously) : end;

    const order = await this.routeOptimizer.optimize({
      start,
      stops: verifiedDeliveries.map((delivery) => delivery.coordinates),
      end: endCoordinates,
    });

    const orderedVerifiedDeliveries = order.map((index) => verifiedDeliveries[index]);

    return { deliveries: [...orderedVerifiedDeliveries, ...unresolvedDeliveries], stats };
  }

  private async resolveEndCoordinates(address: DeliveryAddress, calledGeocoderPreviously: boolean): Promise<Coordinates> {
    if (calledGeocoderPreviously) {
      await sleep(GEOCODING_DELAY_MS);
    }

    const result = await this.geocoder.geocode(address);

    if (result.status !== 'verified') {
      throw new Error(`No se pudo geocodificar el destino final con confianza (estado: ${result.status}).`);
    }

    return result.coordinates;
  }
}
