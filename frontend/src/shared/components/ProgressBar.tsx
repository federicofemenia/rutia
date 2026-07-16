import { LinearProgress, Stack, Typography } from '@mui/material';

interface ProgressBarProps {
  current: number;
  total: number;
  label: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <Stack spacing={0.5}>
      <LinearProgress variant="determinate" value={percentage} sx={{ borderRadius: 1, height: 6 }} />
      <Typography variant="caption" color="text.secondary">
        {current} / {total} {label}
      </Typography>
    </Stack>
  );
}
