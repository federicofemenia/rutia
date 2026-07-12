import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from '../../pages/Home';
import { ScanPage } from '../../pages/Scan';
import { ROUTES } from './routes';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.scan} element={<ScanPage />} />
      </Routes>
    </BrowserRouter>
  );
}
