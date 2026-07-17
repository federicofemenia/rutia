import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import type { Delivery, DeliveryAddress } from '../types';
import { AddressFields } from './AddressFields';

interface EditDeliveryAddressDialogProps {
  delivery: Delivery | null;
  onClose: () => void;
  onSave: (address: DeliveryAddress) => void;
}

export function EditDeliveryAddressDialog({ delivery, onClose, onSave }: EditDeliveryAddressDialogProps) {
  const [address, setAddress] = useState<DeliveryAddress | null>(null);

  useEffect(() => {
    if (delivery) {
      setAddress(delivery.address);
    }
  }, [delivery]);

  const canConfirm = address
    ? address.street.trim().length > 0 && address.locality.trim().length > 0 && address.province.trim().length > 0
    : false;

  const handleSave = () => {
    if (address && canConfirm) {
      onSave(address);
    }
  };

  return (
    <Dialog open={delivery !== null} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Editar dirección</DialogTitle>
      <DialogContent>
        {address && (
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <AddressFields
              value={address}
              onChange={(patch) => setAddress((previous) => (previous ? { ...previous, ...patch } : previous))}
            />
            {!canConfirm && (
              <Alert severity="warning" variant="outlined">
                Completá calle, localidad y provincia para guardar.
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canConfirm}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
