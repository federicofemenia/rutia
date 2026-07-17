import { clearStoredAuth, getStoredToken } from '../utils/authStorage';

/**
 * Wrapper de `fetch` que agrega el token de autenticación y, si el servidor responde 401
 * (token ausente/inválido/expirado), limpia la sesión guardada y manda a /login — evita que
 * cada pantalla tenga que manejar ese caso por separado.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    clearStoredAuth();
    window.location.assign('/login');
  }

  return response;
}
