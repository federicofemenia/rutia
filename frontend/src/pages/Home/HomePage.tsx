import LogoutIcon from '@mui/icons-material/Logout';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTrackingPath, ROUTES } from '../../app/router/routes';
import { useAuth, UserRole } from '../../features/auth';
import { formatLastModified, useRoute } from '../../features/route';
import { StartDeliveryButton } from '../../features/route-optimization';
import { AppLayout, BrandLogo } from '../../shared/components';
import { BRAND } from '../../shared/config/brand';

export function HomePage() {
  const navigate = useNavigate();
  const { session, startNewRoute } = useRoute();
  const { user, logout } = useAuth();
  const [isTrackDialogOpen, setIsTrackDialogOpen] = useState(false);
  const [driverName, setDriverName] = useState('');

  const handleNewRoute = () => {
    startNewRoute();
    navigate(ROUTES.scan);
  };

  const submitTrackDriver = () => {
    const trimmedName = driverName.trim();

    if (trimmedName) {
      navigate(buildTrackingPath(trimmedName));
    }
  };

  const handleTrackDriverFormSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    submitTrackDriver();
  };

  const hasActiveRoute = session.deliveries.length > 0;

  return (
    <AppLayout
      title="Inicio"
      headerActions={
        <Tooltip title="Cerrar sesión">
          <IconButton color="inherit" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      }
    >
      <Stack spacing={3} sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <BrandLogo size="large" />

        {hasActiveRoute && (
          <Card sx={{ width: '100%', maxWidth: 360 }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Ruta en progreso
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {session.deliveries.length} entregas · {formatLastModified(session.updatedAt)}
                </Typography>
                <StartDeliveryButton variant="outlined" fullWidth />
              </Stack>
            </CardContent>
          </Card>
        )}

        <Button variant="contained" size="large" sx={{ width: '100%', maxWidth: 360 }} onClick={handleNewRoute}>
          Nueva Ruta
        </Button>

        {user?.role === UserRole.Admin && (
          <Button
            variant="outlined"
            size="large"
            sx={{ width: '100%', maxWidth: 360 }}
            onClick={() => setIsTrackDialogOpen(true)}
          >
            Hacer seguimiento
          </Button>
        )}

        <Typography variant="caption" color="text.secondary">
          v{BRAND.version}
        </Typography>
      </Stack>

      <Dialog open={isTrackDialogOpen} onClose={() => setIsTrackDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Hacer seguimiento</DialogTitle>
        <DialogContent>
          <Stack component="form" onSubmit={handleTrackDriverFormSubmit} spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Nombre del chofer"
              value={driverName}
              onChange={(event) => setDriverName(event.target.value)}
              fullWidth
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTrackDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={submitTrackDriver} disabled={driverName.trim().length === 0}>
            Ver
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
