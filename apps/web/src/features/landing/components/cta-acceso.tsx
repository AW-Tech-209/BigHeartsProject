import { LayoutDashboard, LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { cn } from '@/lib/utils';

type CtaAccesoProps = {
  /** En la cabecera los botones van más bajos y con texto más corto. */
  compacto?: boolean;
  className?: string;
};

/**
 * El par de acciones de la landing: crear cuenta e iniciar sesión.
 *
 * Consciente de la sesión: mientras se rehidrata reserva el alto de los botones
 * —enseñar «Iniciar sesión» y cambiarlo medio segundo después es peor que
 * esperar, pero el hueco evita que nada salte al aparecer—, y a quien ya tiene
 * sesión le ofrece su panel en vez de un registro que no necesita.
 */
export function CtaAcceso({ compacto = false, className }: CtaAccesoProps) {
  const { isAuthenticated, isChecking } = useAuth();

  const alto = compacto ? 'h-11 px-4 text-sm' : 'h-12 px-6 text-base';

  if (isChecking) {
    return <div aria-hidden="true" className={cn(compacto ? 'h-11' : 'h-12', className)} />;
  }

  if (isAuthenticated) {
    return (
      <div className={cn('flex flex-wrap gap-3', className)}>
        <Button render={<Link to="/panel" />} className={cn('gap-2', alto)}>
          <LayoutDashboard aria-hidden="true" strokeWidth={2} className="size-5" />
          Ir a mi panel
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      <Button render={<Link to="/registro" />} className={cn('gap-2', alto)}>
        <UserPlus aria-hidden="true" strokeWidth={2} className="size-5" />
        {compacto ? 'Crear cuenta' : 'Crear una cuenta'}
      </Button>
      <Button variant="outline" render={<Link to="/login" />} className={cn('gap-2', alto)}>
        <LogIn aria-hidden="true" strokeWidth={2} className="size-5" />
        Iniciar sesión
      </Button>
    </div>
  );
}
