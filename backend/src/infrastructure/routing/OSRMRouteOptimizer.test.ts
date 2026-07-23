import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import type { Coordinates } from '../../domain/Coordinates.js';
import { OSRMRouteOptimizer } from './OSRMRouteOptimizer.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockOsrmResponse(body: unknown): void {
  globalThis.fetch = (async () => new Response(JSON.stringify(body), { status: 200 })) as typeof fetch;
}

const start: Coordinates = { latitude: 0, longitude: 0 };
const end: Coordinates = { latitude: 9, longitude: 9 };
const stops: Coordinates[] = [
  { latitude: 1, longitude: 1 },
  { latitude: 2, longitude: 2 },
];

test('no llama a OSRM y devuelve un resultado vacío cuando no hay paradas', async () => {
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    throw new Error('no debería llamarse');
  }) as typeof fetch;

  const optimizer = new OSRMRouteOptimizer();
  const result = await optimizer.optimize({ start, stops: [], end });

  assert.equal(called, false);
  assert.deepEqual(result, { order: [], totalDistance: 0, totalDuration: 0, legs: [] });
});

test('mapea order, totalDistance/totalDuration y legs (con fromStopIndex/toStopIndex null en los extremos)', async () => {
  // OSRM visita las paradas en el orden inverso al que se las mandamos: primero stops[1], después
  // stops[0] — 3 legs: partida->stops[1], stops[1]->stops[0], stops[0]->destino final.
  mockOsrmResponse({
    code: 'Ok',
    waypoints: [
      { waypoint_index: 0 }, // partida
      { waypoint_index: 2 }, // stops[0], visitado último
      { waypoint_index: 1 }, // stops[1], visitado primero
      { waypoint_index: 3 }, // destino final
    ],
    trips: [
      {
        distance: 5000,
        duration: 600,
        legs: [
          { distance: 2000, duration: 200 },
          { distance: 1500, duration: 150 },
          { distance: 1500, duration: 250 },
        ],
      },
    ],
  });

  const optimizer = new OSRMRouteOptimizer();
  const result = await optimizer.optimize({ start, stops, end });

  assert.deepEqual(result.order, [1, 0]);
  assert.equal(result.totalDistance, 5000);
  assert.equal(result.totalDuration, 600);
  assert.deepEqual(result.legs, [
    { distance: 2000, duration: 200, fromStopIndex: null, toStopIndex: 1 },
    { distance: 1500, duration: 150, fromStopIndex: 1, toStopIndex: 0 },
    { distance: 1500, duration: 250, fromStopIndex: 0, toStopIndex: null },
  ]);
});

test('tira un error si OSRM responde con un code distinto de Ok', async () => {
  mockOsrmResponse({ code: 'NoRoute', waypoints: [], trips: [] });

  const optimizer = new OSRMRouteOptimizer();

  await assert.rejects(() => optimizer.optimize({ start, stops, end }), /NoRoute/);
});

test('tira un error si la respuesta HTTP no es ok', async () => {
  globalThis.fetch = (async () => new Response('{}', { status: 500 })) as typeof fetch;

  const optimizer = new OSRMRouteOptimizer();

  await assert.rejects(() => optimizer.optimize({ start, stops, end }), /500/);
});
