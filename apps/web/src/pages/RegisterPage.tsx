import type { User } from '@academia/types';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

import { LayoutAutenticacion } from '@/components/layout/layout-autenticacion';
import { BotonAyuda } from '@/components/layout/boton-ayuda';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRegistroAbierto } from '@/features/auth/hooks/use-registro-abierto';
import { RegisterForm } from '@/features/auth/components/register-form';
import {
  RegistrationResult,
  tituloDeRegistro,
} from '@/features/auth/components/registration-result';

export function RegisterPage() {
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);
  const { abierto, cargando } = useRegistroAbierto();

  if (cargando) {
    return (
      <LayoutAutenticacion>
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <PaginaCabecera titulo="Crea tu cuenta" tituloDocumento="Crear cuenta" />
          <p role="status" className="text-muted-foreground">
            Cargando…
          </p>
        </div>
      </LayoutAutenticacion>
    );
  }

  if (!abierto && !registeredUser) {
    return (
      <LayoutAutenticacion>
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <PaginaCabecera
            titulo="El registro está cerrado"
            tituloDocumento="Registro cerrado"
            contexto="BigHearts está en fase de pruebas. Las cuentas las crea la academia."
          />
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className={cn(buttonVariants(), 'h-12 gap-2 px-4')}>
              <LogIn aria-hidden="true" strokeWidth={2} className="size-5" />
              Iniciar sesión
            </Link>
            <BotonAyuda />
          </div>
        </div>
      </LayoutAutenticacion>
    );
  }

  return (
    <LayoutAutenticacion>
      <div className="mx-auto w-full max-w-2xl space-y-8">
        {/*
          Un solo `<h1>` en las dos mitades de la pantalla. El título cambia al
          registrarse, y ese cambio vuelve a llevar el foco al encabezado: es lo
          que le dice a quien navega con lector que el formulario terminó.
        */}
        <PaginaCabecera
          titulo={registeredUser ? tituloDeRegistro(registeredUser) : 'Crea tu cuenta'}
          tituloDocumento={registeredUser ? 'Cuenta creada' : 'Crear cuenta'}
          contexto={
            registeredUser
              ? undefined
              : 'Regístrate para acceder a las clases de inglés de BigHearts, la academia pensada para personas hipoacúsicas y sordas.'
          }
        />

        {registeredUser ? (
          <RegistrationResult user={registeredUser} />
        ) : (
          <>
            <Card className="p-6 sm:p-8">
              <RegisterForm onRegistered={setRegisteredUser} />
            </Card>

            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </LayoutAutenticacion>
  );
}
