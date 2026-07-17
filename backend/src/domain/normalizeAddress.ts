import type { ArgentineProvince } from './argentineProvinces.js';

/**
 * Normaliza texto libre para comparaciones tolerantes a mayúsculas, tildes, puntuación y
 * espacios — usada tanto para reconocer alias de provincia acá como para comparar localidades
 * contra los resultados de geocodificación (`NominatimGeocoder`).
 */
export function normalizeForComparison(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const PROVINCE_ALIASES: Record<string, ArgentineProvince> = {
  'bs as': 'Buenos Aires',
  'buenos aires': 'Buenos Aires',
  'pcia de buenos aires': 'Buenos Aires',
  'provincia de buenos aires': 'Buenos Aires',
  caba: 'Ciudad Autónoma de Buenos Aires',
  'capital federal': 'Ciudad Autónoma de Buenos Aires',
  'ciudad autonoma de buenos aires': 'Ciudad Autónoma de Buenos Aires',
  'ciudad de buenos aires': 'Ciudad Autónoma de Buenos Aires',
  catamarca: 'Catamarca',
  chaco: 'Chaco',
  chubut: 'Chubut',
  cordoba: 'Córdoba',
  corrientes: 'Corrientes',
  'entre rios': 'Entre Ríos',
  formosa: 'Formosa',
  jujuy: 'Jujuy',
  'la pampa': 'La Pampa',
  'la rioja': 'La Rioja',
  mendoza: 'Mendoza',
  misiones: 'Misiones',
  neuquen: 'Neuquén',
  'rio negro': 'Río Negro',
  salta: 'Salta',
  'san juan': 'San Juan',
  'san luis': 'San Luis',
  'santa cruz': 'Santa Cruz',
  'santa fe': 'Santa Fe',
  'santiago del estero': 'Santiago del Estero',
  'tierra del fuego': 'Tierra del Fuego',
  tucuman: 'Tucumán',
};

/**
 * Devuelve el nombre canónico de la provincia cuando reconoce una equivalencia conocida
 * (abreviatura, variante con/sin tildes, "Capital Federal", etc.). Si no la reconoce,
 * conserva el texto original (limpio de espacios) en vez de descartarlo — puede ser una
 * provincia real que falte en el diccionario de alias, y no queremos perder ese dato.
 */
export function normalizeProvinceName(value: string): string {
  const cleaned = value.trim().replace(/\s+/g, ' ');

  if (!cleaned) {
    return cleaned;
  }

  return PROVINCE_ALIASES[normalizeForComparison(cleaned)] ?? cleaned;
}

/**
 * Limpia formato (espacios, mayúsculas) sin validar de forma estricta el shape del código
 * postal — acepta tanto el CP numérico tradicional (4 dígitos) como el CPA alfanumérico
 * argentino (ej. "M5502ABC"). Un código postal potencialmente útil de una etiqueta borrosa
 * no debe descartarse solo por no calzar exactamente en un patrón.
 */
export function normalizePostalCode(value: string): string | undefined {
  const cleaned = value.replace(/\s+/g, '').toUpperCase();
  return cleaned.length > 0 ? cleaned : undefined;
}
