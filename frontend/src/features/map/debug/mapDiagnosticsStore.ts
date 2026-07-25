/**
 * TEMPORAL — diagnóstico del mapa sin verse en mobile en producción. Borrar todo `features/map/
 * debug/` y sus usos (MapDiagnosticsPanel, MapDiagnosticsController, el wiring en AppProviders)
 * una vez encontrada la causa real.
 *
 * Store externo simple (no Context) para juntar errores que pasan FUERA del árbol de React
 * (listeners globales de `window`) con lo que reporta `<APIProvider onError>` — que solo se puede
 * declarar donde se instancia el provider (`AppProviders.tsx`), lejos de donde se muestra el
 * panel. `useSyncExternalStore` es la forma estándar de React de suscribirse a esto de forma
 * reactiva sin useState/Context.
 */
export interface MapDiagnosticsState {
  apiProviderError: string | null;
  globalErrors: string[];
}

let state: MapDiagnosticsState = { apiProviderError: null, globalErrors: [] };
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function reportApiProviderError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  state = { ...state, apiProviderError: message };
  notify();
}

export function reportGlobalError(message: string): void {
  // Guarda las últimas 5 nomás — esto es un panel de debug, no un logger persistente.
  state = { ...state, globalErrors: [...state.globalErrors, message].slice(-5) };
  notify();
}

export function getMapDiagnosticsSnapshot(): MapDiagnosticsState {
  return state;
}

export function subscribeMapDiagnostics(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
