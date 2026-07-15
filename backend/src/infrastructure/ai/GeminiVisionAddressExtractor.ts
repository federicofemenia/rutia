import { GoogleGenAI } from '@google/genai';
import type { AddressExtractor } from '../../domain/AddressExtractor.js';
import type { DeliveryAddress } from '../../domain/DeliveryAddress.js';

const EXTRACTION_PROMPT =
  'Sos un asistente que extrae datos de una etiqueta de envío a partir de una foto. ' +
  'Identificá la dirección completa de destino y su código postal. ' +
  'Si no podés leer alguno de los dos campos con confianza, devolvé un string vacío en ese campo.';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    address: { type: 'string' },
    postalCode: { type: 'string' },
  },
  required: ['address', 'postalCode'],
};

export class GeminiVisionAddressExtractor implements AddressExtractor {
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
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

    return JSON.parse(response.text) as DeliveryAddress;
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
