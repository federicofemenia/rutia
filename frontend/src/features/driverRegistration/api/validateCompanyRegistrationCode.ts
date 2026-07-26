export interface ValidateCompanyRegistrationCodeResult {
  companyName: string;
  registrationToken: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? '';

export async function validateCompanyRegistrationCode(
  registrationCode: string,
): Promise<ValidateCompanyRegistrationCodeResult> {
  const response = await fetch(`${API_URL}/api/auth/company-registration/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationCode }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? 'Código de registro inválido.');
  }

  return (await response.json()) as ValidateCompanyRegistrationCodeResult;
}
