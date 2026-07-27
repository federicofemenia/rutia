import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ROUTES } from '../../app/router/routes';
import { buildDriverMenuItems } from './useDriverMenuItems';

test('arma un único ítem "Mis entregas"', () => {
  const items = buildDriverMenuItems(() => {});

  assert.equal(items.length, 1);
  assert.equal(items[0]?.key, 'my-deliveries');
  assert.equal(items[0]?.label, 'Mis entregas');
});

test('onSelect navega a ROUTES.driverHistory', () => {
  const calls: unknown[] = [];
  const items = buildDriverMenuItems(((...args: unknown[]) => {
    calls.push(args[0]);
  }) as never);

  items[0]?.onSelect();

  assert.deepEqual(calls, [ROUTES.driverHistory]);
});
