import { UserRole } from '@academia/types';

import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { AprobacionesPendientes } from '@/features/admin/components/aprobaciones-pendientes';
import { RoleGate } from '@/features/auth/components/role-gate';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { PanelEstudiante } from '@/features/panel/components/panel-estudiante';
import { PanelProfesor } from '@/features/panel/components/panel-profesor';

/**
 * La línea que sitúa a cada rol en su propio inicio.
 *
 * Es lo primero que se lee después del saludo, así que dice **qué hay en esta
 * pantalla**, no qué habrá. La versión anterior prometía «aquí verás tus clases
 * cuando estén disponibles» y esa clase de frase es justo lo que originó
 * HU-209: envejece mal y nadie vuelve a leerla.
 */
const CONTEXTO_POR_ROL: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'Aquí están tus clases y el catálogo de la academia.',
  [UserRole.TEACHER]: 'Aquí están las clases que impartes y desde aquí publicas una nueva.',
  [UserRole.ADMIN]: 'Aquí resuelves las solicitudes de cuenta de profesor.',
};

/**
 * `/panel` — el inicio de los tres roles (D19 de `ARQUITECTURA.md` §4.8).
 *
 * Una sola ruta, tres contenidos. **Para el administrador este inicio ES su
 * panel de operación**: la aprobación de profesores se pinta aquí, no detrás de
 * un enlace, porque era su trabajo real escondido tras una tarjeta. `/admin`
 * sigue existiendo y redirige aquí, así que ningún marcador antiguo se rompe.
 *
 * `<RoleGate>` monta un solo panel: los otros dos no llegan a renderizarse, así
 * que sus consultas tampoco se disparan. Lo que decide de verdad quién puede
 * hacer qué es el servidor; esto solo evita enseñar lo que no toca.
 */
export function PanelPage() {
  const { user } = useAuth();

  return (
    <AppShell>
      <PaginaCabecera
        titulo={`Hola, ${user?.firstName}`}
        tituloDocumento="Tu panel"
        contexto={user ? CONTEXTO_POR_ROL[user.role] : undefined}
      />

      <RoleGate roles={[UserRole.STUDENT]}>
        <PanelEstudiante />
      </RoleGate>

      <RoleGate roles={[UserRole.TEACHER]}>
        <PanelProfesor />
      </RoleGate>

      <RoleGate roles={[UserRole.ADMIN]}>
        <AprobacionesPendientes />
      </RoleGate>
    </AppShell>
  );
}
