# Migración a Google Maps Platform

Este documento describe la migración completa de RUTIA de Geoapify + OSRM + Leaflet a Google Maps Platform (Places API, Routes API, Maps JavaScript API). Se actualiza al cerrar cada etapa — ver `## Estado por etapa` al final.

## 1. Arquitectura actual (antes de migrar)

RUTIA sigue Arquitectura Hexagonal en el backend: `domain` define puertos sin conocer infraestructura, `application` orquesta casos de uso contra esos puertos, `infrastructure` implementa adaptadores concretos.

**Geocoding** (texto → coordenadas)
- Puerto: `backend/src/domain/Geocoder.ts` (`geocode(address): Promise<GeocodeResult>`, resultado discriminado `verified | ambiguous | notFound`).
- Adapter: `backend/src/infrastructure/geocoding/GeoapifyGeocoder.ts` (+ `GeoapifyCandidateSelector.ts` para desempatar candidatos por localidad/código postal).
- Casos de uso: `backend/src/application/resolveGeocoding.ts`, `backend/src/application/GeocodeDeliveryAddress.ts`, expuesto en `POST /api/deliveries/geocode`.
- También se invoca desde dentro de `OptimizeRoute.ts`: cualquier entrega `Pending` se geocodifica ahí mismo, con espaciado (`GEOCODING_DELAY_MS`) para respetar el rate-limit de Geoapify.
- Frontend: botón "Ubicar nuevamente" en `DeliveryActionsSheet.tsx` (dispara `useRetryGeocoding`/`retryGeocoding.ts` contra ese endpoint), y `GeocodeOptionsDialog.tsx` para cuando el geocoder devuelve varios candidatos empatados.

**Extracción de dirección desde foto**
- Puerto: `backend/src/domain/AddressExtractor.ts`, devuelve una `DeliveryAddress` estructurada (`street`, `streetNumber`, `postalCode`, `locality`, `province`, `country`, `rawAddress`).
- Adapter: `backend/src/infrastructure/ai/GeminiVisionAddressExtractor.ts` (Gemini Vision), con reglas específicas para Argentina ya afinadas (CABA vs. Provincia de Buenos Aires, prefijo "Calle", inferencia de localidad por código postal).
- La entrega se crea `Pending` con esa `DeliveryAddress`; el formulario manual (`AddressFields.tsx`) permite editarla antes o después de crear la entrega.

**Optimización de ruta** (orden de visita)
- Puerto: `backend/src/domain/RouteOptimizer.ts` (`RouteStops → RouteOptimizationResult` con `order`, `totalDistance`, `totalDuration`, `legs[]`).
- Adapter: `backend/src/infrastructure/routing/OSRMRouteOptimizer.ts`, contra el servidor público `router.project-osrm.org`.
- Caso de uso: `backend/src/application/OptimizeRoute.ts` — geocodifica lo que esté `Pending` y después llama a `RouteOptimizer` con las coordenadas ya resueltas.

**Mapa**
- `frontend/src/features/map/` sobre `react-leaflet`/Leaflet: `DeliveryMap.tsx`, `MapBoundsController.tsx`, íconos custom, CSS propio. Dibuja líneas rectas entre coordenadas (no hay geometría de ruta real disponible hoy). Usado solo en `MapPage.tsx`; su prop `onSelectDelivery` existe pero no está conectada a nada.

**Config/deploy**
- `backend/src/infrastructure/config/env.ts`: `GEMINI_API_KEY`, `GEOAPIFY_API_KEY`, `JWT_SECRET`, etc.
- Sin `render.yaml`/`vercel.json`: todo el deploy es dashboard-based en Render (backend) y Vercel (frontend).
- `docs/DESICIONS.md` (2026-07-15) ya documentaba OSRM/Nominatim como decisión **solo de desarrollo**, con el riesgo pendiente anotado explícitamente: *"evaluar... migrar directamente a Google Routes API"*.

## 2. Por qué migrar

Geoapify, OSRM público y Leaflet fueron elegidos por no requerir API key durante desarrollo. En producción, la IP compartida de Render ya generó 429s contra Nominatim (resuelto migrando a Geoapify), y OSRM público es "best effort" sin SLA. Google Maps Platform da un único ecosistema con SLA, cuotas configurables y, para el caso de uso de RUTIA, permite resolver geocoding **del lado del cliente** con Places Autocomplete + Place Details — eliminando la necesidad de un geocoder de texto libre en el backend para el flujo principal.

## 3. Hallazgo arquitectónico clave

Places Autocomplete + Place Details devuelven coordenadas (`location`) y componentes de dirección (`addressComponents`) en el mismo paso, sin necesidad de Google Geocoding API. Como esto corre en el navegador (necesario para que los Session Tokens de Places funcionen correctamente), **el backend deja de geocodificar direcciones de texto libre en el flujo principal**: una entrega nace con coordenadas ya resueltas porque el usuario seleccionó una sugerencia concreta de Places, o no nace.

Consecuencia directa: todo lo construido para manejar geocoding ambiguo/fallido de forma asincrónica — "Ubicar nuevamente", `GeocodeOptionsDialog`, el loop de geocoding dentro de `OptimizeRoute` — deja de tener un llamador real en el flujo principal. No existe ya un estado intermedio "entrega creada pero sin ubicar" que reintentar, porque la ubicación se resuelve *antes* de que la entrega exista.

## 4. Alcance de la migración

