import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useDriverHistoryDetail } from '../hooks/useDriverHistoryDetail';
import type { DriverHistorySummary } from '../types';
import { formatHistoryDate } from '../utils/formatHistoryDate';
import { DeliveryHistoryList } from './DeliveryHistoryList';

interface DriverHistoryAccordionProps {
  entry: DriverHistorySummary;
  /** Presente solo en la vista de admin sobre un chofer puntual — ausente cuando el chofer ve su propio historial. */
  driverId?: string;
}

export function DriverHistoryAccordion({ entry, driverId }: DriverHistoryAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const { status, detail, errorMessage } = useDriverHistoryDetail(entry.id, expanded, driverId);

  return (
    <Accordion expanded={expanded} onChange={(_event, isExpanded) => setExpanded(isExpanded)} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack sx={{ width: '100%' }} spacing={0.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {formatHistoryDate(entry.finishedAt)}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Chip label={`${entry.totalDeliveries} entregas`} size="small" variant="outlined" />
            <Chip label={`${entry.deliveredCount} entregadas`} size="small" color="success" variant="outlined" />
            {entry.failedCount > 0 && (
              <Chip label={`${entry.failedCount} fallidas`} size="small" color="error" variant="outlined" />
            )}
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        {status === 'loading' && (
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Cargando...</Typography>
          </Stack>
        )}

        {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}

        {status === 'success' && detail && <DeliveryHistoryList deliveries={detail.deliveries} />}
      </AccordionDetails>
    </Accordion>
  );
}
