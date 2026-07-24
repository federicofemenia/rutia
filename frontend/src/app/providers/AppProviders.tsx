import { APIProvider } from '@vis.gl/react-google-maps';
import { CssBaseline, ThemeProvider } from '@mui/material';
import type { ReactNode } from 'react';
import { theme } from '../theme/theme';

interface AppProvidersProps {
  children: ReactNode;
}

const GOOGLE_MAPS_BROWSER_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_API_KEY ?? '';

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <APIProvider apiKey={GOOGLE_MAPS_BROWSER_API_KEY}>{children}</APIProvider>
    </ThemeProvider>
  );
}
