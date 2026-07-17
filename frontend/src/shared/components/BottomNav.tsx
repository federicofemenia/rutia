import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
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
      sx={{ position: 'sticky', bottom: 0, zIndex: 1, borderTop: '1px solid', borderColor: 'divider' }}
    >
      <BottomNavigation value={location.pathname} showLabels sx={{ height: 56 }}>
        {items.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
            value={item.path}
            onClick={() => navigate(item.path)}
            sx={{ minWidth: 0, px: 1 }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
