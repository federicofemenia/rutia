import { Alert, Autocomplete, Stack, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete';
import type { PlaceSelection, PlaceSuggestion } from '../types';

const SEARCH_DEBOUNCE_MS = 300;

interface PlacesAutocompleteInputProps {
  /** Texto con el que arranca la búsqueda (ej. el `query` que devolvió Gemini de la etiqueta). */
  initialQuery?: string;
  label?: string;
  onSelect: (selection: PlaceSelection) => void;
}

/**
 * Único punto de entrada de direcciones de la app: a diferencia del formulario manual que
 * reemplaza, nunca deja pasar texto libre — solo `onSelect` con una sugerencia realmente elegida
 * y ya resuelta a coordenadas vía Place Details.
 */
export function PlacesAutocompleteInput({ initialQuery = '', label = 'Dirección', onSelect }: PlacesAutocompleteInputProps) {
  const { suggestions, status, isReady, search, selectSuggestion, reset } = usePlacesAutocomplete();
  const [inputValue, setInputValue] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didRunInitialSearch = useRef(false);

  // `<APIProvider>` carga el script de Google Maps de forma asíncrona: si se dispara la búsqueda
  // inicial antes de que `isReady` sea true, `search` no hace nada (silenciosamente, sin
  // suggestions), y sin este `isReady` en las dependencias nunca se reintentaba una vez que la
  // librería terminaba de cargar — quedaba en "sin resultados" para siempre.
  useEffect(() => {
    if (!didRunInitialSearch.current && isReady && initialQuery.trim()) {
      didRunInitialSearch.current = true;
      void search(initialQuery);
    }
  }, [initialQuery, isReady, search]);

  // Sin esto, cuando el campo arranca prellenado con `initialQuery` (el texto de Gemini) el
  // desplegable de sugerencias nunca se abre solo — MUI Autocomplete solo lo abre automáticamente
  // cuando el usuario tipea, no cuando `options` cambia por una búsqueda disparada por código. Sin
  // sugerencias visibles no hay nada que tocar/clickear para confirmar.
  useEffect(() => {
    if (suggestions.length > 0) {
      setOpen(true);
    }
  }, [suggestions]);

  const handleInputChange = (value: string, reason: string) => {
    if (reason !== 'input') {
      return;
    }

    setInputValue(value);
    setResolveError(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => void search(value), SEARCH_DEBOUNCE_MS);
  };

  const handleSelect = async (suggestion: PlaceSuggestion | null) => {
    if (!suggestion) {
      return;
    }

    setResolving(true);
    setResolveError(null);
    const selection = await selectSuggestion(suggestion);
    setResolving(false);

    if (!selection) {
      setResolveError('No se pudo obtener el detalle de esa dirección. Probá con otra sugerencia.');
      return;
    }

    setInputValue(suggestion.text);
    reset();
    onSelect(selection);
  };

  return (
    <Stack spacing={1}>
      <Autocomplete
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        openOnFocus
        options={suggestions}
        getOptionLabel={(option) => option.text}
        isOptionEqualToValue={(option, value) => option.text === value.text}
        filterOptions={(options) => options}
        loading={status === 'loading' || resolving}
        loadingText="Buscando..."
        noOptionsText={inputValue.trim() ? 'Sin resultados' : 'Empezá a escribir para buscar'}
        inputValue={inputValue}
        onInputChange={(_event, value, reason) => handleInputChange(value, reason)}
        onChange={(_event, value) => void handleSelect(value)}
        renderInput={(params) => <TextField {...params} label={label} placeholder="Buscá la dirección..." fullWidth size="small" autoFocus />}
      />
      {resolveError && (
        <Alert severity="error" variant="outlined">
          {resolveError}
        </Alert>
      )}
    </Stack>
  );
}
