import type { Client, Row } from '@libsql/client';
import type { Company } from '../../domain/Company.js';
import type { CompanyRepository } from '../../domain/CompanyRepository.js';

function toNullableString(value: Row[string], columnName: string): string | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new Error(`Fila de "companies" con "${columnName}" no textual.`);
  }
  return value;
}

function toBoolean(value: Row[string], columnName: string): boolean {
  if (typeof value !== 'number' && typeof value !== 'bigint') {
    throw new Error(`Fila de "companies" con "${columnName}" no numérica.`);
  }
  return Number(value) === 1;
}

/**
 * Igual criterio que `SqliteUserRepository.toUser`: valida cada columna en vez de castear la fila
 * entera, porque libSQL tipa las columnas como `Value` sin garantía estática de su forma real.
 */
function toCompany(row: Row): Company {
  const {
    id,
    name,
    legal_name: legalName,
    tax_id: taxId,
    contact_email: contactEmail,
    registration_code_hash: registrationCodeHash,
    registration_enabled: registrationEnabled,
    active,
    created_at: createdAt,
    updated_at: updatedAt,
  } = row;

  if (typeof id !== 'string') {
    throw new Error('Fila de "companies" con "id" no textual.');
  }
  if (typeof name !== 'string') {
    throw new Error('Fila de "companies" con "name" no textual.');
  }
  if (typeof registrationCodeHash !== 'string') {
    throw new Error('Fila de "companies" con "registration_code_hash" no textual.');
  }
  if (typeof createdAt !== 'string') {
    throw new Error('Fila de "companies" con "created_at" no textual.');
  }
  if (typeof updatedAt !== 'string') {
    throw new Error('Fila de "companies" con "updated_at" no textual.');
  }

  return {
    id,
    name,
    legalName: toNullableString(legalName, 'legal_name'),
    taxId: toNullableString(taxId, 'tax_id'),
    contactEmail: toNullableString(contactEmail, 'contact_email'),
    registrationCodeHash,
    registrationEnabled: toBoolean(registrationEnabled, 'registration_enabled'),
    active: toBoolean(active, 'active'),
    createdAt,
    updatedAt,
  };
}

export class SqliteCompanyRepository implements CompanyRepository {
  constructor(private readonly client: Client) {}

  async create(company: Company): Promise<void> {
    await this.client.execute({
      sql: `INSERT INTO companies (
        id, name, legal_name, tax_id, contact_email, registration_code_hash,
        registration_enabled, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        company.id,
        company.name,
        company.legalName,
        company.taxId,
        company.contactEmail,
        company.registrationCodeHash,
        company.registrationEnabled ? 1 : 0,
        company.active ? 1 : 0,
        company.createdAt,
        company.updatedAt,
      ],
    });
  }

  async update(company: Company): Promise<void> {
    await this.client.execute({
      sql: `UPDATE companies SET
        name = ?, legal_name = ?, tax_id = ?, contact_email = ?, registration_code_hash = ?,
        registration_enabled = ?, active = ?, updated_at = ?
      WHERE id = ?`,
      args: [
        company.name,
        company.legalName,
        company.taxId,
        company.contactEmail,
        company.registrationCodeHash,
        company.registrationEnabled ? 1 : 0,
        company.active ? 1 : 0,
        company.updatedAt,
        company.id,
      ],
    });
  }

  async findById(id: string): Promise<Company | null> {
    const result = await this.client.execute({ sql: 'SELECT * FROM companies WHERE id = ?', args: [id] });
    const row = result.rows[0];
    return row ? toCompany(row) : null;
  }

  async findByRegistrationCodeHash(registrationCodeHash: string): Promise<Company | null> {
    const result = await this.client.execute({
      sql: 'SELECT * FROM companies WHERE registration_code_hash = ? AND active = 1 AND registration_enabled = 1',
      args: [registrationCodeHash],
    });
    const row = result.rows[0];
    return row ? toCompany(row) : null;
  }
}
