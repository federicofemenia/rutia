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
