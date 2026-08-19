import { type RegisterableRole, type User, UserStatus } from '@academia/types';
import { ArrowRight, CircleCheck, Clock } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { useAnnounce } from '@/hooks/use-announce';
import { roleLabels } from '../lib/accessibility-labels';

/**
 * El `<h1>` que le corresponde a esta pantalla según cómo acabó el registro.
 *
 * Vive aquí y no en la página porque la condición —cuenta pendiente o activa—
 * es de este componente; la página solo lo pinta. Y lo pinta ella porque el
 * único `<h1>` de cada pantalla lo pone `<PaginaCabecera>`, que además es quien
 * mueve el foco y actualiza el título del documento.
 */
export function tituloDeRegistro(user: User): string {
  return user.status === UserStatus.PENDING
    ? 'Tu cuenta está pendiente de aprobación'
    : 'Tu cuenta está lista';
}

/**
 * Confirmación diferenciada según el estado de la cuenta creada:
 *  - PENDING (profesor a la espera de aprobación) → aviso ámbar "pendiente".
 *  - ACTIVE (estudiante, o profesor sin aprobación) → éxito verde.
 *
 * Al montar anuncia el resultado por la región viva. El foco y el título del
 * documento los mueve `<PaginaCabecera>`.
 */
export function RegistrationResult({ user }: { user: User }) {
  const announce = useAnnounce();
  const pending = user.status === UserStatus.PENDING;

  useEffect(() => {
    announce(
      pending
        ? 'Cuenta creada. Está pendiente de aprobación de un administrador.'
        : 'Cuenta creada correctamente. Ya puedes iniciar sesión.',
    );
  }, [pending, announce]);

  return (
    <div className="space-y-6">
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
