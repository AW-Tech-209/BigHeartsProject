import { type AdminUsuarioItem, UserRole, UserStatus } from '@academia/types';
import {
  CircleCheck,
  Clock,
  GraduationCap,
  KeyRound,
  type LucideIcon,
  Presentation,
  ShieldCheck,
  Ban,
  CircleX,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { RegenerarContrasenaDialog } from './regenerar-contrasena-dialog';

const ROLES: Record<UserRole, { label: string; icon: LucideIcon }> = {
  [UserRole.STUDENT]: { label: 'Estudiante', icon: GraduationCap },
  [UserRole.TEACHER]: { label: 'Profesor', icon: Presentation },
  [UserRole.ADMIN]: { label: 'Administrador', icon: ShieldCheck },
};

const ESTADOS: Record<
  UserStatus,
  { label: string; icon: LucideIcon; tono: 'success' | 'info' | 'destructive' }
> = {
  [UserStatus.ACTIVE]: { label: 'Activa', icon: CircleCheck, tono: 'success' },
  [UserStatus.PENDING]: { label: 'Pendiente de aprobación', icon: Clock, tono: 'info' },
  [UserStatus.REJECTED]: { label: 'Rechazada', icon: CircleX, tono: 'destructive' },
  [UserStatus.SUSPENDED]: { label: 'Suspendida', icon: Ban, tono: 'destructive' },
};

type Props = {
  items: AdminUsuarioItem[];
  total: number;
  regenerando: boolean;
  onRegenerar: (usuario: AdminUsuarioItem) => Promise<void>;
};

export function ListaUsuarios({ items, total, regenerando, onRegenerar }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs">
      <p className="border-b border-border px-4 py-3 text-base text-muted-foreground sm:px-5">
        {total === 1 ? '1 usuario encontrado.' : `${total} usuarios encontrados.`}
      </p>

      <ul aria-label="Usuarios de la academia">
        {items.map((usuario) => {
          const rol = ROLES[usuario.role];
          const estado = ESTADOS[usuario.status];
          const puedeRegenerar = usuario.role !== UserRole.ADMIN;

          return (
            <li
              key={usuario.id}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-4 last:border-b-0 sm:px-5"
            >
              <div className="min-w-0 space-y-2">
                <p className="text-lg font-medium">
                  {usuario.firstName} {usuario.lastName}
                </p>
                <p className="text-base break-all text-muted-foreground">{usuario.email}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge icon={rol.icon}>{rol.label}</Badge>
                  <Badge tono={estado.tono} icon={estado.icon}>
                    {estado.label}
                  </Badge>
                  {usuario.pendienteDePrimerIngreso && (
                    <Badge tono="attention" icon={KeyRound}>
                      Pendiente de primer ingreso
                    </Badge>
                  )}
                </div>
              </div>

              {puedeRegenerar && (
                <RegenerarContrasenaDialog
                  usuario={usuario}
                  isPending={regenerando}
                  onConfirm={onRegenerar}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
