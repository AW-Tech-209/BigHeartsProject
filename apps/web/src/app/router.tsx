import { UserRole } from '@academia/types';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { RedirectIfAuthenticated } from '@/features/auth/components/redirect-if-authenticated';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { AdminPage } from '@/pages/AdminPage';
import { AulasPage } from '@/pages/AulasPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { MisAulasPage } from '@/pages/MisAulasPage';
import { MisClasesPage } from '@/pages/MisClasesPage';
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

        {/*
          Aprobación de profesores (HU-104). No está en la barra de navegación
          —los destinos de ADMIN son Aulas · Panel · Perfil— sino colgada de la
          tarjeta «Administración» del panel, que ya la anunciaba. Se entra
          desde ahí.

          El `roles` evita ofrecer una pantalla que acabaría en 403; quien
          escriba la URL a mano igualmente recibe `INSUFFICIENT_ROLE` del
          servidor, que es quien decide.
        */}
        <Route
          path="/admin"
          element={
            <RequireAuth roles={[UserRole.ADMIN]}>
              <AdminPage />
            </RequireAuth>
          }
        />

        {/*
          Los tres destinos de la barra de navegación. Se registran aquí desde
          HU-206 aunque su contenido llegue después (HU-201, HU-203 y el Sprint
          3): un enlace visible que cae en un 404 enseña a desconfiar de la
          navegación, y esa lección no se desaprende.

          El rol se replica aquí solo para no ofrecer una pantalla que no
          corresponde. Quien decide de verdad es el servidor.
        */}
        <Route
          path="/aulas"
          element={
            <RequireAuth>
              <AulasPage />
            </RequireAuth>
          }
        />
        <Route
          path="/mis-clases"
          element={
            <RequireAuth roles={[UserRole.STUDENT]}>
              <MisClasesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/mis-aulas"
          element={
            <RequireAuth roles={[UserRole.TEACHER]}>
              <MisAulasPage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
