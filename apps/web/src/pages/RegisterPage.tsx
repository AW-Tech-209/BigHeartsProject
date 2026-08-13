import type { User } from '@academia/types';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { SkipLink } from '@/components/skip-link';
import { Card } from '@/components/ui/card';
import { RegisterForm } from '@/features/auth/components/register-form';
import { RegistrationResult } from '@/features/auth/components/registration-result';

export function RegisterPage() {
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (registeredUser) return;
    // Cambio de ruta = silencioso en SPA: llevamos el foco al <h1> (§7.4).
    document.title = 'Crear cuenta · BigHearts';
    headingRef.current?.focus();
  }, [registeredUser]);

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <main id="contenido" className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        {registeredUser ? (
          <RegistrationResult user={registeredUser} />
        ) : (
          <div className="space-y-8">
            <header className="space-y-2">
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="text-3xl font-semibold text-balance outline-none"
              >
                Crea tu cuenta
              </h1>
              <p className="max-w-[65ch] text-lg text-muted-foreground">
                Regístrate para acceder a las clases de inglés de BigHearts, la academia pensada
                para personas hipoacúsicas y sordas.
              </p>
            </header>

            <Card className="p-6 sm:p-8">
              <RegisterForm onRegistered={setRegisteredUser} />
            </Card>

            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/" className="font-medium text-primary underline-offset-4 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
