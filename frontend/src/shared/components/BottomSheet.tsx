import { Box, Drawer } from '@mui/material';
import type { ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            px: 2,
            pt: 1.5,
            pb: 3,
          },
        },
      }}
    >
      <Box sx={{ width: 36, height: 4, bgcolor: 'divider', borderRadius: 2, mx: 'auto', mb: 1.5 }} />
      {children}
    </Drawer>
  );
}
