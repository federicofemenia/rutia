import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PlaceIcon from '@mui/icons-material/Place';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import type { RouteSummaryInfo } from '../types';
import { formatDistance, formatDuration } from '../utils/formatRouteMetrics';

interface RouteOverviewCardProps {
  deliveryCount: number;
  routeSummary: RouteSummaryInfo;
}

function OverviewStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Stack spacing={0.25} sx={{ alignItems: 'center', flex: 1 }}>
      {icon}
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

export function RouteOverviewCard({ deliveryCount, routeSummary }: RouteOverviewCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <OverviewStat icon={<PlaceIcon fontSize="small" color="action" />} value={String(deliveryCount)} label="Entregas" />
          <OverviewStat
            icon={<DirectionsCarIcon fontSize="small" color="action" />}
            value={formatDistance(routeSummary.totalDistance)}
            label="Distancia total"
          />
          <OverviewStat
            icon={<AccessTimeIcon fontSize="small" color="action" />}
            value={formatDuration(routeSummary.totalDuration)}
            label="Tiempo estimado"
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
