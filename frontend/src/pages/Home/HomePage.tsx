import { Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';

export function HomePage() {
  const navigate = useNavigate();
  console.log('useCamera hook called');

  return (
    <Stack
      component="main"
      spacing={2}
      sx={{
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
      }}
    >
      <Typography component="span" role="img" aria-label="Logo RUTIA" sx={{ fontSize: '4rem' }}>
        🚚
      </Typography>
      <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
        RUTIA
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        Inteligencia para repartir
      </Typography>
      <Button variant="contained" size="large" onClick={() => navigate(ROUTES.scan)}>
        Nueva Ruta
      </Button>
    </Stack>
  );
}
