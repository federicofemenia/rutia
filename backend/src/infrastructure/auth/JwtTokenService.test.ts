import assert from 'node:assert/strict';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../domain/UserRole.js';
import { JwtTokenService } from './JwtTokenService.js';

const SECRET = 'test-secret';

test('sign + verify redondea un payload de sesión', () => {
  const service = new JwtTokenService(SECRET);
  const payload = { purpose: 'session' as const, userId: 'user-1', role: UserRole.Driver, companyId: 'company-1' };

  const token = service.sign(payload);

  assert.deepEqual(service.verify(token), payload);
});

test('sign + verify redondea un payload de sesión con companyId null (super admin)', () => {
  const service = new JwtTokenService(SECRET);
  const payload = { purpose: 'session' as const, userId: 'user-1', role: UserRole.SuperAdmin, companyId: null };

  const token = service.sign(payload);

  assert.deepEqual(service.verify(token), payload);
});

test('sign + verify redondea un payload de registro de chofer', () => {
  const service = new JwtTokenService(SECRET);
  const payload = { purpose: 'driver-registration' as const, companyId: 'company-1' };

  const token = service.sign(payload);

  assert.deepEqual(service.verify(token), payload);
});

test('verify devuelve null para un token con secreto distinto', () => {
  const token = new JwtTokenService('otro-secreto').sign({
    purpose: 'session',
    userId: 'user-1',
    role: UserRole.Driver,
    companyId: 'company-1',
  });

  assert.equal(new JwtTokenService(SECRET).verify(token), null);
});

test('verify devuelve null para un token mal formado', () => {
  assert.equal(new JwtTokenService(SECRET).verify('no-es-un-jwt'), null);
});

test('verify devuelve null si el rol no es válido', () => {
  const token = jwt.sign({ purpose: 'session', userId: 'user-1', role: 'super-villain', companyId: null }, SECRET);

  assert.equal(new JwtTokenService(SECRET).verify(token), null);
});

test('verify devuelve null si el purpose es desconocido', () => {
  const token = jwt.sign({ purpose: 'something-else', userId: 'user-1' }, SECRET);

  assert.equal(new JwtTokenService(SECRET).verify(token), null);
});

test('un token de registro no puede pasar como token de sesión', () => {
  const service = new JwtTokenService(SECRET);
  const token = service.sign({ purpose: 'driver-registration', companyId: 'company-1' });

  const decoded = service.verify(token);

  assert.equal(decoded?.purpose, 'driver-registration');
});
