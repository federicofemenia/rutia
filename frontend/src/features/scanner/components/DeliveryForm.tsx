import { Button, Stack, TextField } from '@mui/material';
import type { DeliveryDraft } from '../types';

interface DeliveryFormProps {
  value: DeliveryDraft;
  onChange: (patch: Partial<DeliveryDraft>) => void;
  onSubmit: () => void;
}

export function DeliveryForm({ value, onChange, onSubmit }: DeliveryFormProps) {
  return (
    <Stack spacing={2} sx={{ width: '100%', maxWidth: 480, mx: 'auto' }}>
      <TextField
        label="Dirección"
        value={value.address}
        onChange={(event) => onChange({ address: event.target.value })}
        fullWidth
      />
      <TextField
        label="Código postal"
        value={value.postalCode}
        onChange={(event) => onChange({ postalCode: event.target.value })}
        fullWidth
      />
      <Button variant="contained" size="large" onClick={onSubmit}>
        Agregar entrega
      </Button>
    </Stack>
  );
}
