import { Alert, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';
import { NavigationDialog, type NavigationDestination } from '../../features/navigation';
import {
  DeliveryActionsSheet,
  DeliveryListItem,
  formatFullAddress,
  GeocodingStatus,
  getVisibleDeliveries,
  RouteSummaryStats,
  type Delivery,
  useRoute,
} from '../../features/route';
import { AppLayout, GradientHero } from '../../shared/components';

export function RouteSummaryPage() {
  const navigate = useNavigate();
  const { session } = useRoute();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<Delivery | null>(null);

  const navigationDestination: NavigationDestination | null = navigationTarget
    ? { address: formatFullAddress(navigationTarget.address), coordinates: navigationTarget.coordinates }
    : null;

  const pendingCount = session.deliveries.filter((delivery) => delivery.geocodingStatus === GeocodingStatus.Pending).length;
  const visibleDeliveries = getVisibleDeliveries(session.deliveries);

  return (
    <AppLayout
      title="Entregas"
      header={
        <GradientHero>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
            Entregas
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {visibleDeliveries.length === 1
              ? '1 envío asignado para hoy'
              : `${visibleDeliveries.length} envíos asignados para hoy`}
          </Typography>
        </GradientHero>
      }
    >
      <RouteSummaryStats deliveries={session.deliveries} />

      {pendingCount > 0 && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => navigate(ROUTES.home)}>
              Ir a Inicio
            </Button>
          }
        >
          {pendingCount === 1
            ? '1 entrega no fue optimizada todavía.'
            : `${pendingCount} entregas no fueron optimizadas todavía.`}
        </Alert>
      )}

      <Stack spacing={1.5}>
        {visibleDeliveries.map((delivery) => (
          <DeliveryListItem
            key={delivery.id}
            delivery={delivery}
            onOpen={setSelectedDelivery}
            onNavigate={setNavigationTarget}
          />
        ))}
      </Stack>

      <DeliveryActionsSheet
        delivery={selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        onNavigate={setNavigationTarget}
      />

      <NavigationDialog destination={navigationDestination} onClose={() => setNavigationTarget(null)} />
    </AppLayout>
  );
}
