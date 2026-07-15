import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  componentStack: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(_error: Error, info: ErrorInfo) {
    this.setState({ componentStack: info.componentStack ?? null });
  }

  render() {
    const { error, componentStack } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          <AlertTitle>Se produjo un error</AlertTitle>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {error.message}
          </Typography>
        </Alert>

        {componentStack && (
          <Typography
            variant="caption"
            component="pre"
            sx={{ mt: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {componentStack}
          </Typography>
        )}

        <Button variant="contained" sx={{ mt: 2 }} onClick={() => window.location.reload()}>
          Recargar
        </Button>
      </Box>
    );
  }
}
