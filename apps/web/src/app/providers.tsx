import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { LiveAnnouncerProvider } from '@/components/live-announcer';
import { useSessionBootstrap } from '@/features/auth/hooks/use-session-bootstrap';
import { queryClient } from '@/lib/query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LiveAnnouncerProvider>
        <SessionBootstrap>{children}</SessionBootstrap>
      </LiveAnnouncerProvider>
    </QueryClientProvider>
  );
}

/**
 * Lanza la rehidratación de la sesión al arrancar la app.
 *
 * No bloquea el render: las páginas públicas se pintan al instante y son los
 * guards (`RequireAuth`, `RedirectIfAuthenticated`) los que esperan al
 * resultado. Bloquear aquí dejaría toda la app en blanco cuando la API tarda
 * en despertar, que en el plan gratuito de Render es medio minuto largo.
 */
function SessionBootstrap({ children }: { children: ReactNode }) {
  useSessionBootstrap();
  return <>{children}</>;
}
