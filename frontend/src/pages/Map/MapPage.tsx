import LocationOffIcon from '@mui/icons-material/LocationOff';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { Alert, Box, CircularProgress, Fab, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../../features/auth';
import { useCurrentLocation } from '../../features/geolocation';
import { DeliveryMap, hasCoordinates } from '../../features/map';
import { NavigationDialog, type NavigationDestination } from '../../features/navigation';
import { DeliveryActionsSheet, formatFullAddress, type Delivery, useRoute } from '../../features/route';
import { AppBrandHeader, AppLayout } from '../../shared/components';

export function MapPage() {
  const { logout } = useAuth();
  const { session, routeSummary } = useRoute();
  const missingCoordinatesCount = session.deliveries.filter((delivery) => !hasCoordinates(delivery)).length;
  const { status, coordinates, errorMessage, requestLocation } = useCurrentLocation();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<Delivery | null>(null);

  const navigationDestination: NavigationDestination | null = navigationTarget
    ? { address: formatFullAddress(navigationTarget.address), coordinates: navigationTarget.coordinates }
    : null;

  return (
    <AppLayout title="Mapa" header={<AppBrandHeader onLogout={logout} />}>
      <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
        Mapa
      </Typography>

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
        <DeliveryMap
          deliveries={session.deliveries}
          currentLocation={coordinates ?? undefined}
          routeSummary={routeSummary}
          onSelectDelivery={setSelectedDelivery}
        />

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

      <DeliveryActionsSheet
        delivery={selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        onNavigate={setNavigationTarget}
      />

      <NavigationDialog destination={navigationDestination} onClose={() => setNavigationTarget(null)} />
    </AppLayout>
  );
}
