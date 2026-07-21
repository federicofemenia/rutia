/**
 * Configuración de conexión a la base, ya validada. `provider` decide qué otros campos existen
 * (unión discriminada) — así un `DatabaseConfig` con `provider: 'turso'` sin `url`/`authToken`
 * ni siquiera puede construirse, en vez de fallar recién al usarlo.
 */
export type DatabaseConfig =
  | { provider: 'sqlite'; path: string }
  | { provider: 'turso'; url: string; authToken: string };
