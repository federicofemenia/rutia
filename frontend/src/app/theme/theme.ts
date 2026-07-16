import { createTheme, type Shadows } from '@mui/material/styles';

const subtleShadow = '0 1px 3px rgba(15, 23, 42, 0.08)';
const shadows = Array(25).fill(subtleShadow) as Shadows;
shadows[0] = 'none';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2F6FED',
    },
    secondary: {
      main: '#16C784',
    },
    background: {
      default: '#f5f6f8',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows,
  typography: {
    fontSize: 13,
    h5: { fontSize: '1.2rem', fontWeight: 700 },
    h6: { fontSize: '1.05rem', fontWeight: 700 },
    subtitle1: { fontSize: '0.95rem', fontWeight: 600 },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.7rem' },
    button: { fontSize: '0.8125rem', fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid rgba(15, 23, 42, 0.08)' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'inherit' },
      styleOverrides: {
        root: { borderBottom: '1px solid rgba(15, 23, 42, 0.08)' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 0 },
      },
    },
  },
});
