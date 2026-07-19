import { BottomNavigation, BottomNavigationAction, Box, Paper } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { BOTTOM_NAV_ITEMS, type BottomNavItem } from '../config/bottomNavItems';

interface BottomNavProps {
  items?: BottomNavItem[];
}

export function BottomNav({ items = BOTTOM_NAV_ITEMS }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider', pb: 'env(safe-area-inset-bottom)' }}
    >
      <BottomNavigation value={location.pathname} showLabels sx={{ height: 64 }}>
        {items.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              value={item.path}
              onClick={() => navigate(item.path)}
              icon={
                <Box
                  sx={(theme) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 28,
                    borderRadius: 999,
                    bgcolor: isActive ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                  })}
                >
                  {item.icon}
                </Box>
              }
              sx={{ minWidth: 0, px: 1 }}
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
}
