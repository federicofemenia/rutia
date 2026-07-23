import type { Coordinates } from '../domain/Coordinates.js';
import type { Delivery } from '../domain/Delivery.js';
import type { DeliveryAddress } from '../domain/DeliveryAddress.js';
import { DeliveryStatus } from '../domain/DeliveryStatus.js';
import type { Geocoder } from '../domain/Geocoder.js';
import { GeocodingStatus } from '../domain/GeocodingStatus.js';
import type { RouteOptimizer } from '../domain/RouteOptimizer.js';
import { resolveGeocoding } from './resolveGeocoding.js';

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
  /** Entregas que no se pudieron geocodificar por un error temporal del proveedor (red, timeout,
   *  rate limit) — a diferencia de `notFound`, acá el proveedor no llegó a responder con
   *  candidatos. Quedan con geocodingStatus `Pending` para reintentar en la próxima optimización. */
  error: number;
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
    // Las entregas ya entregadas o fallidas son historial: nunca se vuelven a geocodificar ni
    // a reordenar, sin importar dónde queden respecto al punto de partida actual — si no las
    // separamos acá, el optimizador las trata como una parada más y puede "moverlas" a
    // cualquier posición (incluida la primera) cuando se reoptimiza con paradas nuevas.
    const finishedDeliveries = deliveries.filter(
      (delivery) => delivery.status === DeliveryStatus.Delivered || delivery.status === DeliveryStatus.Failed,
    );
    const routableDeliveries = deliveries.filter(
      (delivery) => delivery.status !== DeliveryStatus.Delivered && delivery.status !== DeliveryStatus.Failed,
    );

    let calledGeocoderPreviously = false;

    const geocode = async (address: DeliveryAddress) => {
      if (calledGeocoderPreviously) {
        await sleep(GEOCODING_DELAY_MS);
      }
      calledGeocoderPreviously = true;
      return resolveGeocoding(this.geocoder, address);
    };

    const resolvedDeliveries: Delivery[] = [];

    for (const delivery of routableDeliveries) {
      // Solo `Pending` dispara una (re)geocodificación automática acá: es el único estado sin un
      // resultado "definitivo" del proveedor. `Verified`/`Ambiguous`/`NotFound` ya consultaron al
      // geocoder antes y, para la misma dirección, van a dar el mismo resultado — reintentarlos
      // en cada optimización solo gasta presupuesto de rate limit en direcciones que ya conocemos.
      // Para volver a intentar una de esas, el chofer edita la dirección (resetea a Pending, ver
      // `UPDATE_DELIVERY_ADDRESS` en el frontend) o usa el reintento manual de esa entrega puntual.
      if (delivery.geocodingStatus !== GeocodingStatus.Pending) {
        resolvedDeliveries.push(delivery);
        continue;
      }

      const resolution = await geocode(delivery.address);
      resolvedDeliveries.push({ ...delivery, ...resolution });
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
      error: unresolvedDeliveries.filter((delivery) => delivery.geocodingStatus === GeocodingStatus.Pending).length,
    };

    if (verifiedDeliveries.length === 0) {
      return { deliveries: [...finishedDeliveries, ...unresolvedDeliveries], stats };
    }

    const endCoordinates = 'address' in end ? await this.resolveEndCoordinates(end.address, calledGeocoderPreviously) : end;

    // La entrega en curso ya está comprometida (el chofer ya la eligió y puede estar en camino):
    // no se reordena, queda como la próxima parada fija. El resto se optimiza a partir de ahí
    // (o del punto de partida dado, si no hay ninguna en curso).
    const inProgressDelivery = verifiedDeliveries.find((delivery) => delivery.status === DeliveryStatus.InProgress);
    const reorderableDeliveries = verifiedDeliveries.filter((delivery) => delivery !== inProgressDelivery);
    const optimizerStart = inProgressDelivery ? inProgressDelivery.coordinates : start;

    const order = await this.routeOptimizer.optimize({
      start: optimizerStart,
      stops: reorderableDeliveries.map((delivery) => delivery.coordinates),
      end: endCoordinates,
    });

    const orderedReorderableDeliveries = order.map((index) => reorderableDeliveries[index]);
    const orderedVerifiedDeliveries = inProgressDelivery
      ? [inProgressDelivery, ...orderedReorderableDeliveries]
      : orderedReorderableDeliveries;

    return { deliveries: [...finishedDeliveries, ...orderedVerifiedDeliveries, ...unresolvedDeliveries], stats };
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
