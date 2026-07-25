import { useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';

// TEMPORAL — ver features/map/debug/mapDiagnosticsStore.ts. Borrar junto con el resto del panel.

export interface MapInstanceInfo {
  hasMap: boolean;
  hasDiv: boolean;
  clientWidth: number | null;
  clientHeight: number | null;
  childCount: number | null;
}

interface MapDiagnosticsControllerProps {
  /** Pasar el setter de `useState` directo (no una arrow function nueva en cada render) — así la
   *  referencia es estable entre renders y el efecto no reentra en loop. */
  onUpdate: (info: MapInstanceInfo) => void;
}

/** Solo puede vivir DENTRO de `<Map>` — `useMap()` lee del contexto que `<Map>` provee a sus hijos. */
export function MapDiagnosticsController({ onUpdate }: MapDiagnosticsControllerProps) {
  const map = useMap();

  useEffect(() => {
    const div = map?.getDiv() ?? null;
    onUpdate({
      hasMap: Boolean(map),
      hasDiv: Boolean(div),
      clientWidth: div?.clientWidth ?? null,
      clientHeight: div?.clientHeight ?? null,
      childCount: div ? div.children.length : null,
    });
  }, [map, onUpdate]);

  return null;
}
