import { Alert, CircularProgress, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { NavigationDialog, type NavigationDestination } from '../../features/navigation';
import {
  buildDeliveryLegInfo,
  DeliveryActionsSheet,
  DeliveryListItem,
  DeliveryStatus,
  formatFullAddress,
  GeocodingStatus,
  getVisibleDeliveries,
  RouteOverviewCard,
  RouteSummaryStats,
  type Delivery,
  useRoute,
} from '../../features/route';
import { AppLayout, GradientHero } from '../../shared/components';

export function RouteSummaryPage() {
  const { session, routeSummary, reoptimizeStatus, startDelivery } = useRoute();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<Delivery | null>(null);

  const navigationDestination: NavigationDestination | null = navigationTarget
    ? { address: formatFullAddress(navigationTarget.address), coordinates: navigationTarget.coordinates }
    : null;

  const pendingCount = session.deliveries.filter((delivery) => delivery.geocodingStatus === GeocodingStatus.Pending).length;
  const visibleDeliveries = getVisibleDeliveries(session.deliveries);
  const legInfoByDeliveryId = buildDeliveryLegInfo(routeSummary);
  const hasActiveDelivery = session.deliveries.some((delivery) => delivery.status === DeliveryStatus.InProgress);

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

      {reoptimizeStatus === 'loading' && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Recalculando ruta...
          </Typography>
        </Stack>
      )}

      {reoptimizeStatus === 'error' && (
        <Alert severity="warning">No se pudo recalcular la ruta. Los datos de distancia y tiempo pueden estar desactualizados.</Alert>
      )}

      {routeSummary && <RouteOverviewCard deliveryCount={visibleDeliveries.length} routeSummary={routeSummary} />}

      {pendingCount > 0 && (
        <Alert severity="warning">
          {pendingCount === 1
            ? '1 entrega todavía no tiene ubicación. Abrila y probá "Ubicar nuevamente".'
            : `${pendingCount} entregas todavía no tienen ubicación. Abrilas y probá "Ubicar nuevamente".`}
        </Alert>
      )}

      <Stack spacing={1.5}>
        {visibleDeliveries.map((delivery) => (
          <DeliveryListItem
            key={delivery.id}
            delivery={delivery}
            legInfo={legInfoByDeliveryId.get(delivery.id)}
            hasActiveDelivery={hasActiveDelivery}
            onOpen={setSelectedDelivery}
            onNavigate={setNavigationTarget}
            onStart={(target) => startDelivery(target.id)}
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
