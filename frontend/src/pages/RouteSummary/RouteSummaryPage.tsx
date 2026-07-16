import { Button, List, Stack } from '@mui/material';
import { useState } from 'react';
import { NavigationDialog, type NavigationDestination } from '../../features/navigation';
import {
  DeliveryActionsSheet,
  DeliveryListItem,
  getVisibleDeliveries,
  RouteSummaryStats,
  type Delivery,
  useRoute,
} from '../../features/route';
import { OptimizeRouteDialog } from '../../features/route-optimization';
import { AppLayout } from '../../shared/components';

export function RouteSummaryPage() {
  const { session, reorderDeliveries } = useRoute();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<Delivery | null>(null);

  const navigationDestination: NavigationDestination | null = navigationTarget
    ? { address: navigationTarget.address, coordinates: navigationTarget.coordinates }
    : null;

  return (
    <AppLayout title="Ruta">
      <RouteSummaryStats deliveries={session.deliveries} />

      <Stack direction="row" spacing={1}>
        <OptimizeRouteDialog deliveries={session.deliveries} onOptimized={reorderDeliveries} />
        <Button variant="outlined" size="small" disabled>
          Comenzar reparto
        </Button>
      </Stack>

      <List disablePadding>
        {getVisibleDeliveries(session.deliveries).map((delivery) => (
          <DeliveryListItem key={delivery.id} delivery={delivery} onOpen={setSelectedDelivery} />
        ))}
      </List>

      <DeliveryActionsSheet
        delivery={selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        onNavigate={setNavigationTarget}
      />

      <NavigationDialog destination={navigationDestination} onClose={() => setNavigationTarget(null)} />
    </AppLayout>
  );
}
