import type { Coordinates, DeliveryAddress } from '../route';

/** Dirección resuelta con Google Place Details: ya tiene coordenadas, nunca hace falta
 *  geocodificarla después. */
export interface PlaceSelection {
  address: DeliveryAddress;
  coordinates: Coordinates;
}

/** Una sugerencia de Places Autocomplete, antes de resolver sus Place Details. */
export interface PlaceSuggestion {
  /** Texto a mostrar en la lista de sugerencias. */
  text: string;
  prediction: google.maps.places.PlacePrediction;
}
