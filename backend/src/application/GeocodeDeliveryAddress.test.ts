import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DeliveryAddress } from '../domain/DeliveryAddress.js';
import type { GeocodeResult, Geocoder } from '../domain/Geocoder.js';
import { GeocodingStatus } from '../domain/GeocodingStatus.js';
import { GeocodeDeliveryAddress } from './GeocodeDeliveryAddress.js';

const ADDRESS: DeliveryAddress = { street: 'Calle', locality: 'Localidad', province: 'Buenos Aires', country: 'Argentina' };

class StubGeocoder implements Geocoder {
  constructor(private readonly result: GeocodeResult | (() => GeocodeResult)) {}

  async geocode(): Promise<GeocodeResult> {
    return typeof this.result === 'function' ? this.result() : this.result;
  }
}

class ThrowingGeocoder implements Geocoder {
  async geocode(): Promise<GeocodeResult> {
    throw new Error('Error temporal simulado.');
  }
}

test('devuelve Verified con coordenadas cuando el geocoder confirma la dirección', async () => {
  const coordinates = { latitude: 1, longitude: 2 };
  const useCase = new GeocodeDeliveryAddress(new StubGeocoder({ status: 'verified', coordinates }));

  const resolution = await useCase.execute(ADDRESS);

  assert.deepEqual(resolution, { coordinates, geocodingStatus: GeocodingStatus.Verified });
});

test('devuelve NotFound sin coordenadas cuando el geocoder no encuentra candidatos', async () => {
  const useCase = new GeocodeDeliveryAddress(new StubGeocoder({ status: 'notFound' }));

  const resolution = await useCase.execute(ADDRESS);

  assert.deepEqual(resolution, { geocodingStatus: GeocodingStatus.NotFound });
});

test('devuelve Ambiguous conservando las coordenadas del mejor candidato', async () => {
  const coordinates = { latitude: 3, longitude: 4 };
  const useCase = new GeocodeDeliveryAddress(new StubGeocoder({ status: 'ambiguous', coordinates, candidates: 2 }));

  const resolution = await useCase.execute(ADDRESS);

  assert.deepEqual(resolution, { coordinates, geocodingStatus: GeocodingStatus.Ambiguous });
});

test('un error del geocoder no se propaga: devuelve Pending para poder reintentar después', async () => {
  const useCase = new GeocodeDeliveryAddress(new ThrowingGeocoder());

  const resolution = await useCase.execute(ADDRESS);

  assert.deepEqual(resolution, { geocodingStatus: GeocodingStatus.Pending });
});
