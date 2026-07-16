import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MAP_CONFIG } from '../config/mapConfig';

interface MapBoundsControllerProps {
  positions: [number, number][];
}

export function MapBoundsController({ positions }: MapBoundsControllerProps) {
  const map = useMap();

  // Firma por contenido, no por referencia: `positions` cambia de referencia en cada render
  // donde cambie session.deliveries (por ejemplo, al actualizar solo el status de una entrega),
  // aunque las coordenadas sigan siendo las mismas. El efecto solo debe reencuadrar cuando las
  // coordenadas visibles realmente cambian.
  const positionsSignature = positions.map(([latitude, longitude]) => `${latitude},${longitude}`).join('|');

  // Dependencia intencional: `positionsSignature` (contenido), no `positions`/`map` (referencia).
  // Ver comentario arriba.
  /* oxlint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    map.invalidateSize();

    if (positions.length === 0) {
      return;
    }

    if (positions.length === 1) {
      map.setView(positions[0], MAP_CONFIG.singlePointZoom);
      return;
    }

    map.fitBounds(positions, { padding: MAP_CONFIG.boundsPadding });
  }, [positionsSignature]);
  /* oxlint-enable react-hooks/exhaustive-deps */

  return null;
}
