import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Coordinates } from '../domain/Coordinates.js';
import type { Delivery } from '../domain/Delivery.js';
import { DeliveryStatus } from '../domain/DeliveryStatus.js';
import type { DeliveryAddress } from '../domain/DeliveryAddress.js';
import type { GeocodeResult, Geocoder } from '../domain/Geocoder.js';
import { GeocodingStatus } from '../domain/GeocodingStatus.js';
import type { RouteOptimizer, RouteStops } from '../domain/RouteOptimizer.js';
import { OptimizeRoute } from './OptimizeRoute.js';

const ADDRESS: DeliveryAddress = { street: 'Calle', locality: 'Localidad', province: 'Buenos Aires', country: 'Argentina' };

function makeDelivery(overrides: Partial<Delivery> & Pick<Delivery, 'id' | 'coordinates'>): Delivery {
  return {
    address: ADDRESS,
    createdAt: new Date().toISOString(),
    geocodingStatus: GeocodingStatus.Verified,
    status: DeliveryStatus.Pending,
    ...overrides,
  };
}

// Todas las entregas de estos tests ya vienen con `geocodingStatus: Verified` y coordenadas, así
// que `OptimizeRoute` nunca debería necesitar geocodificarlas de nuevo — este geocoder revienta
// si eso pasa, como red de seguridad de que el test está aislando la lógica de reordenamiento.
class ThrowingGeocoder implements Geocoder {
  async geocode(): Promise<GeocodeResult> {
    throw new Error('No debería llamarse al geocoder: todas las entregas del test ya están verificadas.');
  }
}

class RecordingRouteOptimizer implements RouteOptimizer {
  public calls: RouteStops[] = [];

  constructor(private readonly orderToReturn?: number[]) {}

  async optimize(input: RouteStops): Promise<number[]> {
    this.calls.push(input);
    return this.orderToReturn ?? input.stops.map((_, index) => index);
  }
}

test('no reordena entregas ya entregadas o fallidas, aunque queden más cerca del punto de partida', async () => {
  const delivered = makeDelivery({ id: 'delivered', status: DeliveryStatus.Delivered, coordinates: { latitude: 10, longitude: 10 } });
  const failed = makeDelivery({ id: 'failed', status: DeliveryStatus.Failed, coordinates: { latitude: 20, longitude: 20 } });
  const pending1 = makeDelivery({ id: 'p1', coordinates: { latitude: 1, longitude: 1 } });
  const pending2 = makeDelivery({ id: 'p2', coordinates: { latitude: 2, longitude: 2 } });

  // El optimizador invierte el orden de las paradas que recibe, para confirmar que solo las
  // pendientes pasan por él (si "delivered"/"failed" entraran, este orden no coincidiría).
  const optimizer = new RecordingRouteOptimizer([1, 0]);
  const useCase = new OptimizeRoute(new ThrowingGeocoder(), optimizer);

  const result = await useCase.execute({
    deliveries: [delivered, pending1, failed, pending2],
    start: { latitude: 0, longitude: 0 },
    end: { latitude: 0, longitude: 0 },
  });

  assert.deepEqual(
    result.deliveries.map((delivery) => delivery.id),
    ['delivered', 'failed', 'p2', 'p1'],
  );
  assert.equal(optimizer.calls.length, 1);
  assert.equal(optimizer.calls[0].stops.length, 2);
  assert.deepEqual(optimizer.calls[0].start, { latitude: 0, longitude: 0 });
});

test('mantiene la entrega en curso como próxima parada fija y la usa como punto de partida para reordenar el resto', async () => {
  const inProgress = makeDelivery({ id: 'ip', status: DeliveryStatus.InProgress, coordinates: { latitude: 5, longitude: 5 } });
  const pending1 = makeDelivery({ id: 'p1', coordinates: { latitude: 1, longitude: 1 } });
  const pending2 = makeDelivery({ id: 'p2', coordinates: { latitude: 2, longitude: 2 } });

  const optimizer = new RecordingRouteOptimizer();
  const useCase = new OptimizeRoute(new ThrowingGeocoder(), optimizer);

  const result = await useCase.execute({
    deliveries: [pending1, inProgress, pending2],
    start: { latitude: 0, longitude: 0 },
    end: { latitude: 0, longitude: 0 },
  });

  assert.deepEqual(
    result.deliveries.map((delivery) => delivery.id),
    ['ip', 'p1', 'p2'],
  );
  assert.equal(optimizer.calls.length, 1);
  assert.equal(optimizer.calls[0].stops.length, 2);
  const expectedStart: Coordinates = { latitude: 5, longitude: 5 };
  assert.deepEqual(optimizer.calls[0].start, expectedStart);
});

test('sin entregas pendientes, devuelve las finalizadas sin llamar al optimizador', async () => {
  const delivered = makeDelivery({ id: 'delivered', status: DeliveryStatus.Delivered, coordinates: { latitude: 10, longitude: 10 } });

  const optimizer = new RecordingRouteOptimizer();
  const useCase = new OptimizeRoute(new ThrowingGeocoder(), optimizer);

  const result = await useCase.execute({
    deliveries: [delivered],
    start: { latitude: 0, longitude: 0 },
    end: { latitude: 0, longitude: 0 },
  });

  assert.deepEqual(
    result.deliveries.map((delivery) => delivery.id),
    ['delivered'],
  );
  assert.equal(optimizer.calls.length, 0);
});
