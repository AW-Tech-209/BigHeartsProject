import { UserRole } from '@academia/types';
import {
  BookOpen,
  CalendarCheck,
  History,
  LayoutDashboard,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

export type Destino = {
  to: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Los destinos de la navegación, por rol.
 *
 * Son **de tres a cinco por rol**, y esa es la razón de que la barra sea superior
 * y no lateral: una columna entera para tres enlaces es espacio muerto, y la
 * rejilla de aulas es justo lo que agradece el ancho.
 *
 * Ocultar un destino aquí es **solo cosmética**: quien escriba la ruta a mano
 * sigue llegando. El permiso lo decide el servidor, y `<RequireAuth roles={…}>`
 * es quien lo aplica en el cliente.
 */
// El inicio de los tres roles (`/panel`). Va primero y explícito en la barra:
// llegar al panel por el logo de BigHearts se descubre a medias.
const PANEL: Destino = { to: '/panel', label: 'Panel', icon: LayoutDashboard };
const AULAS: Destino = { to: '/aulas', label: 'Aulas', icon: BookOpen };
const HISTORIAL: Destino = { to: '/historial', label: 'Historial', icon: History };
const PERFIL: Destino = { to: '/perfil', label: 'Perfil', icon: UserRound };

export const destinosPorRol: Record<UserRole, Destino[]> = {
  [UserRole.STUDENT]: [
    PANEL,
    AULAS,
    { to: '/mis-clases', label: 'Mis clases', icon: CalendarCheck },
    HISTORIAL,
    PERFIL,
  ],
  [UserRole.TEACHER]: [
    PANEL,
    AULAS,
    { to: '/mis-aulas', label: 'Mis aulas', icon: CalendarCheck },
    HISTORIAL,
    PERFIL,
  ],
  [UserRole.ADMIN]: [PANEL, AULAS, PERFIL],
};
