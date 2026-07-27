import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminDriverHistoryPage, DriverHistoryPage } from '../../pages/DriverHistory';
import { DriverRegistrationPage } from '../../pages/DriverRegistration';
import { LoginPage } from '../../pages/Login';
import { MapPage } from '../../pages/Map';
import { ScanPage } from '../../pages/Scan';
import { RouteSummaryPage } from '../../pages/RouteSummary';
import { TrackingMapPage } from '../../pages/TrackingMap';
import { HomeRoute } from './HomeRoute';
import { RequireAuth } from './RequireAuth';
import { ROUTES } from './routes';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.driverRegistration} element={<DriverRegistrationPage />} />
        <Route element={<RequireAuth />}>
          <Route path={ROUTES.home} element={<HomeRoute />} />
          <Route path={ROUTES.scan} element={<ScanPage />} />
          <Route path={ROUTES.routeSummary} element={<RouteSummaryPage />} />
          <Route path={ROUTES.map} element={<MapPage />} />
          <Route path={ROUTES.driverHistory} element={<DriverHistoryPage />} />
          <Route path={ROUTES.trackingMap} element={<TrackingMapPage />} />
          <Route path={ROUTES.trackingHistory} element={<AdminDriverHistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
