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
