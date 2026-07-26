import { authFetch } from '../../auth';

export interface CompanyDriver {
  id: string;
  name: string;
  active: boolean;
  hasActiveRoute: boolean;
}

const API_URL = import.meta.env.VITE_API_URL ?? '';

export async function fetchCompanyDrivers(): Promise<CompanyDriver[]> {
  const response = await authFetch(`${API_URL}/api/company/drivers`);

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? 'No se pudo obtener la lista de choferes.');
  }

  const { drivers } = (await response.json()) as { drivers: CompanyDriver[] };
  return drivers;
}
