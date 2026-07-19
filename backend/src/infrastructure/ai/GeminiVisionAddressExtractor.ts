import { GoogleGenAI } from '@google/genai';
import type { AddressExtractor } from '../../domain/AddressExtractor.js';
import type { DeliveryAddress } from '../../domain/DeliveryAddress.js';
import { normalizePostalCode, normalizeProvinceName } from '../../domain/normalizeAddress.js';

const DEFAULT_COUNTRY = 'Argentina';

const EXTRACTION_PROMPT =
  'Sos un asistente que extrae datos de una etiqueta de envío a partir de una foto. ' +
  'Identificá estos campos de la dirección de destino, cada uno por separado: ' +
  '- street: el nombre de la calle, SIN el número de puerta/altura y SIN la palabra genérica ' +
  '"Calle" al principio (ej. si la etiqueta dice "Calle San Martín", street debe ser "San ' +
  'Martín", no "Calle San Martín" — "Calle" es solo un rótulo, no forma parte del nombre real ' +
  'en Argentina). Sí conservá otros tipos de vía cuando son parte real del nombre, como ' +
  '"Avenida"/"Av.", "Bulevar", "Ruta", "Pasaje" o "Diagonal". si encontras Gral., devolve General ' +
  '- streetNumber: el número de puerta/altura, si la etiqueta lo muestra; si no aparece, null. ' +
  '- postalCode: el código postal — el numérico tradicional de 4 dígitos, o el CPA alfanumérico ' +
  'argentino (ej. "M5502ABC"), que es más específico y se prefiere si aparecen los dos; si no ' +
  'podés leerlo, null. ' +
  '- locality: la localidad, barrio o partido específico (ej. "Merlo", "Ramos Mejía", "Palermo"). ' +
  'Es crítico que sea específico: "Buenos Aires" sola no alcanza, porque es ambigua entre la ' +
  'Ciudad Autónoma de Buenos Aires y cualquiera de los partidos de la provincia. ' +
  '- province: la provincia. Si la etiqueta dice "CABA" o "Capital Federal", escribí ' +
  '"Ciudad Autónoma de Buenos Aires" — nunca la confundas ni la mezcles con "Buenos Aires" ' +
  '(la provincia): son entidades distintas. ' +
  '- country: el país; "Argentina" si no se indica otro. ' +
  '- rawAddress: el texto de dirección tal como aparece en la etiqueta, sin modificar. ' +
  'Extraé solo datos visibles en la imagen, o que puedas inferir con confianza razonable (por ' +
  'ejemplo, a partir de un código postal que conozcas con certeza podés inferir su localidad). ' +
  'Nunca inventes una localidad, provincia o altura que no tengas forma de conocer, y nunca ' +
  'devuelvas la dirección completa concatenada dentro de street. Si un dato no es visible ni ' +
  'podés inferirlo con confianza, devolvé un string vacío ("") en los campos de texto ' +
  'obligatorios (street, locality, province, country, rawAddress) o null en los opcionales ' +
  '(streetNumber, postalCode).';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    street: { type: 'string' },
    streetNumber: { type: ['string', 'null'] },
    postalCode: { type: ['string', 'null'] },
    locality: { type: 'string' },
    province: { type: 'string' },
    country: { type: 'string' },
    rawAddress: { type: 'string' },
  },
  required: ['street', 'streetNumber', 'postalCode', 'locality', 'province', 'country', 'rawAddress'],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * No confía directamente en el JSON del modelo: valida el tipo real de cada campo y aplica los
 * mismos normalizadores que usa el resto del dominio, en vez de asumir que Gemini respetó el
 * schema al pie de la letra.
 */
function toDeliveryAddress(response: unknown): DeliveryAddress {
  if (!isRecord(response)) {
    throw new Error('Gemini devolvió una respuesta con formato inesperado.');
  }

  const street = typeof response.street === 'string' ? response.street.trim() : '';
  const streetNumber =
    typeof response.streetNumber === 'string' && response.streetNumber.trim() ? response.streetNumber.trim() : undefined;
  const postalCode = typeof response.postalCode === 'string' ? normalizePostalCode(response.postalCode) : undefined;
  const locality = typeof response.locality === 'string' ? response.locality.trim() : '';
  const provinceRaw = typeof response.province === 'string' ? response.province.trim() : '';
  const province = provinceRaw ? normalizeProvinceName(provinceRaw) : '';
  const country = typeof response.country === 'string' && response.country.trim() ? response.country.trim() : DEFAULT_COUNTRY;
  const rawAddress = typeof response.rawAddress === 'string' ? response.rawAddress : undefined;

  return { street, streetNumber, postalCode, locality, province, country, rawAddress };
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

  async extract(imageDataUrl: string): Promise<DeliveryAddress> {
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

    return toDeliveryAddress(JSON.parse(response.text));
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
