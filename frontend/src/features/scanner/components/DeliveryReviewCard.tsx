import { Alert, Card, CardContent, Stack } from '@mui/material';
import { PlacesAutocompleteInput, type PlaceSelection } from '../../places';
import type { DeliveryDraft } from '../types';

interface DeliveryReviewCardProps {
  value: DeliveryDraft;
  onConfirm: (selection: PlaceSelection) => void;
}

export function DeliveryReviewCard({ value, onConfirm }: DeliveryReviewCardProps) {
  return (
    <Card sx={{ width: '100%', maxWidth: 480, mx: 'auto' }}>
      <CardContent>
        <Stack spacing={1.5}>
          {value.needsUserConfirmation && (
            <Alert severity="warning" variant="outlined">
              No pudimos leer la dirección con confianza. Revisá la búsqueda antes de confirmar.
            </Alert>
          )}

          <PlacesAutocompleteInput initialQuery={value.query} label="Dirección de entrega" onSelect={onConfirm} />
        </Stack>
      </CardContent>
    </Card>
  );
}
