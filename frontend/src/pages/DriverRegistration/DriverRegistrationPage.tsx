import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import { Alert, Box, Button, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/router/routes';
import { useAuth } from '../../features/auth';
import { registerDriver, validateCompanyRegistrationCode } from '../../features/driverRegistration';
import logoRutiaFull from '../../shared/assets/logo-rutia-full.png';

type Step = 'code' | 'credentials';

export function DriverRegistrationPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [step, setStep] = useState<Step>('code');
  const [registrationCode, setRegistrationCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  // Solo en memoria (useState de este componente) — nunca se guarda en localStorage.
  const [registrationToken, setRegistrationToken] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleValidateCode = async (event: SubmitEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await validateCompanyRegistrationCode(registrationCode);
      setCompanyName(result.companyName);
      setRegistrationToken(result.registrationToken);
      setStep('credentials');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: SubmitEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await registerDriver({ username, password, passwordConfirmation, registrationToken });
      setSession(result);
      navigate(ROUTES.home);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsDontMatch = passwordConfirmation.length > 0 && password !== passwordConfirmation;

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
        onSubmit={step === 'code' ? handleValidateCode : handleRegister}
        spacing={4}
        sx={{ minHeight: '100%', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}
      >
        <Box
          component="img"
          src={logoRutiaFull}
          alt="RUTIA — Inteligencia para repartir"
          sx={{ width: '100%', maxWidth: 580, height: 'auto' }}
        />

        <Stack spacing={2.5} sx={{ width: '100%', maxWidth: 360 }}>
          {step === 'code' && (
            <Stack spacing={1} sx={{ textAlign: 'left' }}>
              <Typography component="label" htmlFor="registration-code" variant="subtitle1" sx={{ fontWeight: 700 }}>
                Código de registro de tu empresa
              </Typography>
              <TextField
                id="registration-code"
                value={registrationCode}
                onChange={(event) => setRegistrationCode(event.target.value)}
                fullWidth
                autoFocus
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKeyOutlinedIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>
          )}

          {step === 'credentials' && (
            <>
              <Typography variant="body2" color="text.secondary">
                Te vas a registrar en <strong>{companyName}</strong>
              </Typography>

              <Stack spacing={1} sx={{ textAlign: 'left' }}>
                <Typography component="label" htmlFor="registration-username" variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Usuario
                </Typography>
                <TextField
                  id="registration-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
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
                <Typography component="label" htmlFor="registration-password" variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Contraseña
                </Typography>
                <TextField
                  id="registration-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  fullWidth
                  required
                  autoComplete="new-password"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Stack>

              <Stack spacing={1} sx={{ textAlign: 'left' }}>
                <Typography
                  component="label"
                  htmlFor="registration-password-confirmation"
                  variant="subtitle1"
                  sx={{ fontWeight: 700 }}
                >
                  Confirmar contraseña
                </Typography>
                <TextField
                  id="registration-password-confirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  fullWidth
                  required
                  autoComplete="new-password"
                  error={passwordsDontMatch}
                  helperText={passwordsDontMatch ? 'Las contraseñas no coinciden.' : undefined}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Stack>
            </>
          )}

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Button
            type="submit"
            variant="contained"
            size="large"
            loading={loading}
            loadingPosition="start"
            disabled={
              step === 'code'
                ? registrationCode.trim().length === 0
                : username.trim().length === 0 || password.length === 0 || passwordsDontMatch
            }
            sx={{
              borderRadius: 999,
              py: 1,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              boxShadow: '0 12px 24px -8px rgba(30, 58, 138, 0.5)',
            }}
          >
            {step === 'code' ? 'Continuar' : 'Crear cuenta'}
          </Button>

          <Button variant="text" onClick={() => navigate(ROUTES.login)}>
            Ya tengo una cuenta
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
