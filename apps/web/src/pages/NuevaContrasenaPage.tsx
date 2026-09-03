import { ArrowRight, CircleAlert, CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { LayoutAutenticacion } from '@/components/layout/layout-autenticacion';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card } from '@/components/ui/card';
import { NuevaContrasenaForm } from '@/features/auth/components/nueva-contrasena-form';

export function NuevaContrasenaPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [hecho, setHecho] = useState(false);

  return (
    <LayoutAutenticacion>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <PaginaCabecera
          titulo="Crea una contraseña nueva"
          tituloDocumento="Contraseña nueva"
          contexto={
            hecho ? undefined : 'Escribe la contraseña con la que entrarás a partir de ahora.'
          }
        />

        {hecho ? (
          <>
            <Callout variant="success" icon={CircleCheck} live="polite" title="Contraseña cambiada">
              <p>Ya puedes iniciar sesión con tu contraseña nueva.</p>
            </Callout>
            <Button
              render={<Link to="/login" />}
              className="h-12 w-full gap-2 px-6 text-base sm:w-auto"
            >
              Iniciar sesión
              <ArrowRight aria-hidden="true" strokeWidth={2} className="size-5" />
            </Button>
          </>
        ) : token ? (
          <Card className="p-6 sm:p-8">
            <NuevaContrasenaForm token={token} onHecho={() => setHecho(true)} />
          </Card>
        ) : (
          <Callout variant="destructive" icon={CircleAlert} title="Falta el enlace de recuperación">
            <p>
              Abre el enlace completo del último correo que te enviamos, o{' '}
              <Link
                to="/recuperar-contrasena"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                pide uno nuevo
              </Link>
              .
            </p>
          </Callout>
        )}
      </div>
    </LayoutAutenticacion>
  );
}
