import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { Alert, Skeleton, Stack, Typography } from '@mui/material';
import { useAuth } from '../../features/auth';
import { DriverHistoryAccordion, useDriverHistory } from '../../features/driverHistory';
import { AppBrandHeader, AppLayout } from '../../shared/components';
import { HOME_ONLY_NAV_ITEMS } from '../../shared/config/bottomNavItems';
import { useDriverMenuItems } from '../../shared/hooks/useDriverMenuItems';

export function DriverHistoryPage() {
  const { logout } = useAuth();
  const menuItems = useDriverMenuItems();
  const { status, history, errorMessage } = useDriverHistory();

  return (
    <AppLayout
      title="Mis entregas"
      header={<AppBrandHeader onLogout={logout} menuItems={menuItems} />}
      bottomNavItems={HOME_ONLY_NAV_ITEMS}
    >
      <Typography component="h1" variant="h5" sx={{ fontWeight: 800 }}>
        Mis entregas
      </Typography>

      {status === 'loading' && (
        <Stack spacing={1.5}>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} variant="rounded" height={72} />
          ))}
        </Stack>
      )}

      {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}

      {status === 'success' && history.length === 0 && (
        <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <InboxOutlinedIcon sx={{ fontSize: 48 }} />
          <Typography variant="body2">No tenés entregas realizadas todavía.</Typography>
        </Stack>
      )}

      {status === 'success' && history.length > 0 && (
        <Stack spacing={1.5}>
          {history.map((entry) => (
            <DriverHistoryAccordion key={entry.id} entry={entry} />
          ))}
        </Stack>
      )}
    </AppLayout>
  );
}
