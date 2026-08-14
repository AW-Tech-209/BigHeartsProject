import { type RegisterableRole, type User, UserStatus } from '@academia/types';
import { ArrowRight, CircleCheck, Clock } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { useAnnounce } from '@/hooks/use-announce';
import { roleLabels } from '../lib/accessibility-labels';

/**
 * Confirmación diferenciada según el estado de la cuenta creada:
 *  - PENDING (profesor a la espera de aprobación) → aviso ámbar "pendiente".
 *  - ACTIVE (estudiante, o profesor sin aprobación) → éxito verde.
 *
 * Al montar, mueve el foco al `<h1>` y anuncia el resultado por la región viva.
 */
export function RegistrationResult({ user }: { user: User }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const announce = useAnnounce();
  const pending = user.status === UserStatus.PENDING;

  useEffect(() => {
    document.title = 'Cuenta creada · BigHearts';
    headingRef.current?.focus();
    announce(
      pending
        ? 'Cuenta creada. Está pendiente de aprobación de un administrador.'
        : 'Cuenta creada correctamente. Ya puedes iniciar sesión.',
    );
  }, [pending, announce]);

  return (
    <div className="space-y-6">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-3xl font-semibold text-balance outline-none"
      >
        {pending ? 'Tu cuenta está pendiente de aprobación' : 'Tu cuenta está lista'}
      </h1>

      {pending ? (
        <Callout variant="attention" icon={Clock} title="Pendiente de aprobación">
          <p>
            Hola {user.firstName}. Creamos tu cuenta de profesor. Un administrador debe aprobarla
            antes de que puedas entrar. Te avisaremos por correo a{' '}
            <span className="font-medium">{user.email}</span>.
          </p>
        </Callout>
      ) : (
        <Callout variant="success" icon={CircleCheck} title="Cuenta creada">
          <p>
            Hola {user.firstName}. Tu cuenta de{' '}
            {roleLabels[user.role as RegisterableRole] ?? 'usuario'} está activa. Ya puedes iniciar
            sesión y empezar.
          </p>
        </Callout>
      )}

      {/* Una cuenta pendiente todavía no puede entrar: mandarla al login sería
          empujarla a un error. La activa sí continúa el flujo hasta el final. */}
      <Button
        render={<Link to={pending ? '/' : '/login'} />}
        className="h-12 w-full px-6 text-base sm:w-auto"
      >
        {pending ? 'Ir al inicio' : 'Iniciar sesión'}
        <ArrowRight aria-hidden="true" strokeWidth={2} className="size-5" />
      </Button>
    </div>
  );
}
