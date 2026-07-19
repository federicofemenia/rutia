import Inventory2Icon from '@mui/icons-material/Inventory2';
import LogoutIcon from '@mui/icons-material/Logout';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { Avatar, Box, Button, Card, CardContent, Chip, IconButton, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';
import { useAuth, UserRole } from '../../features/auth';
import { DeliveryStatus, summarizeDeliveries, useRoute } from '../../features/route';
import { StartDeliveryButton } from '../../features/route-optimization';
import { AppLayout, BrandLogo, GradientHero, IconBadge, StatCard } from '../../shared/components';
import { BRAND } from '../../shared/config/brand';
import { TrackDriverDialog } from './components/TrackDriverDialog';

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || '?';
}

export function HomePage() {
  const navigate = useNavigate();
  const { session, startNewRoute } = useRoute();
  const { user, logout } = useAuth();
  const [isTrackDialogOpen, setIsTrackDialogOpen] = useState(false);

  const hasActiveRoute = session.deliveries.length > 0;

  const handleScanAction = () => {
    // Solo arranca una ruta nueva (y descarta la actual) cuando todavía no hay ninguna en curso.
    // Si ya hay una ruta activa, esta acción suma escaneos a esa misma ruta — nunca debe borrarla.
    if (!hasActiveRoute) {
      startNewRoute();
    }
    navigate(ROUTES.scan);
  };

  const counts = summarizeDeliveries(session.deliveries);
  const total = session.deliveries.length;
  const delivered = counts[DeliveryStatus.Delivered];
  const progressPercent = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return (
    <AppLayout
      title="Inicio"
      header={
        <GradientHero>
          <Stack direction="row" sx={{ alignItems: 'center' }}>
            <BrandLogo size="small" tone="dark" />
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Cerrar sesión">
              <IconButton onClick={logout} sx={{ color: 'inherit', bgcolor: 'rgba(255,255,255,0.15)' }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </GradientHero>
      }
    >
      {user && (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>{getInitials(user.name)}</Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Bienvenido,
            </Typography>
            <Typography component="h1" variant="h6" sx={{ fontWeight: 700 }}>
              {user.name}
            </Typography>
          </Box>
        </Stack>
      )}

      <Stack direction="row" spacing={1.5}>
        <StatCard value={counts[DeliveryStatus.Pending]} label="Pendientes" color="warning" />
        <StatCard value={counts[DeliveryStatus.Delivered]} label="Entregados" color="success" />
        <StatCard value={counts[DeliveryStatus.Failed]} label="Fallidos" color="error" />
      </Stack>

      {hasActiveRoute && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Ruta de hoy
                </Typography>
                <Chip label="Activa" color="primary" variant="outlined" size="small" />
              </Stack>

              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <IconBadge icon={<Inventory2Icon fontSize="small" />} color="primary" />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {total} envíos
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total asignados
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {hasActiveRoute && (
        <Card>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Progreso del día
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                  {progressPercent}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                color="secondary"
                sx={{ borderRadius: 1, height: 8 }}
              />
              <Typography variant="caption" color="text.secondary">
                {delivered} de {total} completados
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Typography variant="overline" color="text.secondary">
        Acciones rápidas
      </Typography>

      <Card onClick={handleScanAction} sx={{ bgcolor: '#0F172A', color: '#FFFFFF', cursor: 'pointer', border: 'none' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconBadge icon={<PhotoCameraOutlinedIcon fontSize="small" />} color="success" />
          <Box sx={{ flexGrow: 1 }}>
            <Typography sx={{ fontWeight: 700 }}>Escanear etiqueta</Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Capturar dirección del paquete
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {hasActiveRoute && (
        <StartDeliveryButton
          variant="contained"
          size="large"
          fullWidth
          sx={{
            borderRadius: 999,
            py: 1,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            boxShadow: '0 12px 24px -8px rgba(30, 58, 138, 0.5)',
          }}
        />
      )}

      {user?.role === UserRole.Admin && (
        <Button variant="outlined" size="large" fullWidth onClick={() => setIsTrackDialogOpen(true)}>
          Hacer seguimiento
        </Button>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        v{BRAND.version}
      </Typography>

      <TrackDriverDialog open={isTrackDialogOpen} onClose={() => setIsTrackDialogOpen(false)} />
    </AppLayout>
  );
}
