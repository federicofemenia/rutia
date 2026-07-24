import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useCallback, useRef, useState } from 'react';
import type { Coordinates } from '../../route';
import type { PlaceSelection, PlaceSuggestion } from '../types';
import { parseAddressComponents } from '../utils/parseAddressComponents';

export type PlacesAutocompleteStatus = 'idle' | 'loading' | 'error';

const PLACE_DETAILS_FIELDS = ['id', 'formattedAddress', 'location', 'addressComponents'];

interface UsePlacesAutocompleteResult {
  suggestions: PlaceSuggestion[];
  status: PlacesAutocompleteStatus;
  /** `false` mientras `<APIProvider>` todavía está cargando el script de Google Maps — `search`
   *  no hace nada mientras tanto (ver por qué en `PlacesAutocompleteInput`). */
  isReady: boolean;
  /** Busca sugerencias para `input`. Reusa el mismo session token entre búsquedas sucesivas. */
  search: (input: string) => Promise<void>;
  /** Pide Place Details de la sugerencia elegida y arma un `PlaceSelection` resuelto. Descarta el
   *  session token después (uno por búsqueda, como pide la facturación por sesión de Google). */
  selectSuggestion: (suggestion: PlaceSuggestion) => Promise<PlaceSelection | null>;
  reset: () => void;
}

/**
 * Envuelve la Places JS API "New" (`AutocompleteSuggestion`/`AutocompleteSessionToken`) vía el
 * SDK oficial (`useMapsLibrary('places')`) en vez de REST manual — ver adjunto de arquitectura en
 * docs/google-migration.md. Restringido a Argentina porque RUTIA solo opera acá.
 */
export function usePlacesAutocomplete(): UsePlacesAutocompleteResult {
  const placesLibrary = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [status, setStatus] = useState<PlacesAutocompleteStatus>('idle');

  const getOrCreateSessionToken = useCallback((): google.maps.places.AutocompleteSessionToken | null => {
    if (!placesLibrary) {
      return null;
    }
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, [placesLibrary]);

  const search = useCallback(
    async (input: string) => {
      if (!placesLibrary || input.trim().length === 0) {
        setSuggestions([]);
        return;
      }

      setStatus('loading');

      try {
        const { suggestions: results } = await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: getOrCreateSessionToken() ?? undefined,
          includedRegionCodes: ['ar'],
        });

        setSuggestions(
          results
            .filter((result) => result.placePrediction !== null)
            .map((result) => ({ text: result.placePrediction!.text.text, prediction: result.placePrediction! })),
        );
        setStatus('idle');
      } catch {
        setSuggestions([]);
        setStatus('error');
      }
    },
    [placesLibrary, getOrCreateSessionToken],
  );

  const selectSuggestion = useCallback(async (suggestion: PlaceSuggestion): Promise<PlaceSelection | null> => {
    try {
      const place = suggestion.prediction.toPlace();
      await place.fetchFields({ fields: PLACE_DETAILS_FIELDS });

      if (!place.location || !place.addressComponents) {
        return null;
      }

      const parsed = parseAddressComponents(place.addressComponents);
      const coordinates: Coordinates = { latitude: place.location.lat(), longitude: place.location.lng() };

      return {
        address: {
          ...parsed,
          ...(place.id ? { placeId: place.id } : {}),
          ...(place.formattedAddress ? { formattedAddress: place.formattedAddress } : {}),
          geocodingProvider: 'google-places',
          geocodedAt: new Date().toISOString(),
        },
        coordinates,
      };
    } catch {
      return null;
    } finally {
      // Uno por búsqueda: se descarta después de pedir Place Details, sin importar el resultado,
      // para que la próxima búsqueda arranque un session token nuevo (así se factura por sesión,
      // no por request).
      sessionTokenRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setSuggestions([]);
    setStatus('idle');
    sessionTokenRef.current = null;
  }, []);

  return { suggestions, status, isReady: placesLibrary !== null, search, selectSuggestion, reset };
}
