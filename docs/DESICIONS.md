# Decisiones

## 2026-07-12 — Usar Google Gemini (gemini-2.5-flash) en lugar de OpenAI Vision para extracción de direcciones (durante desarrollo/pruebas)

**Contexto**

CLAUDE.md define el stack de IA como "OpenAI Vision". Se llegó a implementar un primer adaptador (`OpenAiVisionAddressExtractor`) sobre el puerto `AddressExtractor` para extraer dirección y código postal desde la foto de una etiqueta. Antes de seguir avanzando, surgió la sugerencia de usar Gemini 2.5 Flash por tener tier gratuito.

**Decisión**

Se reemplaza el adaptador de IA por uno que usa la API de Gemini (`gemini-2.5-flash`), manteniendo el mismo puerto `AddressExtractor` del dominio. Esto aplica **solo durante la etapa de desarrollo/pruebas**, no es la decisión definitiva de producción.

**Motivos**

- El tier gratuito de Gemini alcanza de sobra para desarrollo y pruebas manuales (límites aproximados: 15 RPM / 1500 requests por día).
- Aun en tier pago, Gemini 2.5 Flash es más económico que el modelo de OpenAI evaluado ($0.30 / $2.50 por millón de tokens input/output, contra $1 / $6).
- La arquitectura hexagonal ya definida hace que este cambio sea de bajo riesgo: `domain` y `application` no conocen la existencia de OpenAI ni de Gemini, solo el adaptador en `infrastructure/ai` cambia.

**Riesgo pendiente a revisar antes de producción**

Los términos del tier gratuito de Gemini permiten a Google usar los prompts para entrenar sus modelos. Acá se envían fotos con **direcciones reales de clientes** (dato personal / de ubicación). Antes de tener usuarios reales, hay que decidir conscientemente entre tier pago (de Gemini o de otro proveedor) para evitar ese uso de datos. No se debe llegar a producción con esta configuración sin revisar este punto.

**Estado:** adoptada para desarrollo. Pendiente de revisión antes de producción.

**Actualización 2026-07-12:** al probar la integración, `gemini-2.5-flash` devolvió error 404 ("no longer available to new users"). Google lo deprecó para cuentas nuevas. Se cambió el modelo a `gemini-3.5-flash` (vigente, sin fecha de baja anunciada al momento de escribir esto). La decisión de fondo (usar Gemini en vez de OpenAI) no cambia, solo el modelo puntual. Probado extremo a extremo contra la API real: responde `200` con el JSON estructurado esperado.

**Actualización 2026-07-15:** `gemini-3.5-flash` empezó a devolver `503 UNAVAILABLE` ("high demand") de forma consistente, y el SDK reintentaba 5 veces con backoff por defecto, haciendo que cada request tardara 20-30+ segundos (se percibía como timeout). Se configuró `httpOptions.timeout: 15000` y `retryOptions.attempts: 2` en el cliente de `@google/genai` para acotar el tiempo de respuesta. Además, se listaron los modelos realmente disponibles para esta API key vía `client.models.list()` (`gemini-2.5-flash-lite` también resultó deprecado con 404, aunque figura en el listado) y se cambió el modelo a **`gemini-3.1-flash-lite`**, que respondió rápido y estable (4/4 pruebas exitosas, 1-4s). Se descubrieron además los alias `gemini-flash-latest` / `gemini-flash-lite-latest` que Google mantiene apuntando siempre al modelo recomendado vigente — quedan como opción a evaluar en el futuro para reducir el mantenimiento manual frente a deprecaciones, aunque por ahora se prefirió un nombre de modelo concreto y pineado por previsibilidad.

## 2026-07-15 — Usar los servidores públicos de OSRM y Nominatim (sin API key) para optimizar rutas, durante desarrollo/pruebas

**Contexto**

El sprint de optimización de rutas requiere geocodificar direcciones (texto → coordenadas) y luego resolver el orden óptimo de visita. Se armó `Geocoder` / `NominatimGeocoder` y `RouteOptimizer` / `OSRMRouteOptimizer` sobre los servidores **públicos de demostración** de esos proyectos: `nominatim.openstreetmap.org` y `router.project-osrm.org`.

**Decisión**

No se pidió ninguna API key para esto porque estos servidores son gratuitos y abiertos — no requieren autenticación. Es una decisión **solo para desarrollo/pruebas**, igual que la de Gemini.

**Motivos**

- Cero fricción para arrancar a probar el flujo de optimización sin gestionar credenciales nuevas.
- Misma garantía de bajo acoplamiento que ya validamos con Gemini/OpenAI: `domain` (`Geocoder`, `RouteOptimizer`) no sabe que existen Nominatim ni OSRM, solo los adaptadores en `infrastructure/geocoding` e `infrastructure/routing`.

