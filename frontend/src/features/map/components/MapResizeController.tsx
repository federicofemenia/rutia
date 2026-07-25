import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

/**
 * `@vis.gl/react-google-maps` no usa `ResizeObserver` internamente (confirmado revisando el
 * paquete instalado) — si el contenedor del mapa cambia de tamaño después de que Google Maps ya
 * midió su `<div>` una vez (ej. `dvh` se reacomoda en iOS Safari al colapsar la barra de
 * direcciones, un cambio de orientación, o el mapa vive dentro de un tab/drawer que recién se
 * hace visible), el canvas interno se queda con las dimensiones viejas — nada se lo avisa solo.
 *
 * `google.maps.event.trigger(map, 'resize')` es la forma documentada por Google (parte de
 * `google.maps.event`, no algo específico de esta librería) para decirle al mapa que vuelva a
 * medirse y redibujarse. No hay una alternativa más moderna expuesta por el SDK: `setCenter`/
 * `panTo`/`fitBounds` cambian hacia dónde mira el mapa, no si midió bien su tamaño en píxeles.
 */
export function MapResizeController() {
  const map = useMap();

  useEffect(() => {
    const container = map?.getDiv();
    if (!map || !container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      google.maps.event.trigger(map, 'resize');
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [map]);

  return null;
}
