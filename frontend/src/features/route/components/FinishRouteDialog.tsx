import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { StatCard } from '../../../shared/components';
import { DeliveryStatus, type Delivery } from '../types';
import { summarizeDeliveries } from '../utils/summarizeDeliveries';

interface FinishRouteDialogProps {
  open: boolean;
  deliveries: Delivery[];
  onClose: () => void;
}

export function FinishRouteDialog({ open, deliveries, onClose }: FinishRouteDialogProps) {
  const counts = summarizeDeliveries(deliveries);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>¡Buen trabajo!</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Estos son tus números:
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <StatCard value={counts[DeliveryStatus.Delivered]} label="Entregados" color="success" />
          <StatCard value={counts[DeliveryStatus.Failed]} label="Fallidos" color="error" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button variant="contained" fullWidth onClick={onClose}>
          Listo
        </Button>
      </DialogActions>
    </Dialog>
  );
}
