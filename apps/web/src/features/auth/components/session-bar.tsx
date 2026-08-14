import { LoaderCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAnnounce } from '@/hooks/use-announce';
import { useAuth } from '../hooks/use-auth';
import { useLogout } from '../hooks/use-logout';
import { roleDisplay } from '../lib/role-labels';

/**
 * Cabecera de las pantallas privadas: quién eres y cómo salir.
 *
 * El estado de la sesión está siempre a la vista (principio 4 de §2): el
 * usuario no debería tener que abrir un menú para saber con qué cuenta y con
 * qué rol está dentro.
 */
export function SessionBar() {
  const { user } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();
  const announce = useAnnounce();

  if (!user) return null;

  const { label, icon: RoleIcon } = roleDisplay[user.role];

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => {
        announce('Cerraste tu sesión.');
        navigate('/login', { replace: true });
      },
    });
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-base font-medium text-foreground">
            {user.firstName} {user.lastName}
          </p>
          {/* Rol: ícono + texto, en neutro. El color no categoriza (§3). */}
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <RoleIcon aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
            <span>{label}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{user.email}</span>
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={logout.isPending}
          className="h-11 gap-2 px-5 text-base"
        >
          {logout.isPending ? (
            <>
              <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
              Cerrando tu sesión…
            </>
          ) : (
            <>
              <LogOut aria-hidden="true" strokeWidth={2} className="size-5" />
              Cerrar sesión
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
