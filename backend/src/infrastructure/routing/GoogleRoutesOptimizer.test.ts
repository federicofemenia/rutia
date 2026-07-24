import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import type { Coordinates } from '../../domain/Coordinates.js';
import { GoogleRoutesOptimizer } from './GoogleRoutesOptimizer.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockComputeRoutesResponse(body: unknown, status = 200): void {
  globalThis.fetch = (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;
}

const start: Coordinates = { latitude: 0, longitude: 0 };
const end: Coordinates = { latitude: 9, longitude: 9 };
const stops: Coordinates[] = [
  { latitude: 1, longitude: 1 },
  { latitude: 2, longitude: 2 },
];

test('no llama a Google Routes y devuelve un resultado vacío cuando no hay paradas', async () => {
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    throw new Error('no debería llamarse');
  }) as typeof fetch;

  const optimizer = new GoogleRoutesOptimizer('fake-key');
  const result = await optimizer.optimize({ start, stops: [], end });

  assert.equal(called, false);
  assert.deepEqual(result, { order: [], totalDistance: 0, totalDuration: 0, legs: [] });
});

test('manda el FieldMask y la API key en los headers', async () => {
  let capturedHeaders: Headers | undefined;
  globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
    capturedHeaders = new Headers(init?.headers);
    return new Response(
      JSON.stringify({
        routes: [
          {
            optimizedIntermediateWaypointIndex: [0, 1],
            distanceMeters: 100,
            duration: '10s',
            legs: [],
          },
        ],
      }),
      { status: 200 },
    );
  }) as typeof fetch;

  const optimizer = new GoogleRoutesOptimizer('my-api-key');
  await optimizer.optimize({ start, stops, end });

  assert.equal(capturedHeaders?.get('X-Goog-Api-Key'), 'my-api-key');
  assert.ok(capturedHeaders?.get('X-Goog-FieldMask')?.includes('routes.optimizedIntermediateWaypointIndex'));
});

test('mapea order, totalDistance/totalDuration, legs y encodedPolyline (con fromStopIndex/toStopIndex null en los extremos)', async () => {
  // Google visita las paradas en el orden inverso al que se las mandamos: primero stops[1],
  // después stops[0] — 3 legs: partida->stops[1], stops[1]->stops[0], stops[0]->destino final.
  mockComputeRoutesResponse({
    routes: [
      {
        optimizedIntermediateWaypointIndex: [1, 0],
        distanceMeters: 5000,
        duration: '600s',
        polyline: { encodedPolyline: 'abc123' },
        legs: [
          { distanceMeters: 2000, duration: '200s' },
          { distanceMeters: 1500, duration: '150s' },
          { distanceMeters: 1500, duration: '250s' },
        ],
      },
    ],
  });

  const optimizer = new GoogleRoutesOptimizer('fake-key');
  const result = await optimizer.optimize({ start, stops, end });

  assert.deepEqual(result.order, [1, 0]);
  assert.equal(result.totalDistance, 5000);
  assert.equal(result.totalDuration, 600);
  assert.equal(result.encodedPolyline, 'abc123');
  assert.deepEqual(result.legs, [
    { distance: 2000, duration: 200, fromStopIndex: null, toStopIndex: 1 },
    { distance: 1500, duration: 150, fromStopIndex: 1, toStopIndex: 0 },
    { distance: 1500, duration: 250, fromStopIndex: 0, toStopIndex: null },
  ]);
});

test('con una sola parada, Google devuelve optimizedIntermediateWaypointIndex: [-1] (confirmado contra la API real) — se usa el orden identidad [0] en vez de ese valor inválido', async () => {
  mockComputeRoutesResponse({
    routes: [
      {
        optimizedIntermediateWaypointIndex: [-1],
        distanceMeters: 3244,
        duration: '729s',
        polyline: { encodedPolyline: 'xyz' },
        legs: [
          { distanceMeters: 1616, duration: '343s' },
          { distanceMeters: 1629, duration: '387s' },
        ],
      },
    ],
  });

  const optimizer = new GoogleRoutesOptimizer('fake-key');
  const result = await optimizer.optimize({ start, stops: [stops[0]], end });

  assert.deepEqual(result.order, [0]);
  assert.deepEqual(result.legs, [
    { distance: 1616, duration: 343, fromStopIndex: null, toStopIndex: 0 },
    { distance: 1629, duration: 387, fromStopIndex: 0, toStopIndex: null },
  ]);
});

test('tira un error si Google Routes no devuelve ninguna ruta', async () => {
  mockComputeRoutesResponse({ routes: [] });

  const optimizer = new GoogleRoutesOptimizer('fake-key');

  await assert.rejects(() => optimizer.optimize({ start, stops, end }), /no devolvió ninguna ruta/);
});

test('tira un error si la respuesta HTTP no es ok', async () => {
  mockComputeRoutesResponse({ error: { code: 403, message: 'forbidden', status: 'PERMISSION_DENIED' } }, 403);

  const optimizer = new GoogleRoutesOptimizer('fake-key');

  await assert.rejects(() => optimizer.optimize({ start, stops, end }), /403/);
});