- **Se reemplaza**: Geoapify (adapter) → sin geocoder de texto activo en el flujo principal (resuelto client-side por Places); OSRM → Google Routes API v2; Leaflet → Google Maps JavaScript API (`@vis.gl/react-google-maps`); formulario manual de dirección (`AddressFields.tsx`) → Places Autocomplete SDK.
- **Se mantiene** (ajuste aprobado explícitamente): el puerto `Geocoder`, `resolveGeocoding.ts` y `GeocodeDeliveryAddress.ts` **no se eliminan** — quedan compilando, con sus tests basados en stubs, sin adapter activo detrás. Es infraestructura lista para un futuro caso (import masivo de direcciones, panel de administración) que sí necesite geocoding de texto libre server-side.
- **Se elimina por completo**: "Ubicar nuevamente" y `GeocodeOptionsDialog` (ya no tienen estado que resolver bajo el flujo nuevo).
- **Se agrega**: acción de eliminar en las cards de entregas `Pending` (no iniciadas), que dispara el mismo mecanismo de auto-reoptimización ya existente (`triggerAutoReoptimize`) al borrar.
- **Gemini cambia de forma de salida**: en vez de devolver una `DeliveryAddress` estructurada, devuelve `{ query, confidence, needsUserConfirmation }` — un texto de búsqueda natural que alimenta a Places Autocomplete como valor inicial, no un objeto que se persiste directamente.

## 5. Decisiones de diseño

**Places: SDK oficial (`@vis.gl/react-google-maps` + Places JS "New"), no REST manual.** La Maps JavaScript API ya es una dependencia inevitable para el mapa; usar su librería de Places (`useMapsLibrary('places')`, clases `AutocompleteSuggestion`/`AutocompleteSessionToken`) evita mantener dos superficies de integración distintas y delega en Google el manejo del ciclo de vida de esas clases. Toda la integración queda encapsulada en `frontend/src/features/places/` — ningún tipo de Google se filtra fuera de esa carpeta. Si aparece una limitación real del SDK durante la implementación, se documenta en este archivo (sección "Limitaciones encontradas" más abajo) antes de recurrir a REST como alternativa puntual.

**Mapa: `@vis.gl/react-google-maps`.** Reemplazo estructural directo de `react-leaflet`: `<APIProvider>`+`<Map>` ≈ `<MapContainer>`, `<AdvancedMarker>` ≈ `<Marker>`, `<InfoWindow>` ≈ `<Popup>`, expone `useMap()` igual que `react-leaflet`, permitiendo portar `MapBoundsController.tsx` con la misma estructura. Requiere un Map ID (gratuito, se crea en Cloud Console) para `AdvancedMarker`.

**`DeliveryAddress` se extiende, no se reestructura.** Se agregan campos opcionales nuevos (`placeId`, `formattedAddress`, `geocodingProvider`, `geocodedAt`); los campos existentes (`street`, `streetNumber`, `locality`, `postalCode`, `province`, `country`) se mantienen, ahora parseados desde `addressComponents` de Google en vez de Gemini/formulario manual.

**Compatibilidad con entregas viejas: automática, sin migración de datos.** Ninguna entrega persistida pierde validez: los campos nuevos quedan `undefined` en filas viejas, y ya tienen `coordinates` resueltas por el flujo anterior, así que siguen mostrándose y ruteándose sin cambios.

**Routes API v2, server-side, mismo puerto `RouteOptimizer`.** `POST https://routes.googleapis.com/directions/v2:computeRoutes` con `intermediates` + `optimizeWaypointOrder: true` reemplaza el `/trip` de OSRM: devuelve `optimizedIntermediateWaypointIndex` (≈ `order`), `legs[]`, `distanceMeters`, `duration`, `polyline.encodedPolyline`. Sigue ordenando por índice/coordenadas, nunca por texto. El `X-Goog-FieldMask` es el control de costo principal de esta API — se pide únicamente los campos usados.

## 6. Componentes afectados

**Backend**
- Nuevo: `infrastructure/routing/GoogleRoutesOptimizer.ts` (+ test).
- Modificado: `domain/RouteOptimizer.ts` (campo `encodedPolyline`), `application/OptimizeRoute.ts`, `domain/AddressExtractor.ts`, `infrastructure/ai/GeminiVisionAddressExtractor.ts`, `application/ExtractAddressFromImage.ts`, `infrastructure/config/env.ts`, `infrastructure/http/app.ts`.
- Eliminado: `infrastructure/routing/OSRMRouteOptimizer.ts` (+test), `infrastructure/geocoding/GeoapifyGeocoder.ts`, `GeoapifyCandidateSelector.ts` (+tests), el controller y la ruta `/api/deliveries/geocode`.
- Sin cambios pero sin wiring activo: `domain/Geocoder.ts`, `application/resolveGeocoding.ts`, `application/GeocodeDeliveryAddress.ts` (+tests).

**Frontend**
- Nuevo: `features/places/` (hooks, componentes, utils de parseo).
- Reescrito: `features/map/` sobre `@vis.gl/react-google-maps`.
- Modificado: `features/route/types.ts`, `features/scanner/` (flujo de captura/confirmación), `DeliveryListItem.tsx` (acción de eliminar en `Pending`), `DeliveryActionsSheet.tsx` (saca "Ubicar nuevamente"), `geocodingReviewMessages.ts`, `RouteSummaryPage.tsx`, `EditDeliveryAddressDialog.tsx`, `OptimizeRouteDialog.tsx`, `main.tsx`.
- Eliminado: `features/route/components/AddressFields.tsx`, `GeocodeOptionsDialog.tsx`, `features/route/hooks/useRetryGeocoding.ts`, `features/route/api/retryGeocoding.ts`, dependencias `leaflet`/`react-leaflet`/`@types/leaflet`.

**Config**
- Backend: nueva env var `GOOGLE_MAPS_API_KEY` (solo Routes API); se retira `GEOAPIFY_API_KEY`.
- Frontend: nuevas env vars `VITE_GOOGLE_MAPS_BROWSER_API_KEY` (Maps JavaScript API + Places API) y `VITE_GOOGLE_MAPS_MAP_ID`.

## 7. Estrategia de rollback

La migración se hace en 6 etapas incrementales, cada una compilando y dejando el proyecto funcional (ver `## Plan de archivos, por etapa` del plan de trabajo). Esto acota el rollback a nivel de etapa:

