import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import type { Coordinates } from '../../route';
import { MAP_CONFIG } from '../config/mapConfig';

interface MapBoundsControllerProps {
  positions: Coordinates[];
}

export function MapBoundsController({ positions }: MapBoundsControllerProps) {
  const map = useMap();

  // Firma por contenido, no por referencia: `positions` cambia de referencia en cada render
  // donde cambie session.deliveries (por ejemplo, al actualizar solo el status de una entrega),
  // aunque las coordenadas sigan siendo las mismas. El efecto solo debe reencuadrar cuando las
  // coordenadas visibles realmente cambian.
  const positionsSignature = positions.map((point) => `${point.latitude},${point.longitude}`).join('|');

  // Dependencia intencional: `positionsSignature` (contenido), no `positions` (referencia).
  // Ver comentario arriba.
  /* oxlint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!map || positions.length === 0) {
      return;
    }

    if (positions.length === 1) {
      map.setCenter({ lat: positions[0].latitude, lng: positions[0].longitude });
      map.setZoom(MAP_CONFIG.singlePointZoom);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    positions.forEach((point) => bounds.extend({ lat: point.latitude, lng: point.longitude }));
    map.fitBounds(bounds, MAP_CONFIG.boundsPadding);
  }, [map, positionsSignature]);
  /* oxlint-enable react-hooks/exhaustive-deps */

  return null;
}
