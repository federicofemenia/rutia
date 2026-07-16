import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';
import { formatLastModified, useRoute } from '../../features/route';
import { AppLayout, BrandLogo } from '../../shared/components';
import { BRAND } from '../../shared/config/brand';

export function HomePage() {
  const navigate = useNavigate();
  const { session, startNewRoute } = useRoute();

  const handleNewRoute = () => {
    startNewRoute();
    navigate(ROUTES.scan);
  };

  const hasActiveRoute = session.deliveries.length > 0;

  return (
    <AppLayout title="Inicio">
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
                <Button variant="outlined" fullWidth onClick={() => navigate(ROUTES.routeSummary)}>
                  Continuar
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        <Button variant="contained" size="large" sx={{ width: '100%', maxWidth: 360 }} onClick={handleNewRoute}>
          Nueva Ruta
        </Button>

        <Typography variant="caption" color="text.secondary">
          v{BRAND.version}
        </Typography>
      </Stack>
    </AppLayout>
  );
}
