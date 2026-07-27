import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Chip, Stack, Typography } from '@mui/material';
import { DeliveryStatus, summarizeDeliveries, type Delivery } from '../../route';
import { DeliveryHistoryList } from './DeliveryHistoryList';

interface InProgressRouteAccordionProps {
  deliveries: Delivery[];
}

/** Ruta activa del chofer (todavía no finalizada) — se muestra desplegada por defecto, distinta de las entradas ya archivadas del historial. */
export function InProgressRouteAccordion({ deliveries }: InProgressRouteAccordionProps) {
  const counts = summarizeDeliveries(deliveries);
  const pendingCount = counts[DeliveryStatus.Pending] + counts[DeliveryStatus.InProgress];

  return (
    <Accordion defaultExpanded disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack sx={{ width: '100%' }} spacing={0.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip label="En curso" size="small" color="info" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Ruta actual
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip label={`${deliveries.length} entregas`} size="small" variant="outlined" />
            <Chip label={`${counts[DeliveryStatus.Delivered]} entregadas`} size="small" color="success" variant="outlined" />
            {counts[DeliveryStatus.Failed] > 0 && (
              <Chip label={`${counts[DeliveryStatus.Failed]} fallidas`} size="small" color="error" variant="outlined" />
            )}
            {pendingCount > 0 && <Chip label={`${pendingCount} pendientes`} size="small" color="warning" variant="outlined" />}
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <DeliveryHistoryList deliveries={deliveries} />
      </AccordionDetails>
    </Accordion>
  );
}
