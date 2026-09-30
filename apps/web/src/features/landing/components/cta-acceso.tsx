import { LayoutDashboard, LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useRegistroAbierto } from '@/features/auth/hooks/use-registro-abierto';
import { cn } from '@/lib/utils';

type CtaAccesoProps = {
  className?: string;
};

/**
 * Las acciones de la barra de la landing: iniciar sesión y, si el servidor
 * tiene el registro abierto, crear cuenta.
 *
 * Consciente de la sesión: mientras se rehidrata reserva el alto de los botones
 * —enseñar «Iniciar sesión» y cambiarlo medio segundo después es peor que
 * esperar, pero el hueco evita que nada salte al aparecer—, y a quien ya tiene
 * sesión le ofrece su panel en vez de un registro que no necesita.
 */
export function CtaAcceso({ className }: CtaAccesoProps) {
  const { isAuthenticated, isChecking } = useAuth();
  const { abierto } = useRegistroAbierto();

  const alto = 'h-11 px-3 text-sm sm:px-4';

  if (isChecking) {
    return <div aria-hidden="true" className={cn('h-11', className)} />;
  }

  if (isAuthenticated) {
    return (
      <div className={cn('flex gap-2 sm:gap-3', className)}>
        <Button render={<Link to="/panel" />} className={cn('gap-2', alto)}>
          <LayoutDashboard aria-hidden="true" strokeWidth={2} className="size-5" />
          Ir a mi panel
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2 sm:gap-3', className)}>
      {abierto && (
        <Button render={<Link to="/registro" />} className={cn('gap-2', alto)}>
          <UserPlus aria-hidden="true" strokeWidth={2} className="hidden size-5 sm:block" />
          Crear cuenta
        </Button>
      )}
      <Button
        variant={abierto ? 'outline' : 'default'}
        render={<Link to="/login" />}
        className={cn('gap-2', alto)}
      >
        <LogIn aria-hidden="true" strokeWidth={2} className="hidden size-5 sm:block" />
        Iniciar sesión
      </Button>
    </div>
  );
}
