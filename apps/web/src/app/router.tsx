import { UserRole } from '@academia/types';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { RedirectIfAuthenticated } from '@/features/auth/components/redirect-if-authenticated';
import { RequireAuth } from '@/features/auth/components/require-auth';
import { AulaDetallePage } from '@/pages/AulaDetallePage';
import { AulasPage } from '@/pages/AulasPage';
import { CompletarAccesibilidadPage } from '@/pages/CompletarAccesibilidadPage';
import { CrearAulaPage } from '@/pages/CrearAulaPage';
import { EditarAulaPage } from '@/pages/EditarAulaPage';
import { HistorialPage } from '@/pages/HistorialPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { MisAulasPage } from '@/pages/MisAulasPage';
import { MisClasesPage } from '@/pages/MisClasesPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PanelPage } from '@/pages/PanelPage';
import { PerfilPage } from '@/pages/PerfilPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SupervisionAulasPage } from '@/pages/SupervisionAulasPage';

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
      <AppRoutes />
    </BrowserRouter>
  );
}

/**
 * La tabla de rutas, **sin router**.
 *
 * Está separada de `<AppRouter>` para que un test pueda montarla dentro de un
 * `<MemoryRouter>` y comprobar a dónde lleva de verdad una URL — con el
 * `<BrowserRouter>` dentro, anidar routers rompería la navegación y las
 * redirecciones se quedarían sin verificar.
 */
export function AppRoutes() {
  return (
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
        La aprobación de profesores (HU-104) ya no vive aquí: es el contenido
        principal de `/panel` para el ADMIN desde HU-209 (D19).

        **La ruta no se elimina, redirige.** Cualquier marcador o enlace
        guardado de la época en que `/admin` era una pantalla sigue llevando a
        donde ahora vive esa función. `replace` para que el botón de volver no
        rebote entre las dos URLs.

        Sin `roles` a propósito: la redirección es una respuesta a una URL
        vieja, no una pantalla que ofrecer. Quien llegue sin ser ADMIN aterriza
        en su propio panel, que es lo correcto, y quien no tenga sesión lo para
        el `<RequireAuth>` de `/panel`.
      */}
      <Route path="/admin" element={<Navigate to="/panel" replace />} />

      {/*
        Supervisión de aulas para el administrador (HU-210, D20). Solo lectura:
        el admin ve todas las aulas de todos los profesores, pero no edita ni
        cancela nada ajeno (decisión 4 de la HU). Cuelga de `/admin` y no de
        `/panel` porque no es el inicio del rol sino una pantalla a la que se
        llega desde ahí.
      */}
      <Route
        path="/admin/aulas"
        element={
          <RequireAuth roles={[UserRole.ADMIN]}>
            <SupervisionAulasPage />
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

      {/*
        El historial de clases ya pasadas (HU-404, D34). El `ADMIN` queda
        fuera: su supervisión (`/admin/aulas`) ya le da todas las aulas.
      */}
      <Route
        path="/historial"
        element={
          <RequireAuth roles={[UserRole.STUDENT, UserRole.TEACHER]}>
            <HistorialPage />
          </RequireAuth>
        }
      />

      {/*
        El detalle de un aula (HU-204). **Para cualquier sesión**, no solo para
        el dueño: es la pantalla a la que lleva cada tarjeta del catálogo, y de
        la que colgarán el botón de reservar (HU-301) y la ventana de acceso al
        enlace (HU-303).

        Cuelga de `/aulas/:id` y no de `/mis-aulas/:id` porque el aula es una
        sola cosa mirada por tres roles; una URL por rol daría tres direcciones
        para la misma clase y ninguna se podría compartir.

        Sin `roles`: quien decide qué ve cada quien es el servidor, y lo que
        cambia por rol no es la pantalla sino un campo de la respuesta.
      */}
      <Route
        path="/aulas/:id"
        element={
          <RequireAuth>
            <AulaDetallePage />
          </RequireAuth>
        }
      />

      {/*
        Crear un aula (HU-201). Cuelga de `/mis-aulas` porque es donde el
        profesor gestiona su trabajo, y no de `/aulas`, que es el catálogo que
        mira el estudiante.
      */}
      <Route
        path="/mis-aulas/nueva"
        element={
          <RequireAuth roles={[UserRole.TEACHER]}>
            <CrearAulaPage />
          </RequireAuth>
        }
      />

      {/*
        Completar o corregir la accesibilidad de un aula ya creada (HU-211).
        Es la vía por la que un aula «sin indicar» deja de estarlo — no es la
        edición general del aula, que trae HU-202.
      */}
      <Route
        path="/mis-aulas/:id/accesibilidad"
        element={
          <RequireAuth roles={[UserRole.TEACHER]}>
            <CompletarAccesibilidadPage />
          </RequireAuth>
        }
      />

      {/*
        Editar un aula propia (HU-202). Cuelga de `/mis-aulas` por el mismo
        motivo que `/mis-aulas/nueva`: es donde el profesor gestiona su
        trabajo. Llega desde el botón `Editar clase` del detalle.
      */}
      <Route
        path="/mis-aulas/:id/editar"
        element={
          <RequireAuth roles={[UserRole.TEACHER]}>
            <EditarAulaPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
