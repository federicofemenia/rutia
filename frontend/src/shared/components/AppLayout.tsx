import { Stack } from '@mui/material';
import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  title: string;
  headerActions?: ReactNode;
  hideBottomNav?: boolean;
  children: ReactNode;
}

export function AppLayout({ title, headerActions, hideBottomNav = false, children }: AppLayoutProps) {
  return (
    <Stack sx={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <AppHeader title={title} actions={headerActions} />
      <Stack component="main" spacing={2} sx={{ flex: 1, px: 2, py: 2 }}>
        {children}
      </Stack>
      {!hideBottomNav && <BottomNav />}
    </Stack>
  );
}
