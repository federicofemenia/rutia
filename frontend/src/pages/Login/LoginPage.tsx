import { Alert, Button, Stack, TextField } from '@mui/material';
import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';
import { useAuth } from '../../features/auth';
import { BrandLogo } from '../../shared/components';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
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
    <Stack
      component="form"
      onSubmit={handleSubmit}
      spacing={3}
      sx={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center', p: 2, textAlign: 'center' }}
    >
      <BrandLogo size="large" />

      <Stack spacing={2} sx={{ width: '100%', maxWidth: 360 }}>
        <TextField
          label="Usuario"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
          autoFocus
          required
          autoComplete="username"
        />
        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          fullWidth
          required
          autoComplete="current-password"
        />

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Button
          type="submit"
          variant="contained"
          size="large"
          loading={loading}
          loadingPosition="start"
          disabled={name.trim().length === 0 || password.length === 0}
        >
          Ingresar
        </Button>
      </Stack>
    </Stack>
  );
}
