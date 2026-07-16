import HomeIcon from '@mui/icons-material/Home';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import RouteIcon from '@mui/icons-material/Route';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';

const NAV_ITEMS = [
  { label: 'Inicio', path: ROUTES.home, icon: <HomeIcon /> },
  { label: 'Escanear', path: ROUTES.scan, icon: <PhotoCameraIcon /> },
  { label: 'Ruta', path: ROUTES.routeSummary, icon: <RouteIcon /> },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{ position: 'sticky', bottom: 0, zIndex: 1, borderTop: '1px solid', borderColor: 'divider' }}
    >
      <BottomNavigation value={location.pathname} showLabels sx={{ height: 56 }}>
        {NAV_ITEMS.map((item) => (
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
