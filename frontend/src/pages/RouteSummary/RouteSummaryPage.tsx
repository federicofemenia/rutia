import AddIcon from '@mui/icons-material/Add';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import RouteIcon from '@mui/icons-material/Route';
import { Alert, Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';
import { useAuth } from '../../features/auth';
import { NavigationDialog, type NavigationDestination } from '../../features/navigation';
import { OptimizeRouteDialog, useOptimizeDeliveries, useReoptimizeAfterDelete } from '../../features/route-optimization';
import {
  buildDeliveryLegInfo,
  DeliveryActionsSheet,
  DeliveryGroupCard,
  DeliveryStatus,
  FinishRouteDialog,
  formatFullAddress,
  GeocodingStatus,
  getVisibleDeliveries,
  groupDeliveriesByAddress,
  isRouteFullyOptimized,
  RouteOverviewCard,
  RouteSessionStatus,
  RouteSummaryStats,
  type Delivery,
  useRoute,
} from '../../features/route';
import { AppBrandHeader, AppLayout } from '../../shared/components';

export function RouteSummaryPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { session, routeSummary, startDelivery, removeDelivery, finishRoute } = useRoute();
  const { isDialogOpen, openOptimizeDialog, closeOptimizeDialog, handleOptimized } = useOptimizeDeliveries();
  const reoptimizeAfterDelete = useReoptimizeAfterDelete();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<Delivery | null>(null);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [isFinishSummaryOpen, setIsFinishSummaryOpen] = useState(false);

  const handleDeleteDelivery = (target: Delivery) => {
    const previousSummary = routeSummary;
    const remainingDeliveries = session.deliveries.filter((delivery) => delivery.id !== target.id);
    removeDelivery(target.id);
    void reoptimizeAfterDelete(remainingDeliveries, previousSummary);
  };

  const handleFinishRoute = async () => {
    setIsFinishing(true);
    setFinishError(null);

    try {
      await finishRoute();
      setIsFinishSummaryOpen(true);
    } catch (error) {
      setFinishError(error instanceof Error ? error.message : 'No se pudo finalizar la ruta.');
    } finally {
      setIsFinishing(false);
    }
  };

  const navigationDestination: NavigationDestination | null = navigationTarget
    ? { address: formatFullAddress(navigationTarget.address), coordinates: navigationTarget.coordinates }
    : null;

  const pendingCount = session.deliveries.filter((delivery) => delivery.geocodingStatus === GeocodingStatus.Pending).length;
  const visibleDeliveries = getVisibleDeliveries(session.deliveries);
  const filteredDeliveries = statusFilter
    ? visibleDeliveries.filter((delivery) => delivery.status === statusFilter)
    : visibleDeliveries;
  const deliveryGroups = groupDeliveriesByAddress(filteredDeliveries);
  const legInfoByDeliveryId = buildDeliveryLegInfo(routeSummary);
  const hasActiveDelivery = session.deliveries.some((delivery) => delivery.status === DeliveryStatus.InProgress);
  const needsOptimize = session.deliveries.length > 0 && !isRouteFullyOptimized(session.deliveries, legInfoByDeliveryId, routeSummary);
  const isRouteFinished = session.status === RouteSessionStatus.Finished;
  const canFinishRoute =
    session.deliveries.length > 0 &&
    session.deliveries.every(
      (delivery) => delivery.status === DeliveryStatus.Delivered || delivery.status === DeliveryStatus.Failed,
    );

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

      <RouteSummaryStats deliveries={session.deliveries} selectedStatus={statusFilter} onSelectStatus={setStatusFilter} />

      {isRouteFinished ? (
        <Alert severity="success">Esta ruta ya está finalizada.</Alert>
      ) : (
        session.deliveries.length > 0 && (
          <Stack spacing={1}>
            {finishError && <Alert severity="error">{finishError}</Alert>}
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<DoneAllIcon />}
              disabled={!canFinishRoute}
              loading={isFinishing}
              loadingPosition="start"
              onClick={handleFinishRoute}
            >
              Terminar recorrido
            </Button>
          </Stack>
        )
      )}

      {pendingCount > 0 && (
        <Alert severity="warning">
          {pendingCount === 1
            ? '1 entrega todavía no tiene ubicación. Editá su dirección o eliminala.'
            : `${pendingCount} entregas todavía no tienen ubicación. Editá su dirección o eliminalas.`}
        </Alert>
      )}

      {statusFilter && deliveryGroups.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No hay entregas con ese estado.
        </Typography>
      )}

      <Stack spacing={1.5}>
        {deliveryGroups.map((group) => {
          const lastDelivery = group.deliveries[group.deliveries.length - 1];
          return (
            <DeliveryGroupCard
              key={group.key}
              deliveries={group.deliveries}
              legInfo={lastDelivery && legInfoByDeliveryId.get(lastDelivery.id)}
              hasActiveDelivery={hasActiveDelivery}
              onOpen={setSelectedDelivery}
              onNavigate={setNavigationTarget}
              onStart={(target) => startDelivery(target.id)}
              onDelete={handleDeleteDelivery}
            />
          );
        })}
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

      <FinishRouteDialog
        open={isFinishSummaryOpen}
        deliveries={session.deliveries}
        onClose={() => setIsFinishSummaryOpen(false)}
      />
    </AppLayout>
  );
}
