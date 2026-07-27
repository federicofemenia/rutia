import type { RouteSession } from '../../route';

/** Forma tal cual la devuelve el backend: `createdAt`/`updatedAt` son strings ISO, no `Date`. */
interface RouteSessionWireFormat {
  id: string;
  createdAt: string;
  updatedAt: string;
  deliveries: RouteSession['deliveries'];
}

/**
 * Separado del archivo que hace el `fetch` (que usa `import.meta.env`, solo disponible bajo
 * Vite) para poder testearlo con `node:test` puro: recibe una `Response` ya resuelta (o
 * cualquier objeto con la misma forma) y decide qué representa.
 */
export async function parseRouteSessionResponse(
  response: Pick<Response, 'ok' | 'status' | 'json'>,
): Promise<RouteSession | null> {
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`No se pudo obtener la ruta del servidor (status ${response.status}).`);
  }

  const data = (await response.json()) as RouteSessionWireFormat;

  return { ...data, createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) };
}
