import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildTrackingPath } from '../../../app/router/routes';

interface TrackDriverDialogProps {
  open: boolean;
  onClose: () => void;
}

export function TrackDriverDialog({ open, onClose }: TrackDriverDialogProps) {
  const navigate = useNavigate();
  const [driverName, setDriverName] = useState('');

  const submit = () => {
    const trimmedName = driverName.trim();

    if (trimmedName) {
      navigate(buildTrackingPath(trimmedName));
    }
  };

  const handleFormSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    submit();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Hacer seguimiento</DialogTitle>
      <DialogContent>
        <Stack component="form" onSubmit={handleFormSubmit} spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Nombre del chofer"
            value={driverName}
            onChange={(event) => setDriverName(event.target.value)}
            fullWidth
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={submit} disabled={driverName.trim().length === 0}>
          Ver
        </Button>
      </DialogActions>
    </Dialog>
  );
}
