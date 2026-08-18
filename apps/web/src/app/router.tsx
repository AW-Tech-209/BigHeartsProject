import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { RedirectIfAuthenticated } from '@/features/auth/components/redirect-if-authenticated';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PanelPage } from '@/pages/PanelPage';
import { PerfilPage } from '@/pages/PerfilPage';
import { RegisterPage } from '@/pages/RegisterPage';

/**
 * Rutas de la aplicación.
 *
 * Las privadas se envuelven en `<RequireAuth>`, que redirige a `/login` cuando
 * no hay sesión válida y acepta una lista de roles para las que además exigen
 * un rol concreto (`<RequireAuth roles={[UserRole.ADMIN]}>`).
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <LoginPage />
            </RedirectIfAuthenticated>
          }
        />

        {/* Privadas */}
        <Route
          path="/panel"
          element={
            <RequireAuth>
              <PanelPage />
            </RequireAuth>
          }
        />
        <Route
          path="/perfil"
          element={
            <RequireAuth>
              <PerfilPage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
