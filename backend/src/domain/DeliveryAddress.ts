export interface DeliveryAddress {
  street: string;
  streetNumber?: string;
  postalCode?: string;
  locality: string;
  province: string;
  country: string;
  rawAddress?: string;
  /** Id de Google Place de donde se resolvió esta dirección, si vino de Places Autocomplete. */
  placeId?: string;
  /** Dirección formateada tal como la devuelve Google Place Details, para mostrar/reusar como
   *  texto de búsqueda sin tener que reconstruirla a partir de los campos estructurados. */
  formattedAddress?: string;
  /** Quién resolvió las coordenadas de esta entrega (ej. "google-places"). Ausente en entregas
   *  viejas resueltas por el geocoder de texto libre que este campo reemplaza. */
  geocodingProvider?: string;
  /** ISO 8601, cuándo se resolvió. */
  geocodedAt?: string;
}
