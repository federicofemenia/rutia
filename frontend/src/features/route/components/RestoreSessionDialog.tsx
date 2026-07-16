import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { formatLastModified } from '../utils/formatLastModified';

interface RestoreSessionDialogProps {
  open: boolean;
  deliveryCount: number;
  lastModified: Date;
  onContinue: () => void;
  onStartNew: () => void;
}

export function RestoreSessionDialog({
  open,
  deliveryCount,
  lastModified,
  onContinue,
  onStartNew,
}: RestoreSessionDialogProps) {
  return (
    <Dialog open={open}>
      <DialogTitle>Encontramos una ruta en progreso</DialogTitle>
      <DialogContent>
        <Typography variant="body1">📦 {deliveryCount} entregas</Typography>
        <Typography variant="body2" color="text.secondary">
          Última modificación: {formatLastModified(lastModified)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onStartNew}>Comenzar una nueva</Button>
        <Button variant="contained" onClick={onContinue}>
          Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
