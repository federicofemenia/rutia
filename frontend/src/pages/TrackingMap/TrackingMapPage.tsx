import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { DeliveryMap, hasCoordinates } from '../../features/map';
import { useDriverTracking } from '../../features/tracking';
import { AppLayout } from '../../shared/components';
import { getDriverTrackingNavItems } from '../../shared/config/bottomNavItems';

export function TrackingMapPage() {
  const { driverId = '' } = useParams<{ driverId: string }>();
  const { status, data, errorMessage } = useDriverTracking(driverId);

  const driverName = data?.driver.name ?? '';
  const deliveries = data?.session?.deliveries ?? [];
  const missingCoordinatesCount = deliveries.filter((delivery) => !hasCoordinates(delivery)).length;

  return (
    <AppLayout title={driverName ? `Mapa: ${driverName}` : 'Mapa'} bottomNavItems={getDriverTrackingNavItems(driverId)}>
      <Typography variant="h6">{driverName ? `Envíos de ${driverName}` : 'Envíos del chofer'}</Typography>

      {status === 'loading' && !data && (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
        </Stack>
      )}

      {errorMessage && <Alert severity={data ? 'warning' : 'error'}>{errorMessage}</Alert>}

      {missingCoordinatesCount > 0 && (
        <Alert severity="info" variant="outlined">
          {missingCoordinatesCount === 1
            ? '1 entrega no tiene ubicación disponible.'
            : `${missingCoordinatesCount} entregas no tienen ubicación disponible.`}
        </Alert>
      )}

      <Box sx={{ flex: 1, minHeight: '55dvh', display: 'flex', flexDirection: 'column' }}>
        <DeliveryMap deliveries={deliveries} />
      </Box>
    </AppLayout>
  );
}
