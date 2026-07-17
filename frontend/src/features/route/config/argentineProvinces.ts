/**
 * Duplicado intencionalmente en backend (`domain/argentineProvinces.ts`): son dos proyectos
 * con package managers independientes, sin workspace compartido. Mismo criterio ya usado en
 * el proyecto para `Coordinates`. Si cambia esta lista, replicar el cambio en el archivo
 * equivalente del backend.
 */
export const ARGENTINE_PROVINCES = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Ciudad Autónoma de Buenos Aires',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const;

export type ArgentineProvince = (typeof ARGENTINE_PROVINCES)[number];

export function isArgentineProvince(value: string): value is ArgentineProvince {
  return (ARGENTINE_PROVINCES as readonly string[]).includes(value);
}
