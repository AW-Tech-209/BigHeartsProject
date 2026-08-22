import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { useInvitacionPreferencia } from '../hooks/use-invitacion-preferencia';

/**
 * Invita al estudiante a declarar su preferencia de comunicación, cuando no
 * la declaró (HU-211, T14). Se muestra en el catálogo porque es donde la
 * falta del dato se nota: sin ella, ninguna clase se marca «Coincide con tu
 * preferencia».
 *
 * **Una sola vez, sin insistir (AC6):** al cerrarla no vuelve a aparecer en
 * este navegador — `useInvitacionPreferencia` lo recuerda en `localStorage`.
 * No es un bloqueo ni un `required`: el estudiante puede seguir usando el
 * catálogo sin declararla nunca.
 */
export function InvitacionPreferencia({ userId }: { userId: string }) {
  const { cerrada, cerrar } = useInvitacionPreferencia(userId);

  if (cerrada) return null;

  return (
    <Callout variant="info" title="Cuéntanos cómo prefieres comunicarte">
      <div className="space-y-3">
        <p>
          Con esa preferencia destacamos las clases que puedes seguir sin depender del audio. Es
          opcional y puedes completarla cuando quieras desde tu perfil.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link to="/perfil" />} className="h-10 px-4 text-sm">
            Completar mi perfil
          </Button>
          <Button variant="outline" onClick={cerrar} className="h-10 px-4 text-sm">
            Ahora no
          </Button>
        </div>
      </div>
    </Callout>
  );
}
