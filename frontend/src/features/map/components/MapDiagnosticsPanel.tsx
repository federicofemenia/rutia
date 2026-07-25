import { Box, Typography } from '@mui/material';
import type { APILoadingStatus } from '@vis.gl/react-google-maps';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { getMapDiagnosticsSnapshot, reportGlobalError, subscribeMapDiagnostics } from '../debug/mapDiagnosticsStore';
import type { MapInstanceInfo } from './MapDiagnosticsController';

// TEMPORAL — panel de diagnóstico en pantalla (sin consola remota del celular disponible) para el
// bug de "el mapa no se ve en mobile en producción". Borrar este archivo, MapDiagnosticsController,
// features/map/debug/, y el wiring en AppProviders.tsx una vez encontrada la causa real.

const GOOGLE_MAPS_BROWSER_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_API_KEY ?? '';

function maskKey(key: string): string {
  if (!key) {
    return '(vacía)';
  }
  return `presente, terminada en "${key.slice(-4)}"`;
}

function checkWebglSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

interface DiagnosticRowProps {
  label: string;
  value: string;
  ok?: boolean;
}

function DiagnosticRow({ label, value, ok }: DiagnosticRowProps) {
  return (
    <Typography
      component="div"
      variant="caption"
      sx={{ fontFamily: 'monospace', color: ok === false ? '#fca5a5' : ok === true ? '#86efac' : 'inherit' }}
    >
      {label}: {value}
    </Typography>
  );
}

interface MapDiagnosticsPanelProps {
  loadingStatus: APILoadingStatus;
  mapInstanceInfo: MapInstanceInfo | null;
}

export function MapDiagnosticsPanel({ loadingStatus, mapInstanceInfo }: MapDiagnosticsPanelProps) {
  const diagnostics = useSyncExternalStore(subscribeMapDiagnostics, getMapDiagnosticsSnapshot);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportGlobalError(`window.onerror: ${event.message} (${event.filename}:${event.lineno})`);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
      reportGlobalError(`unhandledrejection: ${reason}`);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  const browserSupport = useMemo(
    () => ({
      ResizeObserver: typeof ResizeObserver !== 'undefined',
      structuredClone: typeof structuredClone !== 'undefined',
      'crypto.randomUUID': typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function',
      IntersectionObserver: typeof IntersectionObserver !== 'undefined',
      WebGL: checkWebglSupport(),
    }),
    [],
  );

  return (
    <Box
      sx={{
        flexShrink: 0,
        p: 1.5,
        bgcolor: '#0F172A',
        color: '#e2e8f0',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
      }}
    >
      <Typography variant="overline" sx={{ color: '#facc15' }}>
        Panel de diagnóstico temporal
      </Typography>

      <DiagnosticRow label="DeliveryMap montado" value="sí" ok />
      <DiagnosticRow label="apiKey" value={maskKey(GOOGLE_MAPS_BROWSER_API_KEY)} ok={Boolean(GOOGLE_MAPS_BROWSER_API_KEY)} />
      <DiagnosticRow
        label="mapId"
        value={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '(vacío)'}
        ok={Boolean(import.meta.env.VITE_GOOGLE_MAPS_MAP_ID)}
      />
      <DiagnosticRow label="Estado carga API" value={loadingStatus} ok={loadingStatus === 'LOADED'} />
      <DiagnosticRow
        label="Error de APIProvider"
        value={diagnostics.apiProviderError ?? '(ninguno)'}
        ok={!diagnostics.apiProviderError}
      />

      <Typography variant="overline" sx={{ mt: 1, color: '#facc15' }}>
        Instancia del mapa (dentro de &lt;Map&gt;)
      </Typography>
      {mapInstanceInfo ? (
        <>
          <DiagnosticRow label="useMap() truthy" value={String(mapInstanceInfo.hasMap)} ok={mapInstanceInfo.hasMap} />
          <DiagnosticRow label="map.getDiv() truthy" value={String(mapInstanceInfo.hasDiv)} ok={mapInstanceInfo.hasDiv} />
          <DiagnosticRow
            label="div.clientWidth"
            value={String(mapInstanceInfo.clientWidth)}
            ok={Boolean(mapInstanceInfo.clientWidth)}
          />
          <DiagnosticRow
            label="div.clientHeight"
            value={String(mapInstanceInfo.clientHeight)}
            ok={Boolean(mapInstanceInfo.clientHeight)}
          />
          <DiagnosticRow
            label="hijos dentro de div"
            value={String(mapInstanceInfo.childCount)}
            ok={Boolean(mapInstanceInfo.childCount)}
          />
        </>
      ) : (
        <DiagnosticRow label="MapDiagnosticsController" value="todavía no reportó nada (¿no montó <Map>?)" ok={false} />
      )}

      <Typography variant="overline" sx={{ mt: 1, color: '#facc15' }}>
        APIs del navegador
      </Typography>
      {Object.entries(browserSupport).map(([name, supported]) => (
        <DiagnosticRow key={name} label={name} value={supported ? 'soportado' : 'NO soportado'} ok={supported} />
      ))}

      <Typography variant="overline" sx={{ mt: 1, color: '#facc15' }}>
        Errores globales capturados ({diagnostics.globalErrors.length})
      </Typography>
      {diagnostics.globalErrors.length === 0 ? (
        <DiagnosticRow label="—" value="ninguno todavía" ok />
      ) : (
        diagnostics.globalErrors.map((message, index) => (
          <Typography key={index} variant="caption" sx={{ fontFamily: 'monospace', color: '#fca5a5', wordBreak: 'break-word' }}>
            {message}
          </Typography>
        ))
      )}
    </Box>
  );
}
