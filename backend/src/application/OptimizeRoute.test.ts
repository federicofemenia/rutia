import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Coordinates } from '../domain/Coordinates.js';
import type { Delivery } from '../domain/Delivery.js';
import { DeliveryStatus } from '../domain/DeliveryStatus.js';
import type { DeliveryAddress } from '../domain/DeliveryAddress.js';
import type { GeocodeResult, Geocoder } from '../domain/Geocoder.js';
import { GeocodingStatus } from '../domain/GeocodingStatus.js';
import type { RouteLeg, RouteOptimizationResult, RouteOptimizer, RouteStops } from '../domain/RouteOptimizer.js';
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

class FailingGeocoder implements Geocoder {
  async geocode(): Promise<GeocodeResult> {
    throw new Error('Timeout simulado del proveedor de geocodificación.');
  }
}

class RecordingRouteOptimizer implements RouteOptimizer {
  public calls: RouteStops[] = [];

  constructor(
    private readonly orderToReturn?: number[],
    private readonly legsToReturn?: RouteLeg[],
  ) {}

  async optimize(input: RouteStops): Promise<RouteOptimizationResult> {
    this.calls.push(input);
    const order = this.orderToReturn ?? input.stops.map((_, index) => index);
    const legs = this.legsToReturn ?? [];
    return { order, totalDistance: 0, totalDuration: 0, legs };
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

test('arma route.legs traduciendo los índices de parada del optimizador a ids de entrega', async () => {
  const pending1 = makeDelivery({ id: 'p1', coordinates: { latitude: 1, longitude: 1 } });
  const pending2 = makeDelivery({ id: 'p2', coordinates: { latitude: 2, longitude: 2 } });

  // Sin entrega en curso: el primer tramo (partida -> primera parada) no tiene deliveryId de
  // origen. `order: [1, 0]` visita p2 primero, después p1.
  const legs: RouteLeg[] = [
    { distance: 1000, duration: 100, fromStopIndex: null, toStopIndex: 1 },
    { distance: 500, duration: 50, fromStopIndex: 1, toStopIndex: 0 },
    { distance: 2000, duration: 200, fromStopIndex: 0, toStopIndex: null },
  ];
  const optimizer = new RecordingRouteOptimizer([1, 0], legs);
  const useCase = new OptimizeRoute(new ThrowingGeocoder(), optimizer);

  const result = await useCase.execute({
    deliveries: [pending1, pending2],
    start: { latitude: 0, longitude: 0 },
    end: { latitude: 0, longitude: 0 },
  });

  assert.deepEqual(result.route, {
    totalDistance: 0,
    totalDuration: 0,
    legs: [
      { distance: 1000, duration: 100, fromDeliveryId: null, toDeliveryId: 'p2' },
      { distance: 500, duration: 50, fromDeliveryId: 'p2', toDeliveryId: 'p1' },
      { distance: 2000, duration: 200, fromDeliveryId: 'p1', toDeliveryId: null },
    ],
  });
});

test('cuando hay una entrega en curso, es el origen del primer tramo en vez de null', async () => {
  const inProgress = makeDelivery({ id: 'ip', status: DeliveryStatus.InProgress, coordinates: { latitude: 5, longitude: 5 } });
  const pending1 = makeDelivery({ id: 'p1', coordinates: { latitude: 1, longitude: 1 } });

  const legs: RouteLeg[] = [{ distance: 300, duration: 30, fromStopIndex: null, toStopIndex: 0 }];
  const optimizer = new RecordingRouteOptimizer([0], legs);
  const useCase = new OptimizeRoute(new ThrowingGeocoder(), optimizer);

  const result = await useCase.execute({
    deliveries: [inProgress, pending1],
    start: { latitude: 0, longitude: 0 },
    end: { latitude: 0, longitude: 0 },
  });

  assert.deepEqual(result.route?.legs, [{ distance: 300, duration: 30, fromDeliveryId: 'ip', toDeliveryId: 'p1' }]);
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

test('un error temporal del geocoder deja la entrega en Pending y se cuenta en stats.error, no en notFound', async () => {
  const unresolved = makeDelivery({
    id: 'u1',
    coordinates: undefined,
    geocodingStatus: GeocodingStatus.Pending,
  });

  const optimizer = new RecordingRouteOptimizer();
  const useCase = new OptimizeRoute(new FailingGeocoder(), optimizer);

  const result = await useCase.execute({
    deliveries: [unresolved],
    start: { latitude: 0, longitude: 0 },
    end: { latitude: 0, longitude: 0 },
  });

  assert.deepEqual(result.stats, { verified: 0, ambiguous: 0, notFound: 0, error: 1 });
  assert.equal(result.deliveries[0].geocodingStatus, GeocodingStatus.Pending);
  assert.equal(optimizer.calls.length, 0);
});

test('no vuelve a geocodificar entregas NotFound o Ambiguous: solo Pending dispara una consulta nueva', async () => {
  const notFound = makeDelivery({ id: 'nf', coordinates: undefined, geocodingStatus: GeocodingStatus.NotFound });
  const ambiguous = makeDelivery({ id: 'amb', coordinates: { latitude: 3, longitude: 3 }, geocodingStatus: GeocodingStatus.Ambiguous });
  const verified = makeDelivery({ id: 'v1', coordinates: { latitude: 1, longitude: 1 } });

  const optimizer = new RecordingRouteOptimizer();
  // ThrowingGeocoder revienta si algo lo llama — confirma que ni NotFound ni Ambiguous disparan
  // una nueva consulta, solo el estado Pending lo haría.
  const useCase = new OptimizeRoute(new ThrowingGeocoder(), optimizer);

  const result = await useCase.execute({
    deliveries: [notFound, ambiguous, verified],
    start: { latitude: 0, longitude: 0 },
    end: { latitude: 0, longitude: 0 },
  });

  assert.deepEqual(result.stats, { verified: 1, ambiguous: 1, notFound: 1, error: 0 });
  assert.equal(result.deliveries.find((delivery) => delivery.id === 'nf')?.geocodingStatus, GeocodingStatus.NotFound);
  assert.equal(result.deliveries.find((delivery) => delivery.id === 'amb')?.geocodingStatus, GeocodingStatus.Ambiguous);
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
