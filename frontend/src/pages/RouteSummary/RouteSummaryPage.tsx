import { Button, List, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';
import { NavigationDialog, type NavigationDestination } from '../../features/navigation';
import { DeliveryListItem, RouteSummaryStats, getVisibleDeliveries, type Delivery, useRoute } from '../../features/route';
import { OptimizeRouteDialog } from '../../features/route-optimization';

export function RouteSummaryPage() {
  const { session, reorderDeliveries } = useRoute();
  const navigate = useNavigate();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const navigationDestination: NavigationDestination | null = selectedDelivery
    ? { address: selectedDelivery.address, coordinates: selectedDelivery.coordinates }
    : null;

  return (
    <Stack component="main" spacing={3} sx={{ minHeight: '100vh', px: 2, py: 4, maxWidth: 480, mx: 'auto' }}>
      <Typography variant="h5" component="h1">
        Resumen de ruta
      </Typography>

      <RouteSummaryStats deliveries={session.deliveries} />

      <List disablePadding>
        {getVisibleDeliveries(session.deliveries).map((delivery) => (
          <DeliveryListItem key={delivery.id} delivery={delivery} onNavigate={setSelectedDelivery} />
        ))}
      </List>

      <Stack spacing={1}>
        <Button variant="contained" onClick={() => navigate(ROUTES.scan)}>
          Volver a escanear
        </Button>
        <OptimizeRouteDialog deliveries={session.deliveries} onOptimized={reorderDeliveries} />
        <Button variant="outlined" disabled>
          Comenzar reparto
        </Button>
      </Stack>

      <NavigationDialog destination={navigationDestination} onClose={() => setSelectedDelivery(null)} />
    </Stack>
  );
}
