import { UserRole } from '@academia/types';
import { GraduationCap, type LucideIcon, Presentation, ShieldCheck } from 'lucide-react';

/**
 * Cómo se presenta cada rol en la interfaz: texto + ícono.
 *
 * Sin color: el rol es una CATEGORÍA, no un estado, y §3 reserva el color para
 * significados (éxito, error, tiempo, acción principal). Pintar cada rol de un
 * color distinto gastaría señal que necesitamos para decir cosas más urgentes.
 */
export const roleDisplay: Record<UserRole, { label: string; icon: LucideIcon }> = {
  [UserRole.STUDENT]: { label: 'Estudiante', icon: GraduationCap },
  [UserRole.TEACHER]: { label: 'Profesor', icon: Presentation },
  [UserRole.ADMIN]: { label: 'Administrador', icon: ShieldCheck },
};
