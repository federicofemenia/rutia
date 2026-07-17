import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from '../../pages/Home';
import { LoginPage } from '../../pages/Login';
import { MapPage } from '../../pages/Map';
import { ScanPage } from '../../pages/Scan';
import { RouteSummaryPage } from '../../pages/RouteSummary';
import { TrackingPage } from '../../pages/Tracking';
import { RequireAuth } from './RequireAuth';
import { ROUTES } from './routes';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.scan} element={<ScanPage />} />
          <Route path={ROUTES.routeSummary} element={<RouteSummaryPage />} />
          <Route path={ROUTES.map} element={<MapPage />} />
          <Route path={ROUTES.tracking} element={<TrackingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
