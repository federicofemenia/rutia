import { AppBar, Box, Toolbar, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { BrandIcon } from './branding';

interface AppHeaderProps {
  title: string;
  actions?: ReactNode;
}

export function AppHeader({ title, actions }: AppHeaderProps) {
  return (
    <AppBar position="static" color="primary" sx={{ flexShrink: 0, pt: 'env(safe-area-inset-top)' }}>
      <Toolbar variant="dense" sx={{ gap: 1 }}>
        <BrandIcon variant="white" size={26} />
        <Typography variant="subtitle1" component="h1" color="inherit">
          {title}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {actions}
      </Toolbar>
    </AppBar>
  );
}
