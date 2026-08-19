import { UserRole } from '@academia/types';
import { BookOpen, CalendarCheck, ShieldCheck } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
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

      <RoleGate roles={[UserRole.ADMIN]}>
        <PanelSection
          icon={ShieldCheck}
          title="Administración"
          body="Aquí aprobarás las cuentas de profesor pendientes y gestionarás a los usuarios de la plataforma."
        />
      </RoleGate>
    </AppShell>
  );
}

function PanelSection({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof BookOpen;
  title: string;
  body: string;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-medium text-foreground">
          <Icon aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
          {title}
        </h2>
        <p className="max-w-[65ch] text-base text-muted-foreground">{body}</p>
      </section>
    </Card>
  );
}
