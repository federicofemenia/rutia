import { GoogleGenAI } from '@google/genai';
import type { AddressExtractor, ExtractedAddressQuery } from '../../domain/AddressExtractor.js';

const EXTRACTION_PROMPT =
  'Sos un asistente que lee la etiqueta de un envío en una foto y arma un texto de búsqueda de ' +
  'dirección, listo para pegar en un buscador de direcciones (como Google Maps). ' +
  'Reglas: ' +
  '1. Reconstruí la dirección en lenguaje natural y bien escrita, en una sola línea: calle, ' +
  'altura, localidad/barrio, provincia. Corregí errores obvios de OCR (letras confundidas, ' +
  'espacios de más, mayúsculas pegadas) cuando estés razonablemente seguro de la corrección. ' +
  '2. Si la etiqueta dice "Calle San Martín", el nombre real de la calle es "San Martín" — ' +
  '"Calle" es un rótulo genérico, no forma parte del nombre. Sí conservá "Avenida"/"Av.", ' +
  '"Bulevar", "Ruta", "Pasaje" o "Diagonal" cuando son parte real del nombre. ' +
  '3. Si la etiqueta dice "CABA" o "Capital Federal", escribí "Ciudad Autónoma de Buenos Aires" ' +
  'en vez de "Buenos Aires" — son entidades distintas y no hay que confundirlas. ' +
  '4. Agregá "Argentina" al final del texto cuando no esté explícito en la etiqueta, salvo que ' +
  'ya sea evidente por otro dato (por ejemplo, un código postal argentino). ' +
  '5. Nunca inventes calle, altura, localidad o provincia que no puedas leer o inferir con ' +
  'confianza razonable (por ejemplo, de un código postal que reconozcas con certeza). Si falta ' +
  'un dato, simplemente omitilo del texto en vez de inventarlo. ' +
  '6. Excluí del texto cualquier dato que no sea parte de la dirección: nombres de personas, ' +
  'números de teléfono, referencias ("al lado de", "portón negro"), observaciones o ' +
  'instrucciones de entrega. El texto final debe ser solo la dirección. ' +
  '7. CRÍTICO: si la imagen no muestra ninguna etiqueta de envío, ninguna dirección, o no tiene ' +
  'contenido legible en absoluto (por ejemplo, está en blanco, es un color sólido, o no hay texto ' +
  'visible), NO inventes ninguna dirección bajo ningún motivo, ni siquiera una plausible para ' +
  'algún lugar real. En ese caso devolvé query como string vacío (""), confidence 0 y ' +
  'needsUserConfirmation true. Preferí siempre devolver vacío antes que arriesgar un dato que no ' +
  'está en la imagen. ' +
  '8. confidence (0 a 1): qué tan seguro estás de haber leído bien la dirección completa. Si no ' +
  'hay ninguna dirección visible en la imagen, confidence debe ser 0, nunca un valor alto. ' +
  '9. needsUserConfirmation: true si la imagen está borrosa, la dirección es ambigua, falta un ' +
  'dato esencial (como la calle), o no hay ninguna dirección legible; false solo si estás ' +
  'razonablemente seguro de haber leído una dirección real presente en la imagen. ' +
  'Respondé únicamente el JSON pedido, sin texto adicional.';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    query: { type: 'string' },
    confidence: { type: 'number' },
    needsUserConfirmation: { type: 'boolean' },
  },
  required: ['query', 'confidence', 'needsUserConfirmation'],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * No confía directamente en el JSON del modelo: valida el tipo real de cada campo en vez de
 * asumir que Gemini respetó el schema al pie de la letra.
 */
export function toExtractedAddressQuery(response: unknown): ExtractedAddressQuery {
  if (!isRecord(response)) {
    throw new Error('Gemini devolvió una respuesta con formato inesperado.');
  }

  const query = typeof response.query === 'string' ? response.query.trim() : '';
  const confidence = typeof response.confidence === 'number' ? Math.min(1, Math.max(0, response.confidence)) : 0;
  const needsUserConfirmation = typeof response.needsUserConfirmation === 'boolean' ? response.needsUserConfirmation : true;

  return { query, confidence, needsUserConfirmation };
}

export class GeminiVisionAddressExtractor implements AddressExtractor {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 15000,
        retryOptions: { attempts: 2 },
      },
    });
    this.model = model;
  }

  async extract(imageDataUrl: string): Promise<ExtractedAddressQuery> {
    const { mimeType, data } = parseDataUrl(imageDataUrl);

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [{ text: EXTRACTION_PROMPT }, { inlineData: { mimeType, data } }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: RESPONSE_SCHEMA,
      },
    });

    if (!response.text) {
      throw new Error('Gemini no devolvió contenido en la respuesta.');
    }

    return toExtractedAddressQuery(JSON.parse(response.text));
  }
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error('Formato de imagen inválido, se esperaba un data URL en base64.');
  }
  const [, mimeType, data] = match;
  return { mimeType, data };
}
