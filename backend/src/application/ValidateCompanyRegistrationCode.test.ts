import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Company } from '../domain/Company.js';
import type { CompanyRepository } from '../domain/CompanyRepository.js';
import { hashRegistrationCode } from '../domain/registrationCodeHashing.js';
import type { AuthTokenPayload, TokenService } from '../domain/TokenService.js';
import { ValidateCompanyRegistrationCode } from './ValidateCompanyRegistrationCode.js';

const SECRET = 'test-secret';
const RAW_CODE = 'abc123XYZ';

const ACTIVE_COMPANY: Company = {
  id: 'company-1',
  name: 'Acme',
  legalName: null,
  taxId: null,
  contactEmail: null,
  registrationCodeHash: hashRegistrationCode(RAW_CODE, SECRET),
  registrationEnabled: true,
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

class StubCompanyRepository implements CompanyRepository {
  constructor(private readonly result: Company | null) {}

  async create(): Promise<void> {
    throw new Error('no usado en este test');
  }

  async update(): Promise<void> {
    throw new Error('no usado en este test');
  }

  async findById(): Promise<Company | null> {
    throw new Error('no usado en este test');
  }

  async findByRegistrationCodeHash(): Promise<Company | null> {
    return this.result;
  }
}

class StubTokenService implements TokenService {
  public lastSignedPayload: AuthTokenPayload | undefined;

  sign(payload: AuthTokenPayload): string {
    this.lastSignedPayload = payload;
    return 'fake-registration-token';
  }

  verify(): AuthTokenPayload | null {
    throw new Error('no usado en este test');
  }
}

test('código válido: devuelve el nombre de la empresa y un token de registro', async () => {
  const useCase = new ValidateCompanyRegistrationCode(
    new StubCompanyRepository(ACTIVE_COMPANY),
    new StubTokenService(),
    SECRET,
  );

  const result = await useCase.execute(RAW_CODE);

  assert.deepEqual(result, { companyName: 'Acme', registrationToken: 'fake-registration-token' });
});

test('firma el token de registro con el companyId correcto y sin exponer el hash', async () => {
  const tokenService = new StubTokenService();
  const useCase = new ValidateCompanyRegistrationCode(new StubCompanyRepository(ACTIVE_COMPANY), tokenService, SECRET);

  await useCase.execute(RAW_CODE);

  assert.deepEqual(tokenService.lastSignedPayload, { purpose: 'driver-registration', companyId: 'company-1' });
});

test('código inexistente devuelve null (mismo resultado que empresa inactiva/registro deshabilitado)', async () => {
  const useCase = new ValidateCompanyRegistrationCode(new StubCompanyRepository(null), new StubTokenService(), SECRET);

  assert.equal(await useCase.execute('codigo-que-no-existe'), null);
});
