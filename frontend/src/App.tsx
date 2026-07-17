import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/router/AppRouter';
import { ErrorBoundary } from './app/ErrorBoundary';
import { AuthProvider } from './features/auth';

function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ErrorBoundary>
    </AppProviders>
  );
}

export default App;
