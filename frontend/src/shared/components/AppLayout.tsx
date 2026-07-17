import { Stack } from '@mui/material';
import type { ReactNode } from 'react';
import type { BottomNavItem } from '../config/bottomNavItems';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  title: string;
  headerActions?: ReactNode;
  bottomNavItems?: BottomNavItem[];
  children: ReactNode;
}

export function AppLayout({ title, headerActions, bottomNavItems, children }: AppLayoutProps) {
  return (
    <Stack sx={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <AppHeader title={title} actions={headerActions} />
      <Stack component="main" spacing={2} sx={{ flex: 1, px: 2, py: 2 }}>
        {children}
      </Stack>
      <BottomNav items={bottomNavItems} />
    </Stack>
  );
}
