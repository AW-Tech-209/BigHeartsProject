import { CircleCheck, Clock } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { SkipLink } from '@/components/skip-link';
import { Callout } from '@/components/ui/callout';
import { Card } from '@/components/ui/card';
import { LoginForm } from '@/features/auth/components/login-form';
import { usePageTitle } from '@/hooks/use-page-title';
import { useAuthStore } from '@/stores/auth-store';

/** Estado que deja `RequireAuth` al expulsar de una ruta privada. */
type LoginLocationState = { from?: string };

export function LoginPage() {
  const headingRef = usePageTitle('Iniciar sesión');
  const navigate = useNavigate();
  const location = useLocation();

  // Si el usuario llegó aquí porque intentó entrar a una ruta privada, tras
  // iniciar sesión lo devolvemos exactamente a donde iba, no a una home
  // genérica desde la que tendría que volver a buscar.
  const from = (location.state as LoginLocationState | null)?.from;

  // Llegar a un formulario de login sin saber por qué es desconcertante,
  // sobre todo si te expulsó de una página a media tarea. Aquí se dice.
  const endReason = useAuthStore((state) => state.endReason);

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <main id="contenido" className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-8">
          <header className="space-y-2">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-3xl font-semibold text-balance outline-none"
            >
              Inicia sesión
            </h1>
            <p className="max-w-[65ch] text-lg text-muted-foreground">
              Entra con tu email y tu contraseña para ver tus clases de BigHearts.
            </p>
          </header>

          {endReason === 'expired' && (
            <Callout variant="attention" icon={Clock} live="polite" title="Tu sesión terminó">
              {/* Redacción deliberadamente literal: `expired` cubre varias
                  causas (token caducado, revocado, cuenta suspendida). Afirmar
                  una concreta sería mentir en los otros casos. */}
              <p>Tu sesión ya no está activa. Inicia sesión otra vez para continuar.</p>
            </Callout>
          )}

          {endReason === 'logout' && (
            <Callout variant="success" icon={CircleCheck} live="polite" title="Cerraste tu sesión">
              <p>Tu sesión se cerró correctamente en este navegador.</p>
            </Callout>
          )}

          <Card className="p-6 sm:p-8">
            <LoginForm onLoggedIn={() => navigate(from ?? '/panel', { replace: true })} />
          </Card>

          <p className="text-sm text-muted-foreground">
            ¿Todavía no tienes cuenta?{' '}
            <Link
              to="/registro"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Crea tu cuenta
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
