import { CircleCheck, Clock } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { LayoutAutenticacion } from '@/components/layout/layout-autenticacion';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Callout } from '@/components/ui/callout';
import { Card } from '@/components/ui/card';
import { LoginForm } from '@/features/auth/components/login-form';
import { useAuthStore } from '@/stores/auth-store';

/** Estado que deja `RequireAuth` al expulsar de una ruta privada. */
type LoginLocationState = { from?: string };

export function LoginPage() {
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
    <LayoutAutenticacion>
      <div className="mx-auto w-full max-w-lg space-y-8">
        <PaginaCabecera
          titulo="Inicia sesión"
          tituloDocumento="Iniciar sesión"
          contexto="Entra con tu email y tu contraseña para ver tus clases de BigHearts."
        />

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
    </LayoutAutenticacion>
  );
}
