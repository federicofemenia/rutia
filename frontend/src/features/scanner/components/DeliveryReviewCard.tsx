import { Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import type { DeliveryDraft } from '../types';

interface DeliveryReviewCardProps {
  value: DeliveryDraft;
  onChange: (patch: Partial<DeliveryDraft>) => void;
  onSubmit: () => void;
}

export function DeliveryReviewCard({ value, onChange, onSubmit }: DeliveryReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card sx={{ width: '100%', maxWidth: 480, mx: 'auto' }}>
      <CardContent>
        <Stack spacing={1.5}>
          {isEditing ? (
            <>
              <TextField
                label="Dirección"
                value={value.address}
                onChange={(event) => onChange({ address: event.target.value })}
                fullWidth
                size="small"
                autoFocus
              />
              <TextField
                label="Código postal"
                value={value.postalCode}
                onChange={(event) => onChange({ postalCode: event.target.value })}
                fullWidth
                size="small"
              />
            </>
          ) : (
            <Stack spacing={0.25}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {value.address || '(sin dirección)'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CP {value.postalCode || '—'}
              </Typography>
            </Stack>
          )}

          <Stack direction="row" spacing={1}>
            {!isEditing && (
              <Button variant="outlined" fullWidth onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            )}
            <Button variant="contained" fullWidth onClick={onSubmit}>
              Confirmar
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
