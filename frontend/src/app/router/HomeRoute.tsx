import { useAuth, UserRole } from '../../features/auth';
import { AdminHomePage } from '../../pages/AdminHome';
import { HomePage } from '../../pages/Home';

/** Un admin nunca reparte — si quiere hacerlo, tiene que registrarse como chofer aparte. */
export function HomeRoute() {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.CompanyAdmin || user?.role === UserRole.SuperAdmin;

  return isAdmin ? <AdminHomePage /> : <HomePage />;
}
