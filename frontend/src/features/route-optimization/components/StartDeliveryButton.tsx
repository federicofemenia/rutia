import { Button, type ButtonProps } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/router/routes';
import { type Delivery, useRoute } from '../../route';
import { OptimizeRouteDialog } from './OptimizeRouteDialog';

type StartDeliveryButtonProps = Pick<ButtonProps, 'variant' | 'size' | 'fullWidth' | 'sx'>;

export function StartDeliveryButton(buttonProps: StartDeliveryButtonProps) {
  const navigate = useNavigate();
  const { session, reorderDeliveries } = useRoute();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOptimized = (deliveries: Delivery[]) => {
    reorderDeliveries(deliveries);
    navigate(ROUTES.routeSummary);
  };

  return (
    <>
      <Button {...buttonProps} onClick={() => setIsDialogOpen(true)}>
        Comenzar reparto
      </Button>

      <OptimizeRouteDialog
        open={isDialogOpen}
        deliveries={session.deliveries}
        onClose={() => setIsDialogOpen(false)}
        onOptimized={handleOptimized}
      />
    </>
  );
}
