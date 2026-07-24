import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import type { GeocodeCandidateOption } from '../types';

interface GeocodeOptionsDialogProps {
  /** `null` = cerrado. Se muestran solo cuando hay más de una ubicación empatada. */
  options: GeocodeCandidateOption[] | null;
  onSelect: (option: GeocodeCandidateOption) => void;
  onClose: () => void;
}

export function GeocodeOptionsDialog({ options, onSelect, onClose }: GeocodeOptionsDialogProps) {
  return (
    <Dialog open={options !== null} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>¿Cuál es la ubicación correcta?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Encontramos más de un lugar que coincide con esta dirección. Elegí el correcto:
        </Typography>
        <List disablePadding>
          {options?.map((option, index) => (
            <ListItemButton key={index} disableGutters onClick={() => onSelect(option)}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <LocationOnIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary={option.label} />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}