**Riesgos pendientes a revisar antes de producción**

- Son servicios comunitarios "best effort", **sin SLA** — mismo tipo de problema de disponibilidad que ya tuvimos con el free tier de Gemini.
- Nominatim exige un uso responsable (~1 request/segundo, header `User-Agent` identificando la app) — no está pensado para volumen real de producción.
- Antes de tener usuarios reales, evaluar: un servidor OSRM propio, un plan pago de geocoding, o migrar directamente a Google Routes API (ya está en el stack objetivo de CLAUDE.md para navegación).

**Estado:** adoptada para desarrollo. Pendiente de revisión antes de producción.

## 2026-07-15 — Bug de precisión: geocodificación enviaba a la calle correcta pero en la localidad equivocada

**Contexto**

Al usar la navegación externa (Google Maps/Waze), algunas direcciones abrían en un lugar incorrecto, aunque la calle coincidiera. Se reprodujo contra la API real de Nominatim: `"Av. Rivadavia 1500, Buenos Aires, Argentina"` (sin localidad puntual) geocodifica a Monserrat, CABA, mientras que `"Av. Rivadavia 1500, Ramos Mejía, Buenos Aires, Argentina"` (con localidad específica) geocodifica correctamente a Ramos Mejía — a ~15km de distancia. La causa: "Buenos Aires" es ambiguo (Ciudad vs. Provincia, que contiene decenas de partidos), y Nominatim asume la Ciudad por defecto cuando falta esa precisión. Es un problema real y frecuente en Argentina, donde nombres de calle como "San Martín" o "Rivadavia" se repiten en muchísimas localidades.

**Decisión**

Se reforzó el prompt de extracción de Gemini (`GeminiVisionAddressExtractor`) para exigir explícitamente la localidad/barrio puntual, no solo la provincia, advirtiendo específicamente sobre la ambigüedad de "Buenos Aires". Se agregó `countrycodes=ar` a la consulta de `NominatimGeocoder` para descartar falsos positivos de otros países (no resuelve la ambigüedad dentro de Argentina, pero es una mejora sin desventajas).

**Riesgo pendiente**

Esto depende de que Gemini extraiga la localidad correctamente cada vez — no hay garantía total con texto libre. El formulario editable de la entrega (paso de revisión antes de confirmar) queda como red de seguridad para que el repartidor corrija la dirección si la ve incompleta. Si la imprecisión persiste en uso real, la solución más robusta sería reestructurar `Delivery` con campos separados (calle, localidad, provincia) y usar el modo de búsqueda **estructurada** de Nominatim (`street`/`city`/`state`/`country` como parámetros separados en vez de un texto libre) — se verificó que da resultados exactos, pero implica un cambio de modelo de datos más grande, no aplicado todavía.

**Estado:** mitigado con cambio de prompt. Pendiente de confirmar con uso real si alcanza o si hace falta estructurar los datos.

**Actualización 2026-07-15:** se confirmó un segundo caso real ("San Juan 2325, CP 1722" — debía ser Merlo, resolvía a la calle San Juan en Rosario). Se probó también usar el código postal como parámetro **estructurado** de Nominatim (`postalcode=1722`, sin localidad) y devolvió **cero resultados** — la cobertura de códigos postales argentinos en OpenStreetMap no alcanza para resolver por sí sola, así que el código postal no sirve como atajo de geocodificación. Se verificó en cambio que Gemini (`gemini-3.1-flash-lite`) identifica correctamente que el CP 1722 corresponde a "Merlo, Buenos Aires" cuando se le pregunta directamente, así que se amplió el prompt para pedirle explícitamente que infiera la localidad a partir del código postal (usando su conocimiento general) cuando la etiqueta no muestre el nombre de la localidad de forma explícita. No se pudo probar este ajuste con una foto real de etiqueta en este entorno (sin herramientas para generar una imagen de prueba) — queda pendiente de confirmación por el usuario con una etiqueta real.

**Actualización 2026-07-16 — rediseño del modelo de direcciones (`DeliveryAddress` estructurado) y confirmación con etiqueta real:** se reemplazó `Delivery.address: string` por un `DeliveryAddress` estructurado (`street`, `streetNumber`, `postalCode`, `locality`, `province`, `country`, `rawAddress`) tanto en frontend como en backend, con `Delivery.geocodingStatus` (`pending`/`verified`/`ambiguous`/`notFound`) como resultado explícito del proceso de geocodificación. El prompt de Gemini se actualizó para devolver estos campos por separado en vez de un texto concatenado, y `NominatimGeocoder` pasó a usar búsqueda **estructurada** (`street`/`city`/`state`/`postalcode`/`country`, con `countrycodes=ar` y `addressdetails=1`) con validación de candidatos contra la provincia/localidad esperadas — ya no se toma el primer resultado de Nominatim sin verificar. Sin `locality`, nunca se devuelve `verified` (una coincidencia solo por provincia no alcanza para confirmar una dirección — caso real detectado: "Av. Rivadavia 1500, Buenos Aires" sin localidad resolvía en Junín). `OptimizeRoute` separa entregas verificadas de ambiguas/no encontradas en vez de bloquear todo el recorrido por una sola dirección problemática.

