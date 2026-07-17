import { Alert, Button, Card, CardContent, Stack } from '@mui/material';
import { AddressFields } from '../../route';
import type { DeliveryDraft } from '../types';

interface DeliveryReviewCardProps {
  value: DeliveryDraft;
  onChange: (patch: Partial<DeliveryDraft>) => void;
  onSubmit: () => void;
}

export function DeliveryReviewCard({ value, onChange, onSubmit }: DeliveryReviewCardProps) {
  const canConfirm = value.street.trim().length > 0 && value.locality.trim().length > 0 && value.province.trim().length > 0;

  return (
    <Card sx={{ width: '100%', maxWidth: 480, mx: 'auto' }}>
      <CardContent>
        <Stack spacing={1.5}>
          <AddressFields value={value} onChange={onChange} />

          {!canConfirm && (
            <Alert severity="warning" variant="outlined">
              Completá calle, localidad y provincia para confirmar.
            </Alert>
          )}

          <Button variant="contained" fullWidth onClick={onSubmit} disabled={!canConfirm}>
            Confirmar
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
