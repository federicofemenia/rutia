import LocationOffIcon from '@mui/icons-material/LocationOff';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { Alert, Box, CircularProgress, Fab, Stack, Typography } from '@mui/material';
import { useCurrentLocation } from '../../features/geolocation';
import { DeliveryMap, hasCoordinates } from '../../features/map';
import { useRoute } from '../../features/route';
import { AppLayout } from '../../shared/components';

export function MapPage() {
  const { session } = useRoute();
  const missingCoordinatesCount = session.deliveries.filter((delivery) => !hasCoordinates(delivery)).length;
  const { status, coordinates, errorMessage, requestLocation } = useCurrentLocation();

  return (
    <AppLayout title="Mapa">
      {missingCoordinatesCount > 0 && (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <LocationOffIcon fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            {missingCoordinatesCount === 1
              ? '1 entrega no tiene ubicación disponible.'
              : `${missingCoordinatesCount} entregas no tienen ubicación disponible.`}
          </Typography>
        </Stack>
      )}

      {status === 'error' && errorMessage && (
        <Alert severity="warning" variant="outlined">
          {errorMessage}
        </Alert>
      )}

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <DeliveryMap deliveries={session.deliveries} currentLocation={coordinates ?? undefined} />

        <Fab
          size="small"
          color="primary"
          onClick={requestLocation}
          disabled={status === 'loading'}
          aria-label="Mi ubicación"
          sx={{ position: 'absolute', bottom: 16, right: 16 }}
        >
          {status === 'loading' ? <CircularProgress size={22} color="inherit" /> : <MyLocationIcon />}
        </Fab>
      </Box>
    </AppLayout>
  );
}
