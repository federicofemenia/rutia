import { RouteSessionStatus, type RouteSession } from '../../route/types';

/** Forma tal cual la devuelve el backend: `createdAt`/`updatedAt` son strings ISO, no `Date`. */
interface RouteSessionWireFormat {
  id: string;
  createdAt: string;
  updatedAt: string;
  deliveries: RouteSession['deliveries'];
  /** Ausente en respuestas de un backend viejo (previo a esta funcionalidad) — se asume in_progress. */
  status?: RouteSessionStatus;
}

function toRouteSession(data: RouteSessionWireFormat): RouteSession {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    status: data.status ?? RouteSessionStatus.InProgress,
  };
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
  return toRouteSession(data);
}

/**
 * A diferencia de `parseRouteSessionResponse`, acá un 404 ("no hay ruta para finalizar") sí es un
 * error — no tiene sentido "finalizar" algo que no existe.
 */
export async function parseFinishRouteSessionResponse(
  response: Pick<Response, 'ok' | 'status' | 'json'>,
): Promise<RouteSession> {
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? 'No se pudo finalizar la ruta.');
  }

  const data = (await response.json()) as RouteSessionWireFormat;
  return toRouteSession(data);
}