- **Etapa 1 (Routes API)** y **Etapa 2 (Gemini)** son aislados y reversibles con `git revert` del commit de la etapa sin afectar nada más — ningún otro código depende todavía de sus cambios.
- **Etapa 3 (Places/scanner)** es la de mayor riesgo por tamaño. Mientras no se haya hecho la Etapa 5 (limpieza), el código de Geoapify/formulario manual eliminado en Etapa 3 puede recuperarse íntegro desde el historial de git (`git revert`) sin conflictos con etapas posteriores, ya que Etapa 4 (mapa) no depende de Places.
- **Etapa 4 (mapa)** es independiente de Etapa 3 en términos de dependencias de código (ambas leen `Delivery`/`OptimizeRouteSummary`, pero no se llaman entre sí) — revertible por separado.
- **Etapa 5 (limpieza de dependencias)** es la única etapa que hace irreversible en el sentido práctico volver a Leaflet/OSRM sin reinstalar dependencias — por eso se deja para el final, después de validar que Etapas 1-4 compilan y pasan tests.
- En todos los casos, como no hay migración de datos (`DeliveryAddress` solo gana campos opcionales), revertir código no deja datos huérfanos ni requiere rollback de base de datos/`localStorage`.
- Red de seguridad general: cada etapa se implementa y verifica (lint + typecheck + tests + build) antes de pasar a la siguiente, así que un rollback nunca tiene que deshacer más de una etapa a la vez.

## 8. Limitaciones encontradas del SDK (si las hay)

_Pendiente — se completa solo si aparece alguna limitación real del SDK de Places durante la Etapa 3 que obligue a un fallback REST puntual._

## 9. Estado por etapa

| Etapa | Descripción | Estado |
|---|---|---|
| 1 | Routes API reemplaza OSRM | ✅ Completa |
| 2 | Gemini: nuevo prompt y forma de salida | ✅ Completa |
| 3 | Places Autocomplete + Place Details reemplazan el formulario manual | ✅ Completa |
| 4 | Mapa: Google Maps JS reemplaza Leaflet | ✅ Completa |
| 5 | Limpieza de dependencias y código muerto | ✅ Completa |
| 6 | Verificación final (lint + typecheck + tests + build) | ✅ Completa |

Este documento se actualiza al cerrar cada etapa, con lo efectivamente implementado (puede diferir en detalle del plan original si aparece algo no previsto).

### Etapa 1 — completada

- `backend/src/domain/RouteOptimizer.ts`: `RouteOptimizationResult` ganó el campo opcional `encodedPolyline?: string`.
- Nuevo `backend/src/infrastructure/routing/GoogleRoutesOptimizer.ts`: implementa `RouteOptimizer` contra `POST https://routes.googleapis.com/directions/v2:computeRoutes`, con `optimizeWaypointOrder: true` y un `X-Goog-FieldMask` acotado a los campos usados (`optimizedIntermediateWaypointIndex`, `distanceMeters`, `duration`, `polyline.encodedPolyline`, y lo mismo por leg). Reemplaza uno a uno el rol de `OSRMRouteOptimizer.ts` (borrado, junto a su test).
- Nuevo `GoogleRoutesOptimizer.test.ts` (5 casos: sin paradas, headers correctos, mapeo completo incluyendo `encodedPolyline`, sin rutas devueltas, HTTP no-ok) — mismo patrón de `fetch` mockeado que el test borrado.
- `backend/src/infrastructure/config/env.ts` + `.env.example`: nueva variable requerida `GOOGLE_MAPS_API_KEY` (solo para Routes API en esta etapa).
- `backend/src/infrastructure/http/app.ts`: la composición root instancia `GoogleRoutesOptimizer` en vez de `OSRMRouteOptimizer`. El wiring de `GeoapifyGeocoder`/`/api/deliveries/geocode` no se tocó — es tarea de la Etapa 3.
- `backend/src/application/OptimizeRoute.ts` (+test): el `route` summary pasa `encodedPolyline` cuando el optimizador lo devuelve (spread condicional, mismo patrón usado en el resto del código para no persistir `undefined` explícito).
- Verificado: `npm test` (58/58 tests, backend completo) y `npm run build` (tsc, sin errores) en `backend/`.
- Sin llamadas reales a Google todavía — los tests mockean `fetch`, y `GOOGLE_MAPS_API_KEY` es un valor cualquiera en desarrollo hasta que el usuario cargue la key real de Cloud Console.

### Etapa 2 — completada

