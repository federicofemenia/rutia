import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { PlacesAutocompleteInput, type PlaceSelection } from '../../places';
import type { Delivery } from '../types';
import { formatFullAddress } from '../utils/formatDeliveryAddress';

interface EditDeliveryAddressDialogProps {
  delivery: Delivery | null;
  onClose: () => void;
  onSave: (selection: PlaceSelection) => void;
}

export function EditDeliveryAddressDialog({ delivery, onClose, onSave }: EditDeliveryAddressDialogProps) {
  const handleSelect = (selection: PlaceSelection) => {
    onSave(selection);
    onClose();
  };

  return (
    <Dialog open={delivery !== null} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Editar dirección</DialogTitle>
      <DialogContent>
        {delivery && (
          <PlacesAutocompleteInput
            initialQuery={delivery.address.formattedAddress ?? formatFullAddress(delivery.address)}
            onSelect={handleSelect}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}
