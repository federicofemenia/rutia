import AddIcon from '@mui/icons-material/Add';
import RouteIcon from '@mui/icons-material/Route';
import { Alert, Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';
import { useAuth } from '../../features/auth';
import { NavigationDialog, type NavigationDestination } from '../../features/navigation';
import { OptimizeRouteDialog, useOptimizeDeliveries } from '../../features/route-optimization';
import {
  buildDeliveryLegInfo,
  DeliveryActionsSheet,
  DeliveryListItem,
  DeliveryStatus,
  formatFullAddress,
  GeocodingStatus,
  getVisibleDeliveries,
  isRouteFullyOptimized,
  RouteOverviewCard,
  RouteSummaryStats,
  type Delivery,
  useRoute,
} from '../../features/route';
import { AppBrandHeader, AppLayout } from '../../shared/components';

export function RouteSummaryPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { session, routeSummary, startDelivery, removeDelivery } = useRoute();
  const { isDialogOpen, openOptimizeDialog, closeOptimizeDialog, handleOptimized } = useOptimizeDeliveries();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<Delivery | null>(null);

  const navigationDestination: NavigationDestination | null = navigationTarget
    ? { address: formatFullAddress(navigationTarget.address), coordinates: navigationTarget.coordinates }
    : null;

  const pendingCount = session.deliveries.filter((delivery) => delivery.geocodingStatus === GeocodingStatus.Pending).length;
  const visibleDeliveries = getVisibleDeliveries(session.deliveries);
  const legInfoByDeliveryId = buildDeliveryLegInfo(routeSummary);
  const hasActiveDelivery = session.deliveries.some((delivery) => delivery.status === DeliveryStatus.InProgress);
  const needsOptimize = session.deliveries.length > 0 && !isRouteFullyOptimized(session.deliveries, legInfoByDeliveryId, routeSummary);

  return (
    <AppLayout title="Entregas" header={<AppBrandHeader onLogout={logout} />}>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
            Entregas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {visibleDeliveries.length === 1
              ? '1 envío asignado para hoy'
              : `${visibleDeliveries.length} envíos asignados para hoy`}
          </Typography>
        </Box>
        <Tooltip title="Agregar paquete">
          <IconButton aria-label="Agregar paquete" color="primary" onClick={() => navigate(ROUTES.scan)}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {needsOptimize && (
        <Stack spacing={1}>
          <Alert severity="info">
            {routeSummary
              ? 'Agregaste o editaste entregas después de la última optimización. Optimizá de nuevo para acomodarlas en el recorrido.'
              : 'Todavía no optimizaste la ruta. Las entregas están en el orden en que las cargaste.'}
          </Alert>
          <Button variant="contained" size="large" startIcon={<RouteIcon />} onClick={openOptimizeDialog}>
            Optimizar ruta
          </Button>
        </Stack>
      )}

      {routeSummary && <RouteOverviewCard deliveryCount={visibleDeliveries.length} routeSummary={routeSummary} />}

      <RouteSummaryStats deliveries={session.deliveries} />

      {pendingCount > 0 && (
        <Alert severity="warning">
          {pendingCount === 1
            ? '1 entrega todavía no tiene ubicación. Editá su dirección o eliminala.'
            : `${pendingCount} entregas todavía no tienen ubicación. Editá su dirección o eliminalas.`}
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
            onDelete={(target) => removeDelivery(target.id)}
          />
        ))}
      </Stack>

      <DeliveryActionsSheet
        delivery={selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        onNavigate={setNavigationTarget}
      />

      <NavigationDialog destination={navigationDestination} onClose={() => setNavigationTarget(null)} />

      <OptimizeRouteDialog
        open={isDialogOpen}
        deliveries={session.deliveries}
        onClose={closeOptimizeDialog}
        onOptimized={handleOptimized}
      />
    </AppLayout>
  );
}
