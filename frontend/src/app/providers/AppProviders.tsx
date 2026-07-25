import { APIProvider } from '@vis.gl/react-google-maps';
import { CssBaseline, ThemeProvider } from '@mui/material';
import type { ReactNode } from 'react';
import { reportApiProviderError } from '../../features/map/debug/mapDiagnosticsStore';
import { theme } from '../theme/theme';

interface AppProvidersProps {
  children: ReactNode;
}

const GOOGLE_MAPS_BROWSER_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_API_KEY ?? '';

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* onError: TEMPORAL, ver features/map/debug/mapDiagnosticsStore.ts — sacar junto con el
       *  resto del panel de diagnóstico del mapa. */}
      <APIProvider apiKey={GOOGLE_MAPS_BROWSER_API_KEY} onError={reportApiProviderError}>
        {children}
      </APIProvider>
    </ThemeProvider>
  );
}
