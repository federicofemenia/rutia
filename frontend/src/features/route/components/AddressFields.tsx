import { MenuItem, Stack, TextField } from '@mui/material';
import { ARGENTINE_PROVINCES } from '../config/argentineProvinces';
import type { DeliveryAddress } from '../types';

interface AddressFieldsProps {
  value: DeliveryAddress;
  onChange: (patch: Partial<DeliveryAddress>) => void;
}

export function AddressFields({ value, onChange }: AddressFieldsProps) {
  return (
    <Stack spacing={1.5}>
      <TextField
        label="Calle"
        value={value.street}
        onChange={(event) => onChange({ street: event.target.value })}
        fullWidth
        size="small"
        autoFocus
        required
      />
      <TextField
        label="Altura"
        value={value.streetNumber ?? ''}
        onChange={(event) => onChange({ streetNumber: event.target.value || undefined })}
        fullWidth
        size="small"
      />
      <TextField
        label="Código postal"
        value={value.postalCode ?? ''}
        onChange={(event) => onChange({ postalCode: event.target.value || undefined })}
        fullWidth
        size="small"
      />
      <TextField
        label="Localidad"
        value={value.locality}
        onChange={(event) => onChange({ locality: event.target.value })}
        fullWidth
        size="small"
        required
      />
      <TextField
        select
        label="Provincia"
        value={value.province}
        onChange={(event) => onChange({ province: event.target.value })}
        fullWidth
        size="small"
        required
      >
        {ARGENTINE_PROVINCES.map((province) => (
          <MenuItem key={province} value={province}>
            {province}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}
