import { Card, CardContent, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

type StatCardColor = 'warning' | 'success' | 'error' | 'info';

interface StatCardProps {
  value: number;
  label: string;
  color: StatCardColor;
}

export function StatCard({ value, label, color }: StatCardProps) {
  return (
    <Card
      sx={(theme) => ({
        flex: 1,
        bgcolor: alpha(theme.palette[color].main, 0.1),
        border: 'none',
        boxShadow: 'none',
      })}
    >
      <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: `${color}.main` }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}
