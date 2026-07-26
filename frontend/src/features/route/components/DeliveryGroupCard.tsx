import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { Card, CardActionArea, Chip, Collapse, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { IconBadge } from '../../../shared/components';
import { DeliveryStatus, type Delivery } from '../types';
import type { DeliveryLegInfo } from '../utils/buildDeliveryLegInfo';
import { formatLocalityLine, formatStreetLine } from '../utils/formatDeliveryAddress';
import { DeliveryListItem } from './DeliveryListItem';
import { DeliveryStatusChip } from './DeliveryStatusChip';

interface DeliveryGroupCardProps {
  deliveries: Delivery[];
  /** Tramo hacia la siguiente parada distinta — se calcula desde la última entrega del grupo. */
  legInfo?: DeliveryLegInfo;
  hasActiveDelivery: boolean;
  onOpen: (delivery: Delivery) => void;
  onNavigate: (delivery: Delivery) => void;
  onStart: (delivery: Delivery) => void;
  onDelete: (delivery: Delivery) => void;
}

function commonStatus(deliveries: Delivery[]): DeliveryStatus | null {
  const [first, ...rest] = deliveries;
  if (first && rest.every((delivery) => delivery.status === first.status)) {
    return first.status;
  }
  return null;
}

/**
 * Varios paquetes con la misma dirección (mismo Google Place, o mismo texto normalizado) se
 * muestran como una sola card con contador, en vez de una card duplicada por paquete. Si el grupo
 * tiene un solo paquete, se comporta exactamente igual que `DeliveryListItem` solo (sin envoltorio
 * extra) — el agrupamiento nunca cambia nada visualmente para el caso común de una dirección con
 * un solo envío.
 */
export function DeliveryGroupCard({ deliveries, legInfo, hasActiveDelivery, onOpen, onNavigate, onStart, onDelete }: DeliveryGroupCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (deliveries.length === 1) {
    const [delivery] = deliveries;
    return (
      <DeliveryListItem
        delivery={delivery}
        legInfo={legInfo}
        hasActiveDelivery={hasActiveDelivery}
        onOpen={onOpen}
        onNavigate={onNavigate}
        onStart={onStart}
        onDelete={onDelete}
      />
    );
  }

  const [first] = deliveries;
  const status = commonStatus(deliveries);

  return (
    <Card>
      <CardActionArea onClick={() => setExpanded((previous) => !previous)} sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <IconBadge icon={<Inventory2Icon fontSize="small" />} color="primary" />

          <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
              {formatStreetLine(first.address) || '(sin dirección)'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {formatLocalityLine(first.address) || undefined}
            </Typography>
          </Stack>

          <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
            <Chip label={`${deliveries.length} entregas`} size="small" color="primary" />
            {status && <DeliveryStatusChip status={status} />}
          </Stack>

          {expanded ? <ExpandLessIcon color="action" /> : <ExpandMoreIcon color="action" />}
        </Stack>
      </CardActionArea>

      <Collapse in={expanded}>
        <Stack spacing={1} sx={{ p: 1.5, pt: 0 }}>
          {deliveries.map((delivery) => (
            <DeliveryListItem
              key={delivery.id}
              delivery={delivery}
              hasActiveDelivery={hasActiveDelivery}
              onOpen={onOpen}
              onNavigate={onNavigate}
              onStart={onStart}
              onDelete={onDelete}
            />
          ))}
        </Stack>
      </Collapse>
    </Card>
  );
}
