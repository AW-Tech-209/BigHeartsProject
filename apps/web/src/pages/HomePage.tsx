import { UserRole } from '@academia/types';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { httpClient } from '@/lib/http-client';

/** Forma del payload que devuelve `GET /health` en @academia/api. */
type HealthPayload = { status: 'ok'; uptime: number };

export function HomePage() {
  const { isAuthenticated, isChecking } = useAuth();
  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => httpClient.get<HealthPayload>('/health'),
    // Es un simple indicador de estado: mejor fallar rápido y dejar que el
    // usuario reintente a mano que reintentar en silencio de fondo.
    retry: false,
  });

  return (
    <AppShell>
      <PaginaCabecera
        titulo="Academia"
        contexto="Scaffold de @academia/web: Vite + React + TypeScript + Tailwind/shadcn."
      />

      {/* Mientras se rehidrata la sesión no sabemos aún qué ofrecer, así que no
          se pinta nada: enseñar "Iniciar sesión" y cambiarlo medio segundo
          después por "Ir a mi panel" es peor que esperar a saberlo. */}
      {!isChecking && (
        <div className="flex flex-wrap gap-3">
          {isAuthenticated ? (
            <Button render={<Link to="/panel" />} className="h-12 gap-2 px-6 text-base">
              <LayoutDashboard aria-hidden="true" strokeWidth={2} className="size-5" />
              Ir a mi panel
            </Button>
          ) : (
            <>
              <Button render={<Link to="/login" />} className="h-12 gap-2 px-6 text-base">
                <LogIn aria-hidden="true" strokeWidth={2} className="size-5" />
                Iniciar sesión
              </Button>
              <Button
                variant="outline"
                render={<Link to="/registro" />}
                className="h-12 gap-2 px-6 text-base"
              >
                <UserPlus aria-hidden="true" strokeWidth={2} className="size-5" />
                Crear una cuenta
              </Button>
            </>
          )}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-xl font-medium">Roles desde @academia/types</h2>
        <ul className="list-inside list-disc">
          {Object.values(UserRole).map((rol) => (
            <li key={rol}>{rol}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium">GET /health vía React Query + axios</h2>

        {health.isPending && <p className="text-muted-foreground">Cargando el estado de la API…</p>}

        {health.isError && (
          <div className="space-y-2 rounded-xl border border-destructive-border bg-destructive-soft p-4 text-destructive-soft-foreground">
            <p>No se pudo contactar con la API: {health.error.message}</p>
            <Button variant="outline" onClick={() => health.refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        {health.isSuccess && (
          <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4">
            {JSON.stringify(health.data, null, 2)}
          </pre>
        )}
      </section>
    </AppShell>
  );
}
