import { ArrowLeft, CircleCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { LayoutAutenticacion } from '@/components/layout/layout-autenticacion';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Callout } from '@/components/ui/callout';
import { Card } from '@/components/ui/card';
import { SolicitarRecuperacionForm } from '@/features/auth/components/solicitar-recuperacion-form';

export function SolicitarRecuperacionPage() {
  const [enviado, setEnviado] = useState(false);

  return (
    <LayoutAutenticacion>
      <div className="mx-auto w-full max-w-lg space-y-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden="true" strokeWidth={2} className="size-4" />
          Volver a iniciar sesión
        </Link>

        <PaginaCabecera
          titulo="Recupera tu contraseña"
          tituloDocumento="Recuperar contraseña"
          contexto="Escribe tu email y te enviamos un enlace para crear una contraseña nueva."
        />

        {enviado ? (
          <Callout variant="success" icon={CircleCheck} live="polite" title="Revisa tu correo">
            <p>
              Si hay una cuenta con ese email, te enviamos un enlace para crear una contraseña
              nueva. Puede tardar unos minutos en llegar.
            </p>
          </Callout>
        ) : (
          <Card className="p-6 sm:p-8">
            <SolicitarRecuperacionForm onEnviado={() => setEnviado(true)} />
          </Card>
        )}
      </div>
    </LayoutAutenticacion>
  );
}
