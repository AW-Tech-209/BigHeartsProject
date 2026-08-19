import type { User } from '@academia/types';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Card } from '@/components/ui/card';
import { RegisterForm } from '@/features/auth/components/register-form';
import {
  RegistrationResult,
  tituloDeRegistro,
} from '@/features/auth/components/registration-result';

export function RegisterPage() {
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);

  return (
    // Sin navegación: todavía no hay sesión, así que no hay destinos que ofrecer.
    <AppShell conNavegacion={false}>
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
    </AppShell>
  );
}
