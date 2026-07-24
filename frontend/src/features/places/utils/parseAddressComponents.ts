const DEFAULT_COUNTRY = 'Argentina';

export interface ParsedGoogleAddress {
  street: string;
  streetNumber?: string;
  locality: string;
  postalCode?: string;
  province: string;
  country: string;
}

function findComponent(
  components: google.maps.places.AddressComponent[],
  type: string,
): google.maps.places.AddressComponent | undefined {
  return components.find((component) => component.types.includes(type));
}

/**
 * Google ya resuelve la dirección de forma autoritativa (calle, localidad, provincia, código
 * postal) — a diferencia del geocoder de texto libre que reemplaza, acá no hace falta ninguna
 * heurística de desambiguación propia, solo traducir los tipos de componente de Google a los
 * campos que ya usa el resto de la app.
 */
export function parseAddressComponents(components: google.maps.places.AddressComponent[]): ParsedGoogleAddress {
  const street = findComponent(components, 'route')?.longText ?? '';
  const streetNumber = findComponent(components, 'street_number')?.longText ?? undefined;
  const locality =
    findComponent(components, 'locality')?.longText ??
    findComponent(components, 'sublocality')?.longText ??
    findComponent(components, 'administrative_area_level_2')?.longText ??
    '';
  const postalCode = findComponent(components, 'postal_code')?.longText ?? undefined;
  const province = findComponent(components, 'administrative_area_level_1')?.longText ?? '';
  const country = findComponent(components, 'country')?.longText ?? DEFAULT_COUNTRY;

  return { street, streetNumber, locality, postalCode, province, country };
}
