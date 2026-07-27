import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clearLegacyRouteStorage, LEGACY_ROUTE_STORAGE_KEYS } from './legacyRouteStorage';

/** Node no expone `localStorage` global fuera de un navegador — se stubea en memoria para el test. */
function installFakeLocalStorage(initial: Record<string, string>): { store: Record<string, string> } {
  const store: Record<string, string> = { ...initial };

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    },
  });

  return { store };
}

test('borra exactamente las claves legacy conocidas', () => {
  const { store } = installFakeLocalStorage({ 'rutia:route-session': '{"deliveries":[]}' });

  clearLegacyRouteStorage();

  for (const key of LEGACY_ROUTE_STORAGE_KEYS) {
    assert.equal(store[key], undefined);
  }
});

test('nunca toca la sesión de auth (rutia:auth)', () => {
  const { store } = installFakeLocalStorage({
    'rutia:route-session': '{"deliveries":[]}',
    'rutia:auth': '{"token":"fake","user":{}}',
  });

  clearLegacyRouteStorage();

  assert.equal(store['rutia:auth'], '{"token":"fake","user":{}}');
});

test('es un no-op seguro si la clave legacy no existe', () => {
  installFakeLocalStorage({});

  assert.doesNotThrow(() => clearLegacyRouteStorage());
});

test('no revienta si localStorage no está disponible', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('localStorage no disponible (ej. modo privado de Safari)');
    },
  });

  assert.doesNotThrow(() => clearLegacyRouteStorage());
});