Se probó con una etiqueta real de un envío ("Calle Alvar Núñez Cabeza de Vaca 1351, CP 1744, MORENO" — sin la palabra "Buenos Aires" en ningún lado de la etiqueta) escaneada a través de la app: Gemini leyó bien la dirección e infirió correctamente la provincia ("Buenos Aires") a partir de la localidad/CP, tal como se esperaba. Con esto queda confirmado el pendiente que había quedado abierto en la actualización anterior — el ajuste de inferencia de localidad/provincia por CP funciona con fotos reales, no solo en las pruebas manuales de texto.

## 2026-07-21 — Migración de `node:sqlite` a `@libsql/client`, preparando Turso para development/production

**Contexto**

La persistencia usaba `node:sqlite` (`DatabaseSync`), built-in de Node, elegido originalmente por cero dependencias. Para poder desplegar con una base remota (Turso: `rutia-development` en la rama `development`, `rutia-production` en `main`) hace falta un cliente que hable con SQLite tanto local como remoto detrás de la misma interfaz — `node:sqlite` no tiene modo remoto.

**Decisión**

Se reemplazó `DatabaseSync` por `@libsql/client` (build de Node, nunca `@libsql/client/web`) en los dos repositorios (`SqliteUserRepository`, `SqliteRouteSessionRepository`) y en `createDatabase`. La configuración de conexión quedó como unión discriminada (`{provider:'sqlite', path}` | `{provider:'turso', url, authToken}`), validada estrictamente al arrancar vía `env.ts` — `DATABASE_PROVIDER` es obligatorio y sin default implícito, sin non-null assertions. Se separó `createDatabaseClient` (crea el `Client`) de `runMigrations` (aplica migraciones) y de la definición de migraciones (`migrations/migrations.ts`), en vez de dejarlo todo mezclado en `createDatabase` como antes.

Se agregó una tabla `schema_migrations` y un runner de migraciones versionadas (forward-only, sin rollback en esta etapa): cada migración es una lista de sentencias (no un string con `;`), y corre en un único `client.batch(...)` junto con su INSERT en `schema_migrations` — si cualquier sentencia falla, se revierte todo el batch y no queda registrada. La migración `0001_init` reproduce el esquema que ya existía (no cambia ninguna tabla).

No se tocaron los puertos de dominio (`UserRepository`, `RouteSessionRepository`) ni los casos de uso — ya declaraban todos sus métodos como `Promise`, así que el cambio de un driver síncrono a uno asíncrono no les pidió ningún ajuste. Sí se propagó `async` a `createApp()`/`server.ts` (antes `createApp()` era síncrono) y se agregó cierre controlado del cliente ante `SIGINT`/`SIGTERM`, junto con el servidor HTTP.

**Incompatibilidad real encontrada**

`node:sqlite` no hacía cumplir `PRAGMA foreign_keys` por defecto (la `FOREIGN KEY (user_id) REFERENCES users(id)` de `route_sessions` estaba declarada pero nunca se hacía valer). El cliente local de libSQL sí la exige por defecto. En uso real no debería afectar nada — `route_sessions` solo se guarda para un usuario ya autenticado, que por lo tanto ya existe en `users` — pero quedó como comportamiento distinto a documentar; los tests de repositorio ahora insertan un usuario real antes de guardar su sesión.

**Verificación antes de tocar el archivo real**

Se copió `backend/data/rutia.sqlite` (nunca se abrió el original con el código nuevo) y se corrió `createDatabase` sobre la copia. Se comparó el volcado de `users`/`route_sessions` antes/después con `sqlite3` CLI (independiente del código propio): sin diferencias. El checksum SHA-256 del archivo original se verificó idéntico al final del proceso.

**Riesgos pendientes**

- No hay rollback de migraciones — una migración mal escrita que ya se aplicó (`IF NOT EXISTS` no ayuda si el problema es de datos, no de esquema) requiere una migración nueva que corrija, no revertir la vieja.
- Turso en sí (crear las bases `rutia-development`/`rutia-production`, configurar las variables en cada ambiente desplegado) queda fuera de esta tarea a propósito — esto solo prepara el código para poder apuntarle.

**Estado:** implementado y verificado localmente (tests, build, arranque manual con SQLite local, seed). Pendiente de probar contra una base Turso real antes de desplegar.
