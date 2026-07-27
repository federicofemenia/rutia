/**
 * Claves de `localStorage` que en algún momento llegaron a guardar la RouteSession del chofer
 * (bug: clave global sin scope de usuario — cualquier cuenta nueva en el mismo navegador heredaba
 * la ruta de la anterior). El backend, scopeado por usuario, es ahora la única fuente de verdad;
 * esto solo limpia rastros de instalaciones existentes.
 */
export const LEGACY_ROUTE_STORAGE_KEYS = ['rutia:route-session'];

export function clearLegacyRouteStorage(): void {
  try {
    for (const key of LEGACY_ROUTE_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage puede fallar por cuota excedida o modo privado (Safari) — no hay una acción
    // segura adicional que tomar, y no debe romper el arranque de la app.
  }
}
