import { UserRole } from '@academia/types';
import { BookOpen, CalendarCheck, LayoutDashboard, UserRound, type LucideIcon } from 'lucide-react';

export type Destino = {
  to: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Los destinos de la navegación, por rol.
 *
 * Son **tres o cuatro por rol**, y esa es la razón de que la barra sea superior
 * y no lateral: una columna entera para tres enlaces es espacio muerto, y la
 * rejilla de aulas es justo lo que agradece el ancho.
 *
 * Ocultar un destino aquí es **solo cosmética**: quien escriba la ruta a mano
 * sigue llegando. El permiso lo decide el servidor, y `<RequireAuth roles={…}>`
 * es quien lo aplica en el cliente.
 */
const AULAS: Destino = { to: '/aulas', label: 'Aulas', icon: BookOpen };
const PERFIL: Destino = { to: '/perfil', label: 'Perfil', icon: UserRound };

export const destinosPorRol: Record<UserRole, Destino[]> = {
  [UserRole.STUDENT]: [
    AULAS,
    { to: '/mis-clases', label: 'Mis clases', icon: CalendarCheck },
    PERFIL,
  ],
  [UserRole.TEACHER]: [
    AULAS,
    { to: '/mis-aulas', label: 'Mis aulas', icon: CalendarCheck },
    PERFIL,
  ],
  [UserRole.ADMIN]: [AULAS, { to: '/panel', label: 'Panel', icon: LayoutDashboard }, PERFIL],
};
