export interface ExtractedAddressQuery {
  /** Texto de búsqueda listo para Places Autocomplete: dirección reconstruida en lenguaje
   *  natural, sin nombres/teléfonos/observaciones, con "Argentina" agregado cuando corresponde. */
  query: string;
  /** 0-1, qué tan seguro está el extractor de haber leído la dirección correctamente. */
  confidence: number;
  /** true cuando la imagen es ilegible, ambigua, o falta información esencial (ej. sin calle) —
   *  señal para que la UI le pida al chofer confirmar/corregir el texto antes de buscarlo. */
  needsUserConfirmation: boolean;
}

export interface AddressExtractor {
  extract(imageBase64: string): Promise<ExtractedAddressQuery>;
}
