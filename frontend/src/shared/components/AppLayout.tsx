import { Stack } from '@mui/material';
import type { ReactNode } from 'react';
import type { BottomNavItem } from '../config/bottomNavItems';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  title: string;
  headerActions?: ReactNode;
  bottomNavItems?: BottomNavItem[];
  /** Reemplaza la barra superior por defecto (ej. un encabezado con degradé) cuando la pantalla lo necesita. */
  header?: ReactNode;
  children: ReactNode;
}

export function AppLayout({ title, headerActions, bottomNavItems, header, children }: AppLayoutProps) {
  return (
    <Stack
      sx={{
        height: '100dvh',
        overflow: 'hidden',
        '@supports (-webkit-touch-callout: none)': { height: '-webkit-fill-available' },
      }}
    >
      {header ?? <AppHeader title={title} actions={headerActions} />}
      <Stack
        component="main"
        spacing={2}
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', px: 2, py: 2 }}
      >
        {children}
      </Stack>
      <BottomNav items={bottomNavItems} />
    </Stack>
  );
}
