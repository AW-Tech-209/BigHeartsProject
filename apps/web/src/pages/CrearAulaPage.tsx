import type { Classroom } from '@academia/types';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Callout } from '@/components/ui/callout';
import { Skeleton } from '@/components/ui/skeleton';
import { FormularioAula } from '@/features/aulas/components/formulario-aula';
import { useClassroom } from '@/features/aulas/hooks/use-classroom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useAnnounce } from '@/hooks/use-announce';

const CONTEXTO_CREAR =
  'Publica una clase con su horario, su cupo y el enlace de la reunión que creaste en Zoom o Meet.';

/**
 * Crear un aula (HU-201). Solo profesores; el servidor lo vuelve a comprobar y
 * además exige que la cuenta esté `ACTIVE`.
 *
 * Con `?desde=<id>` es también la pantalla de duplicar (HU-213): precarga el
 * formulario con esa aula, salvo fecha y hora. Un `id` inexistente o de otro
 * profesor no bloquea crear (T5/AC7): cae al formulario vacío con un aviso.
 */
export function CrearAulaPage() {
  const navigate = useNavigate();
  const announce = useAnnounce();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const desde = searchParams.get('desde');

  const origen = useClassroom(desde ?? '', { enabled: Boolean(desde) });

  function alCrear(classroom: Classroom) {
    // B6. El anuncio va ANTES de navegar: al cambiar de ruta,
    // `<PaginaCabecera>` mueve el foco al `<h1>` de la pantalla siguiente, y un
    // mensaje puesto después competiría con ese anuncio. Así el lector de
    // pantalla dice primero qué pasó y luego dónde está.
    announce(`Clase publicada: ${classroom.title}. Ya aparece en tus aulas.`);

    // El destino final es el detalle del aula (`/aulas/:id`), que crea HU-204.
    // Hasta entonces se vuelve a «Mis aulas», que existe y ya lista el trabajo
    // del profesor: mandarlo a una ruta que todavía cae en 404 sería peor que
    // el rodeo.
    navigate('/mis-aulas');
  }

  if (desde && origen.isPending) {
    return (
      <AppShell>
        <PaginaCabecera titulo="Cargando la clase…" />
        <Skeleton className="h-64" aria-hidden="true" />
      </AppShell>
    );
  }

  const aulaOrigen = desde ? origen.data?.classroom : undefined;
  const esOrigenValido = Boolean(aulaOrigen && user && user.id === aulaOrigen.teacherId);

  if (desde && aulaOrigen && esOrigenValido) {
    return (
      <AppShell>
        <PaginaCabecera
          titulo={`Duplicar «${aulaOrigen.title}»`}
          contexto="Revisa los datos, elige la fecha y la hora, y publica la clase."
        />
        <FormularioAula duplicarDesde={aulaOrigen} onGuardada={alCrear} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PaginaCabecera titulo="Crear una clase" contexto={CONTEXTO_CREAR} />

      {desde && (
        <Callout
          variant="info"
          live="polite"
          title="No encontramos esa clase para duplicarla"
          className="mb-6 max-w-2xl"
        >
          <p>
            Puede que ya no exista o que no sea tuya. Completa el formulario para crear una clase
            nueva.
          </p>
        </Callout>
      )}

      <FormularioAula onGuardada={alCrear} />
    </AppShell>
  );
}
