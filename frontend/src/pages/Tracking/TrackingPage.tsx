import { Alert, CircularProgress, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { DeliveryStatusChip, formatLocalityLine, formatStreetLine } from '../../features/route';
import { useDriverTracking } from '../../features/tracking';
import { AppLayout } from '../../shared/components';
import { HOME_ONLY_NAV_ITEMS } from '../../shared/config/bottomNavItems';

export function TrackingPage() {
  const { driverId = '' } = useParams<{ driverId: string }>();
  const { status, data, errorMessage } = useDriverTracking(driverId);

  const driverName = data?.driver.name ?? '';
  const deliveries = data?.session?.deliveries ?? [];

  return (
    <AppLayout title={driverName ? `Seguimiento: ${driverName}` : 'Seguimiento'} bottomNavItems={HOME_ONLY_NAV_ITEMS}>
      <Typography variant="h6">{driverName ? `Envíos del chofer ${driverName}` : 'Envíos del chofer'}</Typography>

      {status === 'loading' && !data && (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
          <Typography variant="body2">Buscando...</Typography>
        </Stack>
      )}

      {errorMessage && <Alert severity={data ? 'warning' : 'error'}>{errorMessage}</Alert>}

      {data && deliveries.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {driverName} todavía no cargó entregas.
        </Typography>
      )}

      {deliveries.length > 0 && (
        <List disablePadding>
          {deliveries.map((delivery) => (
            <ListItem key={delivery.id} divider sx={{ gap: 1 }}>
              <ListItemText
                primary={formatStreetLine(delivery.address) || '(sin dirección)'}
                secondary={formatLocalityLine(delivery.address) || undefined}
                slotProps={{
                  primary: { variant: 'body2', noWrap: true, sx: { fontWeight: 600 } },
                  secondary: { variant: 'caption' },
                }}
              />
              <DeliveryStatusChip status={delivery.status} />
            </ListItem>
          ))}
        </List>
      )}
    </AppLayout>
  );
}