- `backend/src/domain/AddressExtractor.ts`: nuevo tipo `ExtractedAddressQuery { query: string; confidence: number; needsUserConfirmation: boolean }`, reemplaza `DeliveryAddress` como retorno del puerto.
- `backend/src/infrastructure/ai/GeminiVisionAddressExtractor.ts`: prompt reescrito por completo — pide reconstruir la dirección en una sola línea de texto natural (no campos separados), corregir errores de OCR, agregar "Argentina" cuando falte, nunca inventar datos faltantes (se omiten en vez de inventarse), excluir nombres/teléfonos/referencias/observaciones, y devolver solo JSON. `RESPONSE_SCHEMA` actualizado a `{query, confidence, needsUserConfirmation}`. La función de mapeo (`toExtractedAddressQuery`, antes `toDeliveryAddress`) queda exportada para poder testearla sin mockear el SDK de Gemini — valida tipos, recorta el `query`, acota `confidence` a `[0,1]` y cae a `needsUserConfirmation: true` ante cualquier dato inesperado (fail-safe: ante la duda, pedir confirmación al chofer en vez de asumir que la dirección está bien).
- `backend/src/application/ExtractAddressFromImage.ts`: el tipo de retorno sigue al puerto (`ExtractedAddressQuery`), la lógica de paso-directo no cambió.
- Tests nuevos: `GeminiVisionAddressExtractor.test.ts` (6 casos sobre `toExtractedAddressQuery` — respuesta válida, recorte de espacios, `confidence` fuera de rango, tipos inesperados con defaults seguros, respuesta no-objeto) y `ExtractAddressFromImage.test.ts` (delega en el extractor inyectado, patrón stub ya usado en el resto del proyecto).
- **No se tocó nada del frontend en esta etapa** (a propósito, según el plan de 6 etapas aprobado): `frontend/src/features/address-extraction/api/extractAddress.ts` sigue tipando la respuesta como `DeliveryAddress` (`ExtractedAddress = DeliveryAddress`), y `DeliveryReviewCard`/`AddressFields` siguen leyendo campos estructurados (`street`, `locality`, etc.). Frontend y backend son proyectos TypeScript separados (sin tipos compartidos entre ambos), así que esto **no rompe la compilación de ninguno de los dos** — se verificó con `tsc -b && vite build` en frontend, sin errores. Pero **si se llamara al endpoint real `/api/addresses/extract` ahora, el flujo de escaneo fallaría en tiempo de ejecución** (la respuesta ya no trae `street`/`locality`/etc.) hasta que la Etapa 3 reemplace el formulario manual por Places Autocomplete usando `query` como valor inicial. Esto es esperado dentro del plan de 6 etapas: no se prueba contra la API real todavía, y la Etapa 3 se implementa a continuación en la misma sesión.
- Verificado: `npm test` (64/64, backend) y `npm run build` (tsc) en `backend/`; `npm run build` (tsc -b + vite build) en `frontend/`, ambos sin errores.

### Etapa 3 — completada

