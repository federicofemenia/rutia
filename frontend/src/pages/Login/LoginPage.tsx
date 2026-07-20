import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Alert, Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';
import { useAuth } from '../../features/auth';
import logoRutiaFull from '../../shared/assets/logo-rutia-full.png';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      await login(name, password);
      navigate(ROUTES.home);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100dvh',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #E3ECFC 0%, #F5F8FD 45%, #FFFFFF 75%)',
        pt: 'env(safe-area-inset-top)',
        pb: 'env(safe-area-inset-bottom)',
        '@supports (-webkit-touch-callout: none)': { height: '-webkit-fill-available' },
      }}
    >
      <Stack
        component="form"
        onSubmit={handleSubmit}
        spacing={4}
        sx={{ minHeight: '100%', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}
      >
        <Box component="img" src={logoRutiaFull} alt="RUTIA — Inteligencia para repartir" sx={{ width: '100%', maxWidth: 580, height: 'auto' }} />

        <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 360 }}>
          <Stack spacing={1} sx={{ textAlign: 'left' }}>
            <Typography component="label" htmlFor="login-username" variant="subtitle1" sx={{ fontWeight: 700 }}>
              Usuario
            </Typography>
            <TextField
              id="login-username"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              autoFocus
              required
              autoComplete="username"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>

          <Stack spacing={1} sx={{ textAlign: 'left' }}>
            <Typography component="label" htmlFor="login-password" variant="subtitle1" sx={{ fontWeight: 700 }}>
              Contraseña
            </Typography>
            <TextField
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              fullWidth
              required
              autoComplete="current-password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onClick={() => setShowPassword((previous) => !previous)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Button
            type="submit"
            variant="contained"
            size="large"
            loading={loading}
            loadingPosition="start"
            disabled={name.trim().length === 0 || password.length === 0}
            sx={{
              borderRadius: 999,
              py: 1,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              boxShadow: '0 12px 24px -8px rgba(30, 58, 138, 0.5)',
            }}
          >
            Ingresar
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
