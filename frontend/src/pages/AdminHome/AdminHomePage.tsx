import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { buildTrackingPath } from '../../app/router/routes';
import { useAuth, UserRole } from '../../features/auth';
import { useCompanyDriversOverview, type CompanyDriver } from '../../features/tracking';
import { AppBrandHeader, AppLayout, IconBadge, StatCard } from '../../shared/components';
import { HOME_ONLY_NAV_ITEMS } from '../../shared/config/bottomNavItems';

function sortDrivers(drivers: CompanyDriver[]): CompanyDriver[] {
  return [...drivers].sort((a, b) => {
    if (a.hasActiveRoute !== b.hasActiveRoute) {
      return a.hasActiveRoute ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export function AdminHomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SuperAdmin;
  const { status, drivers, errorMessage } = useCompanyDriversOverview(!isSuperAdmin);

  const activeCount = drivers.filter((driver) => driver.hasActiveRoute).length;
  const sortedDrivers = sortDrivers(drivers);

  return (
    <AppLayout title="Panel" header={<AppBrandHeader onLogout={logout} menuItems={[]} />} bottomNavItems={HOME_ONLY_NAV_ITEMS}>
      {user && (
        <Box>
          <Typography variant="body2" color="text.secondary">
            {isSuperAdmin ? 'Super administrador' : user.companyName ?? 'Panel de administración'}
          </Typography>
          <Typography component="h1" variant="h6" sx={{ fontWeight: 700 }}>
            {user.name}
          </Typography>
        </Box>
      )}

      {isSuperAdmin ? (
        <Alert severity="info">
          Tu cuenta de SUPER_ADMIN no está asociada a ninguna empresa, así que no ve choferes propios. Esta sección es
          para cuentas de administrador de una empresa — creá una o iniciá sesión con esa cuenta para ver sus choferes.
        </Alert>
      ) : (
        <>
          <Stack direction="row" spacing={1.5}>
            <StatCard value={drivers.length} label="Choferes" color="info" />
            <StatCard value={activeCount} label="En ruta ahora" color="success" />
          </Stack>

          <Typography variant="overline" color="text.secondary">
            Choferes de tu empresa
          </Typography>

          {status === 'loading' && drivers.length === 0 && (
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Stack>
          )}

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {status === 'success' && drivers.length === 0 && (
            <Alert severity="info">
              Todavía no hay choferes registrados. Compartí el código de registro de tu empresa para que se unan.
            </Alert>
          )}

          {sortedDrivers.length > 0 && (
            <List
              disablePadding
              sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)' }}
            >
              {sortedDrivers.map((driver) => (
                <ListItemButton
                  key={driver.id}
                  divider
                  onClick={() => navigate(buildTrackingPath(driver.id))}
                  sx={{ gap: 1.5, py: 1.5 }}
                >
                  <IconBadge
                    icon={
                      driver.hasActiveRoute ? <LocalShippingIcon fontSize="small" /> : <PersonOutlineIcon fontSize="small" />
                    }
                    color={driver.hasActiveRoute ? 'success' : 'primary'}
                  />
                  <ListItemText
                    primary={driver.name}
                    secondary={!driver.active ? 'Cuenta inactiva' : undefined}
                    slotProps={{
                      primary: { sx: { fontWeight: 600 } },
                      secondary: { variant: 'caption', color: 'error' },
                    }}
                  />
                  <Chip
                    label={driver.hasActiveRoute ? 'En ruta' : 'Sin actividad'}
                    color={driver.hasActiveRoute ? 'success' : 'default'}
                    size="small"
                    variant={driver.hasActiveRoute ? 'filled' : 'outlined'}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </>
      )}
    </AppLayout>
  );
}