**Places, con el SDK oficial (sin necesidad de caer a REST — ver ajuste #1)**
- Nuevo `frontend/src/features/places/`: `hooks/usePlacesAutocomplete.ts` usa `useMapsLibrary('places')` de `@vis.gl/react-google-maps` y las clases `AutocompleteSuggestion`/`AutocompleteSessionToken` de la Places JS API "New" — un session token por búsqueda, reusado entre keystrokes, descartado después de pedir Place Details (`place.fetchFields(...)`). Restringido a Argentina (`includedRegionCodes: ['ar']`). `utils/parseAddressComponents.ts` traduce `addressComponents[]` de Google a `street/streetNumber/locality/postalCode/province/country` (con tests). `components/PlacesAutocompleteInput.tsx` es el único input: usa MUI `Autocomplete` (no `freeSolo`, así que nunca deja "confirmar" texto sin seleccionar una sugerencia real), debounce de 300ms sin librerías nuevas.
- No apareció ninguna limitación real del SDK que obligara a un fallback REST — no hizo falta usar la sección "Limitaciones encontradas" de este documento.
- `@vis.gl/react-google-maps` se agregó como dependencia en esta etapa (no en la 4), porque Places ya lo necesita para `useMapsLibrary`. `@types/google.maps` se agregó como devDependency para los tipos ambientales `google.maps.*` (tsconfig `types` tuvo que ampliarse: `["vite/client", "google.maps"]`, antes solo permitía `vite/client`).
- `frontend/src/app/providers/AppProviders.tsx`: envuelve la app en `<APIProvider apiKey={VITE_GOOGLE_MAPS_BROWSER_API_KEY}>` — con la key vacía en desarrollo (todavía no configurada), `useMapsLibrary` devuelve `null` y `usePlacesAutocomplete` degrada sin romper nada (no busca, no revienta).
- Nuevo `frontend/.env.example`: `VITE_GOOGLE_MAPS_BROWSER_API_KEY`, `VITE_GOOGLE_MAPS_MAP_ID` (esta última se usa recién en la Etapa 4).

**Reemplazo del formulario manual en los 3 lugares donde se usaba**
- `DeliveryReviewCard.tsx` (revisión del scanner): en vez de campos editables, un solo `PlacesAutocompleteInput` sembrado con el `query` que devolvió Gemini; seleccionar una sugerencia confirma la entrega directamente (ya no hay botón "Confirmar" separado — seleccionar ES confirmar, coherente con que Place Details ya da todo lo necesario).
- `EditDeliveryAddressDialog.tsx`: mismo patrón, sembrado con `formattedAddress` (o el texto armado de los campos estructurados como fallback para entregas viejas).
- `OptimizeRouteDialog.tsx` (paso "enterAddress", destino fijo): mismo patrón; seleccionar dispara la optimización directamente con las coordenadas ya resueltas.
- **Se eliminaron**: `AddressFields.tsx`, `GeocodeOptionsDialog.tsx`, `useRetryGeocoding.ts`, `retryGeocoding.ts` (y sus referencias/exports en el barrel `route/index.ts`).

**"Ubicar nuevamente" eliminado, reemplazado por eliminar + auto-reoptimizar**
- `DeliveryActionsSheet.tsx`: se sacó el botón "Ubicar nuevamente" y toda su lógica (`handleRetryGeocoding`, `handleSelectGeocodeOption`, `applyGeocodingResolution`, los tres estados asociados). "Editar dirección" ahora, al guardar, llama `editDeliveryAddress(id, address, coordinates)` (siempre con coordenadas ya resueltas por Places) y dispara `triggerAutoReoptimize` — mismo patrón que agregar una entrega nueva.
- `DeliveryListItem.tsx`: nuevo ícono de eliminar (`DeleteOutlineOutlined`), visible solo en entregas `DeliveryStatus.Pending` (no iniciadas), posicionado como botón absoluto en la esquina superior de la card (evita anidar un botón dentro del `CardActionArea` que abre el detalle). `RouteSummaryPage.tsx` lo conecta a `removeDelivery` + `triggerAutoReoptimize`, reusando ambos hooks ya existentes.
- `geocodingReviewMessages.ts` y el `Alert` de `RouteSummaryPage.tsx`: el texto ya no menciona "Ubicar nuevamente" — ahora indica "editá la dirección o eliminá la entrega". Estos mensajes solo pueden aparecer en entregas heredadas de antes de la migración (con `Ambiguous`/`NotFound`/`Pending`), porque el flujo nuevo nunca las produce.

**Geocoder: se borra el adapter, se mantiene el puerto (ajuste #2)**
- Borrados: `backend/src/infrastructure/geocoding/GeoapifyGeocoder.ts`, `GeoapifyCandidateSelector.ts` (+test), `backend/src/infrastructure/http/geocodeDeliveryAddressController.ts`, la ruta `/api/deliveries/geocode` y su import en `app.ts`. También se borró `backend/src/domain/normalizeAddress.ts` (+test): era lógica de normalización específica de Geoapify (CABA, códigos postales) sin otro llamador tras borrar el adapter — código muerto real, no infraestructura para el futuro.
- Se mantienen, compilando, sin wiring activo: `backend/src/domain/Geocoder.ts`, `backend/src/application/resolveGeocoding.ts`, `backend/src/application/GeocodeDeliveryAddress.ts` (+tests con stubs) — se actualizó el comentario de esta última para reflejar que ya no la usa "Ubicar nuevamente" (que no existe más) sino que queda lista para un futuro caso de import/administración.
- `env.ts`/`.env.example`: se quitó `GEOAPIFY_API_KEY` (nada la lee ya).

**`OptimizeRoute` simplificado (el hallazgo clave, ahora implementado)**
- Ya no recibe `Geocoder` en el constructor ni geocodifica nada: solo ordena entregas que ya llegan con `geocodingStatus: Verified` y `coordinates`. Se borró todo el loop de geocoding, `GEOCODING_DELAY_MS`, `resolveEndCoordinates` y la rama `{address: DeliveryAddress}` de `end` (que servía para que el backend geocodificara un destino fijo tipeado a mano — ya no aplica, porque el destino también se resuelve vía Places del lado del cliente antes de llamar a `/api/routes/optimize`). `OptimizeRouteInput.end` es ahora directamente `Coordinates`.
- Una entrega `Pending`/`Ambiguous`/`NotFound` heredada de antes de esta migración simplemente no se rutea (se cuenta en `stats`, no se toca su `geocodingStatus`) — se resuelve editando la dirección (que ahora siempre pasa por Places) o eliminándola.
- `optimizeRouteController.ts`: ya no acepta `endAddress`, solo `end` con coordenadas.
- Actualicé `OptimizeRoute.test.ts` en consecuencia (se sacaron `ThrowingGeocoder`/`FailingGeocoder`, ya no aplican).

**`DeliveryAddress` extendida (frontend y backend, mismo shape)**
- Campos nuevos opcionales en ambos: `placeId`, `formattedAddress`, `geocodingProvider`, `geocodedAt` — a diferencia de la propuesta original que ponía `geocodingProvider`/`geocodedAt` directo en `Delivery`, terminaron dentro de `DeliveryAddress` (es donde vive el resto de la metadata de cómo se resolvió la dirección; mantiene `Delivery` sin crecer). Compatibilidad automática con entregas viejas: los campos nuevos quedan `undefined`, nada se migra.
- `RouteSummaryInfo.customDestinationAddress?: DeliveryAddress` se reemplazó por `customDestination?: CustomDestination` (`{address, coordinates}`) — antes el destino fijo se re-geocodificaba en cada recálculo automático (`useAutoReoptimize` reenviaba `{address}` y el backend lo resolvía); ahora se reenvían las coordenadas ya resueltas directamente, sin geocoding de por medio.
- Se borró el tipo `GeocodeCandidateOption` (frontend) y `updateDeliveryGeocoding`/`UPDATE_DELIVERY_GEOCODING` de `RouteContext` — quedaron sin ningún llamador tras sacar "Ubicar nuevamente". Se borró `hasAddressChanged.ts` (la lógica de "resetear a Pending si cambió la dirección" ya no aplica: editar la dirección ahora siempre resuelve a `Verified` de una).

**Gap de tests conocido, documentado explícitamente**
El proyecto no tiene infraestructura de testing de componentes/hooks de React (los tests existentes, antes y después de esta migración, son 100% funciones puras vía `node:test` — el script `test` de `frontend/package.json` ni siquiera ejecuta archivos `.tsx`). Agregar tests para `usePlacesAutocomplete`, `PlacesAutocompleteInput` o el flujo de eliminar-y-reoptimizar de `RouteSummaryPage` hubiera requerido sumar una dependencia nueva (jsdom + React Testing Library) no justificada solo para esta migración — se optó por no hacerlo, siguiendo la regla del proyecto de no agregar librerías sin justificar. Sí se testearon con `node:test` las partes puras y aislables: `parseAddressComponents` (4 casos) en el frontend, y toda la lógica de `OptimizeRoute` reescrita en el backend.
- Verificado: `npm test` (45/45, backend, bajó de 64 porque se borraron los tests de Geoapify) y `npm run build` (tsc) en `backend/`; `npm test` (19/19), `npm run lint` (oxlint, limpio) y `npm run build` (tsc -b + vite build) en `frontend/` — todos sin errores. Sigue sin probarse contra Google real (sin keys configuradas todavía).

### Etapa 4 — completada

- `frontend/src/features/map/components/DeliveryMap.tsx` reescrito sobre `@vis.gl/react-google-maps`: `<Map mapId={...}>` reemplaza `<MapContainer>`+`<TileLayer>`; `<AdvancedMarker>` con un `<div>` como contenido (badge numerado con el color de estado, igual que antes) reemplaza `<Marker icon={divIcon(...)}>`; `<InfoWindow anchor={marker}>` (anclado vía `useAdvancedMarkerRef()`) reemplaza `<Popup>`, mismo contenido (parada, calle, localidad, estado). Se borraron `createDeliveryMarkerIcon.ts`/`createCurrentLocationIcon.ts` y sus `.css` — el contenido de un `AdvancedMarker` es JSX normal, no hace falta la API de íconos de Leaflet (`divIcon` + CSS aparte).
- **Polyline exclusivamente de Google Routes, nunca recalculada en React**: `<Polyline encodedPath={routeSummary.encodedPolyline}>` decodifica el string que ya venía en la respuesta de `/api/routes/optimize` (agregado en la Etapa 1) — el componente `Polyline` del SDK decodifica internamente, no hace falta la librería `geometry` ni decodificar a mano. A diferencia de la versión Leaflet (que dibujaba una línea recta entre las coordenadas de las entregas en orden de visita, una aproximación), ahora es la geometría real de la ruta. Si todavía no se optimizó (`routeSummary` es `null` o sin `encodedPolyline`), no se dibuja ninguna línea — antes sí se dibujaba la aproximación recta.
- `MapBoundsController.tsx`: misma estructura que la versión Leaflet (mismo patrón de "firma por contenido, no por referencia" para el `useEffect`), pero con la API de Google (`map.fitBounds(bounds, padding)` con un `google.maps.LatLngBounds`, `map.setCenter`/`map.setZoom` para un solo punto) en vez de `map.fitBounds(positions, {padding})`/`map.setView`. Se sacó el `map.invalidateSize()` (específico de Leaflet para detectar resize del contenedor) — `<Map>` de vis.gl ya maneja el resize del contenedor internamente.
- `MapPage.tsx`: conecté `onSelectDelivery` (existía pero no se usaba) para abrir `DeliveryActionsSheet`, mismo patrón que `RouteSummaryPage.tsx` (estado `selectedDelivery`/`navigationTarget`, `NavigationDialog`) — el alcance chico que se aprobó ("conectar lo que ya existe", sin split view nuevo). También le paso `routeSummary` (antes `MapPage` solo leía `session.deliveries`, nunca `routeSummary` — confirmado en la investigación previa a esta etapa) para que el polyline tenga la geometría real.
- `main.tsx`: se sacó el import de `leaflet/dist/leaflet.css` (el `<APIProvider>` de Google ya se había agregado en `AppProviders.tsx` durante la Etapa 3, porque Places ya lo necesitaba — no hizo falta agregar nada nuevo acá).
- `mapConfig.ts`: se sacaron `tileUrl`/`attribution`/`maxZoom` (specíficos de tiles de OpenStreetMap); se agregó `mapId` (de `VITE_GOOGLE_MAPS_MAP_ID`, ya declarada en `.env.example` desde la Etapa 3).
- `leaflet`/`react-leaflet`/`@types/leaflet` **todavía no se desinstalaron** (es tarea de la Etapa 5) — el build ya no los usa en ningún import, pero siguen en `package.json` hasta la limpieza final.
- Verificado: `npm test` (19/19), `npm run lint` (oxlint, limpio) y `npm run build` (tsc -b + vite build) en `frontend/`, sin errores. El bundle de producción bajó de ~843KB a ~692KB (gzip 259KB → 214KB) y el CSS de ~15.7KB a ~0.18KB solo por sacar el import de `leaflet.css` — la baja de JS es porque Leaflet dejó de importarse en ningún módulo alcanzable, aunque el paquete siga instalado.

### Etapa 5 — completada

- `pnpm remove leaflet react-leaflet @types/leaflet` en `frontend/` — confirmado con grep que no queda ninguna referencia a "leaflet" en el código fuente ni en `package.json`.
- Barrido de comentarios que mencionaban OSRM en código que ya no lo usa (`formatRouteMetrics.ts`, `buildDeliveryLegInfo.ts`) — actualizados a "Google Routes". Se dejó intacta una mención a OSRM en `GoogleRoutesOptimizer.ts` que explica el paralelismo de diseño con el adapter anterior (contexto histórico correcto, no una referencia obsoleta).
- Nueva entrada en `docs/DESICIONS.md` (2026-07-24) resumiendo la migración completa para el registro histórico de decisiones — con enlace conceptual a este documento para el detalle etapa por etapa.
- No se tocó `docs/ROADMAP.md`: está vacío en el repo, no había nada que actualizar sin inventar contenido no pedido.
- Revisado con `git status` el conjunto completo de cambios de las 5 etapas — todo el código eliminado (Geoapify, OSRM, Leaflet, "Ubicar nuevamente", `normalizeAddress.ts`, `hasAddressChanged.ts`, `GeocodeCandidateOption`) fue intencional y está justificado en las secciones de cada etapa; nada quedó a mitad de camino.
- Verificado: suite completa de backend (45/45 tests, `tsc` limpio) y frontend (19/19 tests, `oxlint` limpio, `tsc -b && vite build` limpio) después de la limpieza — sin regresiones.

### Etapa 6 — completada

Verificación final combinada, ambos proyectos, después de las 5 etapas anteriores:

| Proyecto | Lint | Typecheck | Tests | Build |
|---|---|---|---|---|
| `backend/` | (sin script de lint separado; `tsc` cubre errores de tipo) | ✅ `tsc` sin errores | ✅ 45/45 | ✅ `tsc` |
| `frontend/` | ✅ `oxlint` sin hallazgos | ✅ `tsc -b` sin errores | ✅ 19/19 | ✅ `vite build` |

Sin llamadas reales a ninguna API de Google en toda la migración — construido y verificado 100% con tests mockeados/stubs y compilación estática, a pedido explícito ("construí todo primero, sin probar en vivo"). Queda pendiente, y así se deja explícito, la prueba end-to-end real (escanear una etiqueta → Places Autocomplete → Place Details → optimizar con Routes API → ver el mapa con Google Maps JS) una vez que se configuren las credenciales reales de Google Cloud — ver la sección de próximos pasos del informe final.

## 10. Informe final

### 10.1 Arquitectura final

Se mantuvo Arquitectura Hexagonal en el backend sin excepciones: el dominio no conoce Google (ni conoció Geoapify/OSRM antes).

- **`RouteOptimizer`** (puerto sin cambios de forma, solo ganó `encodedPolyline?` opcional) → adapter `GoogleRoutesOptimizer` (Routes API v2). Reemplaza a `OSRMRouteOptimizer` (eliminado).
- **`Geocoder`** (puerto intacto) → **sin adapter activo**. `GeoapifyGeocoder` fue eliminado; `resolveGeocoding.ts`/`GeocodeDeliveryAddress.ts` siguen compilando con tests basados en stubs, listos para un futuro adapter (import masivo, panel de administración) que el flujo principal no necesita hoy.
- **`AddressExtractor`** (puerto con nueva forma de retorno: `ExtractedAddressQuery {query, confidence, needsUserConfirmation}` en vez de `DeliveryAddress`) → adapter `GeminiVisionAddressExtractor`, prompt reescrito para producir texto de búsqueda en vez de campos estructurados.
- **`OptimizeRoute`** (caso de uso) simplificado: ya no depende de `Geocoder`, solo ordena entregas que llegan con coordenadas ya resueltas.
- **Frontend**: geocoding 100% client-side vía `features/places/` (nueva, encapsula `@vis.gl/react-google-maps` + Places JS "New" — ningún tipo de Google se filtra fuera de esa carpeta). `features/map/` reescrita sobre el mismo SDK para el mapa (`<Map>`, `<AdvancedMarker>`, `<InfoWindow>`, `<Polyline encodedPath>`). `features/route`/`features/route-optimization`/`features/scanner` adaptadas para consumir `PlaceSelection` (dirección + coordenadas ya resueltas) en vez de un formulario de texto libre.
- **Flujo nuevo**: Foto → Gemini (`query` de búsqueda) → Places Autocomplete (sembrado con ese `query`) → el chofer selecciona una sugerencia real → Place Details → `Delivery` nace `Verified` con coordenadas, o no nace. Sin geocoding server-side en el camino feliz.

### 10.2 Archivos modificados (44)

Backend: `application/{ExtractAddressFromImage,GeocodeDeliveryAddress,OptimizeRoute,OptimizeRoute.test}.ts`, `domain/{AddressExtractor,DeliveryAddress,RouteOptimizer}.ts`, `infrastructure/ai/GeminiVisionAddressExtractor.ts`, `infrastructure/config/env.ts`, `infrastructure/http/{app,optimizeRouteController}.ts`, `.env.example`.

Frontend: `app/providers/AppProviders.tsx`, `features/address-extraction/{api/extractAddress,hooks/useExtractAddress,index}.ts`, `features/map/{components/DeliveryMap,components/MapBoundsController,config/mapConfig}.ts(x)`, `features/route-optimization/{components/OptimizeRouteDialog,hooks/useOptimizeDeliveries}.ts(x)`, `features/route/{api/optimizeRoute,components/DeliveryActionsSheet,components/DeliveryListItem,components/EditDeliveryAddressDialog,config/geocodingReviewMessages,context/RouteContext,context/routeContextObject,context/routeReducer,hooks/useAutoReoptimize,index,types,utils/buildDeliveryLegInfo,utils/formatRouteMetrics}.ts(x)`, `features/scanner/{components/DeliveryReviewCard,hooks/useDeliveryCapture,types}.ts(x)`, `main.tsx`, `pages/{Map/MapPage,RouteSummary/RouteSummaryPage,Scan/ScanPage}.tsx`, `tsconfig.app.json`, `package.json`.

Documentación: `docs/DESICIONS.md` (nueva entrada).

### 10.3 Archivos eliminados (17)

Backend: `domain/normalizeAddress.ts` (+test), `infrastructure/geocoding/GeoapifyGeocoder.ts`, `infrastructure/geocoding/GeoapifyCandidateSelector.ts` (+test), `infrastructure/http/geocodeDeliveryAddressController.ts`, `infrastructure/routing/OSRMRouteOptimizer.ts` (+test).

Frontend: `features/map/components/{currentLocationIcon.css,deliveryMarkerIcon.css}`, `features/map/utils/{createCurrentLocationIcon,createDeliveryMarkerIcon}.ts`, `features/route/api/retryGeocoding.ts`, `features/route/components/{AddressFields,GeocodeOptionsDialog}.tsx`, `features/route/hooks/useRetryGeocoding.ts`, `features/route/utils/hasAddressChanged.ts`.

### 10.4 Archivos nuevos

Backend: `infrastructure/routing/GoogleRoutesOptimizer.ts` (+test), `application/ExtractAddressFromImage.test.ts`, `infrastructure/ai/GeminiVisionAddressExtractor.test.ts`.

Frontend: `features/places/` completa (`types.ts`, `hooks/usePlacesAutocomplete.ts`, `components/PlacesAutocompleteInput.tsx`, `utils/parseAddressComponents.ts` (+test), `index.ts`), `.env.example`.

Documentación: `docs/google-migration.md` (este documento).

### 10.5 Dependencias agregadas

- `@vis.gl/react-google-maps` (`^1.9.0`, frontend `dependencies`) — SDK oficial de Google/visgl, usado tanto para Places (Etapa 3) como para el mapa (Etapa 4).
- `@types/google.maps` (`3.65.3`, frontend `devDependencies`) — tipos ambientales `google.maps.*`, necesarios porque `tsconfig.app.json` restringe `types` explícitamente (tuvo que ampliarse a `["vite/client", "google.maps"]`).

### 10.6 Dependencias eliminadas

- `leaflet` (`1.9.4`), `react-leaflet` (`5.0.0`) — frontend `dependencies`.
- `@types/leaflet` (`1.9.21`) — frontend `devDependencies`.
- Ningún paquete npm de Geoapify/OSRM existía (eran integraciones `fetch` planas, sin SDK) — su eliminación fue solo de archivos, no de `package.json`.

### 10.7 Variables de entorno nuevas

**Backend** (`.env`, nunca commiteadas — `GEOAPIFY_API_KEY` se retiró):
```
GOOGLE_MAPS_API_KEY=   # Routes API únicamente
```

**Frontend** (`.env`, nunca commiteadas):
```
VITE_GOOGLE_MAPS_BROWSER_API_KEY=   # Maps JavaScript API + Places API
VITE_GOOGLE_MAPS_MAP_ID=            # Map ID gratuito, para AdvancedMarker
```

### 10.8 APIs de Google a habilitar (Cloud Console → APIs & Services)

- **Routes API** (`routes.googleapis.com`) — usada por el backend.
- **Places API (New)** — usada por el frontend vía el SDK.
- **Maps JavaScript API** — usada por el frontend para el mapa y como base de la que depende Places JS.
- **Geocoding API: NO hace falta habilitarla.** Confirmado durante el diseño (sección 3): Place Details ya devuelve `location` + `addressComponents` en el mismo paso.

### 10.9 Restricciones recomendadas por API key

**`GOOGLE_MAPS_API_KEY` (backend, servidor)**
- Application restrictions: **IP addresses** — la(s) IP saliente(s) del servicio en Render. (Render con IP dinámica: usar "None" temporalmente y monitorear uso, o contratar una IP estática si Render lo ofrece en el plan usado.)
- API restrictions: únicamente **Routes API**.
- Nunca exponer esta key al frontend ni commitearla — vive solo en las env vars de Render.

**`VITE_GOOGLE_MAPS_BROWSER_API_KEY` (frontend, navegador)**
- Application restrictions: **HTTP referrers** — el dominio de producción en Vercel (`https://*.vercel.app/*` o el dominio custom si se configura) y `http://localhost:5173/*` para desarrollo.
- API restrictions: únicamente **Maps JavaScript API** y **Places API**.
- Esta key SÍ queda visible en el bundle del cliente (es pública por diseño) — su única protección real es la restricción por referrer + restricción por API, no el secreto de la key en sí.

### 10.10 Configuración de cuotas y presupuesto (Google Cloud Billing)

- **Cloud Console → Billing → Budgets & alerts**: crear un presupuesto mensual con alertas escalonadas (ej. 50%/90%/100%) al mail del responsable del proyecto — esto es lo único que protege contra un consumo inesperado, ninguna de las dos API keys tiene un "hard cap" de gasto por sí sola salvo que se configure explícitamente.
- **Cloud Console → APIs & Services → Quotas**: fijar límites diarios conservadores por API (`requests per day`) para Routes, Places y Maps JavaScript acordes al volumen real esperado de repartidores/entregas — el default de Google es alto, pensado para producción a escala, no para el volumen inicial de RUTIA.
- **Control de costo ya incorporado en el código** (no requiere configuración adicional, pero vale documentarlo): Session Tokens en Places (se agrupan búsqueda + selección en una sola unidad de facturación en vez de cobrar cada keystroke) y `X-Goog-FieldMask` acotado en Routes (se piden solo los campos usados: orden, distancia, duración, polyline).

### 10.11 Pasos de deploy

**Render (backend)**
1. Dashboard → el servicio de RUTIA → Environment → agregar `GOOGLE_MAPS_API_KEY` con la key restringida por IP.
2. Quitar `GEOAPIFY_API_KEY` si seguía configurada (ya no se lee).
3. Deploy del branch con estos cambios — el build (`tsc`) falla rápido y explícito si falta `GOOGLE_MAPS_API_KEY` (mismo patrón que las demás env vars requeridas, vía `requireEnv`).

**Vercel (frontend)**
1. Project Settings → Environment Variables → agregar `VITE_GOOGLE_MAPS_BROWSER_API_KEY` y `VITE_GOOGLE_MAPS_MAP_ID`, restringidas por HTTP referrer al dominio de Vercel.
2. Redeploy — Vite las incluye en el bundle en build time (por eso el prefijo `VITE_`), no hay paso manual adicional.

**Antes de habilitar tráfico real en producción**
- Habilitar las 3 APIs (10.8) en el proyecto de Google Cloud correspondiente.
- Configurar el budget/alertas (10.10) ANTES de la primera prueba real, no después.
- Probar el flujo completo una vez (escanear → Places → optimizar → mapa) contra las APIs reales — esta migración se construyó y verificó 100% con mocks/stubs, a pedido explícito, así que esta es la única validación end-to-end que falta.

### 10.12 Mejoras futuras posibles

- Usar `placeId` (ya persistido en `DeliveryAddress`) como waypoint de Routes API en vez de lat/lng — Google lo soporta y puede mejorar precisión en direcciones ambiguas a nivel de edificio/entrada.
- Reconectar el puerto `Geocoder` con un nuevo adapter (Google Geocoding API u otro) para un caso de import masivo de direcciones en lote o un panel de administración — la infraestructura ya quedó lista (puerto + casos de uso + tests con stubs), solo faltaría el adapter y su wiring en `app.ts`.
- Code-splitting del bundle del frontend (`@vis.gl/react-google-maps` es el mayor contribuyente nuevo al bundle) — Vite ya avisa que el chunk principal supera 500KB; un `dynamic import()` de las páginas de Mapa/Escaneo podría reducir el JS inicial.
- Agregar tests de componentes/hooks de React (`usePlacesAutocomplete`, `PlacesAutocompleteInput`, el flujo de mapa) si el proyecto decide sumar jsdom + React Testing Library — hoy no existe esa infraestructura y no se agregó sin justificación específica para esta migración.
- Clustering de marcadores (`AdvancedMarker` lo soporta vía librerías complementarias de Google) si el volumen de entregas por ruta crece lo suficiente como para saturar el mapa visualmente.
