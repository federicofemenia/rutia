import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { RouteProvider } from '../../features/route';
import { ROUTES } from './routes';

export function RequireAuth() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return (
    <RouteProvider>
      <Outlet />
    </RouteProvider>
  );
}
