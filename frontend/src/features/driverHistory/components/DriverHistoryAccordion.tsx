import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import {
  DeliveryStatus,
  DeliveryStatusChip,
  FAILURE_REASON_LABELS,
  formatLocalityLine,
  formatStreetLine,
} from '../../route';
import { useDriverHistoryDetail } from '../hooks/useDriverHistoryDetail';
import type { DriverHistorySummary } from '../types';
import { formatHistoryDate } from '../utils/formatHistoryDate';

interface DriverHistoryAccordionProps {
  entry: DriverHistorySummary;
}

export function DriverHistoryAccordion({ entry }: DriverHistoryAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const { status, detail, errorMessage } = useDriverHistoryDetail(entry.id, expanded);

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

        {status === 'success' && detail && (
          <List disablePadding>
            {detail.deliveries.map((delivery) => (
              <ListItem key={delivery.id} divider sx={{ gap: 1, alignItems: 'flex-start', px: 0 }}>
                <ListItemText
                  primary={formatStreetLine(delivery.address) || '(sin dirección)'}
                  secondary={
                    <>
                      {formatLocalityLine(delivery.address) && (
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          {formatLocalityLine(delivery.address)}
                        </Typography>
                      )}
                      {delivery.status === DeliveryStatus.Failed && delivery.failureReasonCode && (
                        <Typography component="span" variant="caption" color="error" sx={{ display: 'block' }}>
                          {FAILURE_REASON_LABELS[delivery.failureReasonCode]}
                          {delivery.failureReasonDetail ? `: ${delivery.failureReasonDetail}` : ''}
                        </Typography>
                      )}
                    </>
                  }
                  slotProps={{
                    primary: { variant: 'body2', noWrap: true, sx: { fontWeight: 600 } },
                  }}
                />
                <DeliveryStatusChip status={delivery.status} />
              </ListItem>
            ))}
          </List>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
