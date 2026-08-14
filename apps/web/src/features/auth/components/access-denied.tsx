import { ShieldAlert } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { SkipLink } from '@/components/skip-link';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';

/**
 * Pantalla para cuando hay sesión válida pero el rol no alcanza.
 *
 * A propósito NO redirige a login: el usuario SÍ inició sesión, y mandarlo a un
 * formulario de acceso le haría pensar que su sesión falló y que debe volver a
 * escribir su contraseña. Aquí se le dice exactamente qué pasó y a dónde puede
 * ir, que es la regla de "explica o esconde" de §13.
 */
export function AccessDenied() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = 'Sin acceso · BigHearts';
    headingRef.current?.focus();
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <main id="contenido" className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 sm:px-6">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-semibold text-balance outline-none"
        >
          No tienes acceso a esta página
        </h1>

        <Callout variant="destructive" icon={ShieldAlert} title="Esta sección es de otro rol">
          <p>
            Tu sesión está activa, pero esta página está reservada para otro tipo de cuenta. No hace
            falta que vuelvas a iniciar sesión.
          </p>
        </Callout>

        <Button render={<Link to="/panel" />} className="h-12 w-full px-6 text-base sm:w-auto">
          Volver a mi panel
        </Button>
      </main>
    </div>
  );
}
