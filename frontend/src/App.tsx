import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/router/AppRouter';
import { ErrorBoundary } from './app/ErrorBoundary';
import { RouteProvider } from './features/route';

function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <RouteProvider>
          <AppRouter />
        </RouteProvider>
      </ErrorBoundary>
    </AppProviders>
  );
}

export default App;