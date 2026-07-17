import { Alert, CircularProgress, List, ListItem, ListItemText, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { DeliveryStatusChip, formatLocalityLine, formatStreetLine } from '../../features/route';
import { useDriverTracking } from '../../features/tracking';
import { AppLayout } from '../../shared/components';

export function TrackingPage() {
  const { driverName = '' } = useParams<{ driverName: string }>();
  const { status, data, errorMessage } = useDriverTracking(driverName);

  const deliveries = data?.session?.deliveries ?? [];

  return (
    <AppLayout title={`Seguimiento: ${driverName}`}>
      {status === 'loading' && !data && (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={24} />
          <Typography variant="body2">Buscando a {driverName}...</Typography>
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
