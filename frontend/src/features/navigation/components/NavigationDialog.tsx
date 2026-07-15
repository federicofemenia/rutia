import { Button, Dialog, DialogActions, DialogTitle, List, ListItemButton, ListItemText } from '@mui/material';
import { useNavigation } from '../hooks/useNavigation';
import type { NavigationDestination } from '../providers/NavigationProvider';

interface NavigationDialogProps {
  destination: NavigationDestination | null;
  onClose: () => void;
}

export function NavigationDialog({ destination, onClose }: NavigationDialogProps) {
  const { providers, openNavigation } = useNavigation();

  const handleSelect = (providerId: string) => {
    if (!destination) {
      return;
    }

    openNavigation(providerId, destination);
    onClose();
  };

  return (
    <Dialog open={destination !== null} onClose={onClose}>
      <DialogTitle>Navegar con</DialogTitle>
      <List>
        {providers.map((provider) => (
          <ListItemButton key={provider.id} onClick={() => handleSelect(provider.id)}>
            <ListItemText primary={provider.label} />
          </ListItemButton>
        ))}
      </List>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}
