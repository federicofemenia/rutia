import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { Alert, Skeleton, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { DriverHistoryAccordion, InProgressRouteAccordion, useDriverHistory } from '../../features/driverHistory';
import { RouteSessionStatus } from '../../features/route';
import { useDriverTracking } from '../../features/tracking';
import { AppBrandHeader, AppLayout } from '../../shared/components';
import { getDriverTrackingNavItems } from '../../shared/config/bottomNavItems';

export function AdminDriverHistoryPage() {
  const { driverId = '' } = useParams<{ driverId: string }>();
  const { logout } = useAuth();
  const { data } = useDriverTracking(driverId);
  const { status, history, errorMessage } = useDriverHistory(driverId);

  const driverName = data?.driver.name ?? '';
  const currentSession = data?.session ?? null;
  const hasInProgressRoute =
    currentSession !== null &&
    currentSession.status === RouteSessionStatus.InProgress &&
    currentSession.deliveries.length > 0;

  return (
    <AppLayout
      title={driverName ? `Historial: ${driverName}` : 'Historial'}
      header={<AppBrandHeader onLogout={logout} menuItems={[]} />}
      bottomNavItems={getDriverTrackingNavItems(driverId)}
    >
      <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
        {driverName ? `Historial de ${driverName}` : 'Historial'}
      </Typography>

      {hasInProgressRoute && currentSession && <InProgressRouteAccordion deliveries={currentSession.deliveries} />}

      {status === 'loading' && (
        <Stack spacing={1.5}>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} variant="rounded" height={72} />
          ))}
        </Stack>
      )}

      {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}

      {status === 'success' && history.length === 0 && !hasInProgressRoute && (
        <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <InboxOutlinedIcon sx={{ fontSize: 48 }} />
          <Typography variant="body2">Este chofer todavía no tiene entregas realizadas.</Typography>
        </Stack>
      )}

      {status === 'success' && history.length > 0 && (
        <Stack spacing={1.5}>
          {history.map((entry) => (
            <DriverHistoryAccordion key={entry.id} entry={entry} driverId={driverId} />
          ))}
        </Stack>
      )}
    </AppLayout>
  );
}
