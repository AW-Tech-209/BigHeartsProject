import { UserRole } from '@academia/types';
import { ArrowRight, BookOpen, CalendarCheck, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card } from '@/components/ui/card';
import { RoleGate } from '@/features/auth/components/role-gate';
import { useAuth } from '@/features/auth/hooks/use-auth';

/**
 * Primera pantalla privada de la plataforma.
 *
 * Su contenido definitivo (aulas, reservas, historial) llega en las HU
 * siguientes. Hoy cumple dos funciones reales: es el destino del login y
 * demuestra las dos mitades del guard — la ruta exige sesión, y cada bloque de
 * dentro exige un rol.
 */
export function PanelPage() {
  const { user } = useAuth();

  return (
    <AppShell>
      <PaginaCabecera
        titulo={`Hola, ${user?.firstName}`}
        tituloDocumento="Tu panel"
        contexto="Esta es tu página de inicio en BigHearts. Aquí verás tus clases cuando estén disponibles."
      />

      <Callout variant="info" title="Tu sesión se mantiene abierta">
        <p>
          No hace falta que vuelvas a escribir tu contraseña cada vez. Tu sesión sigue activa en
          este navegador durante 30 días y se renueva sola mientras la uses. Para salir, usa «Cerrar
          sesión» arriba.
        </p>
      </Callout>

      <RoleGate roles={[UserRole.STUDENT]}>
        <PanelSection
          icon={BookOpen}
          title="Tus clases"
          body="Todavía no hay aulas publicadas. Cuando las haya, podrás ver el cupo disponible y reservar tu lugar desde aquí."
        />
      </RoleGate>

      <RoleGate roles={[UserRole.TEACHER]}>
        <PanelSection
          icon={CalendarCheck}
          title="Tus aulas"
          body="Todavía no puedes crear aulas. Cuando la función esté lista, aquí gestionarás tus horarios, tu cupo y la lista de estudiantes."
        />
      </RoleGate>

      {/*
        La entrada a `/admin`. Esta tarjeta ya prometía la aprobación de
        profesores desde HU-206; con HU-104 la promesa existe, así que se
        cumple aquí en vez de añadir un cuarto destino a la barra: los destinos
        de ADMIN son tres (Aulas · Panel · Perfil) y el panel es el sitio
        natural del que cuelga el back-office.
      */}
      <RoleGate roles={[UserRole.ADMIN]}>
        <PanelSection
          icon={ShieldCheck}
          title="Administración"
          body="Revisa las cuentas de profesor que esperan tu aprobación. Hasta que las apruebes, esas personas no pueden entrar a la plataforma."
          accion={
            <Button render={<Link to="/admin" />} className="h-11 gap-2 px-5 text-base">
              Ver profesores pendientes
              <ArrowRight aria-hidden="true" strokeWidth={2} className="size-5" />
            </Button>
          }
        />
      </RoleGate>
    </AppShell>
  );
}

function PanelSection({
  icon: Icon,
  title,
  body,
  accion,
}: {
  icon: typeof BookOpen;
  title: string;
  body: string;
  /** La salida de la sección, si ya existe la pantalla a la que lleva. */
  accion?: ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-medium text-foreground">
          <Icon aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
          {title}
        </h2>
        <p className="max-w-[65ch] text-base text-muted-foreground">{body}</p>
        {accion}
      </section>
    </Card>
  );
}
