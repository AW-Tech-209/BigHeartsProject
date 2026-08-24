import { ClassroomStatus, type Classroom } from '@academia/types';
import { RotateCw, ShieldAlert } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Skeleton } from '@/components/ui/skeleton';
import { FormularioAula } from '@/features/aulas/components/formulario-aula';
import { esAulaEditable } from '@/features/aulas/lib/editabilidad-aula';
import { esAulaNoEncontrada, useClassroom } from '@/features/aulas/hooks/use-classroom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useAnnounce } from '@/hooks/use-announce';

/**
 * Editar un aula propia (HU-202). Reutiliza `<FormularioAula>` en modo
 * edición: mismo componente que HU-201, precargado con los datos del aula.
 */
export function EditarAulaPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const announce = useAnnounce();

  const { data, isPending, isError, error, refetch, isRefetching } = useClassroom(id);

  const aula = data?.classroom;
  const noEncontrada = isError && esAulaNoEncontrada(error);
  const esDueno = Boolean(user && aula && user.id === aula.teacherId);

  const titulo = aula
    ? `Editar «${aula.title}»`
    : isPending
      ? 'Cargando la clase…'
      : noEncontrada
        ? 'No encontramos esta clase'
        : 'No pudimos cargar esta clase';

  function alGuardar(classroom: Classroom) {
    announce(`Cambios guardados: ${classroom.title}.`);
    navigate(`/aulas/${classroom.id}`);
  }

  return (
    <AppShell>
      <PaginaCabecera
        titulo={titulo}
        contexto={
          aula ? 'Corrige los datos de la clase. Los cambios se guardan al enviar.' : undefined
        }
      />

      {isPending && <Skeleton className="h-64" aria-hidden="true" />}

      {noEncontrada && (
        <Callout variant="destructive" title="Esta clase ya no está">
          <div className="space-y-4">
            <p>Puede que la dirección esté mal escrita o que el aula se haya eliminado.</p>
            <Button render={<Link to="/mis-aulas" />} className="h-11 px-5 text-base">
              Volver a Mis aulas
            </Button>
          </div>
        </Callout>
      )}

      {isError && !noEncontrada && (
        <Callout variant="destructive" live="assertive" title="No pudimos cargar esta clase">
          <div className="space-y-4">
            <p>Revisa tu conexión e inténtalo otra vez.</p>
            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="h-11 gap-2 px-5 text-base"
            >
              <RotateCw
                aria-hidden="true"
                strokeWidth={2}
                className={isRefetching ? 'size-5 animate-spin' : 'size-5'}
              />
              {isRefetching ? 'Cargando la clase…' : 'Volver a cargar'}
            </Button>
          </div>
        </Callout>
      )}

      {aula && !esDueno && (
        <Callout variant="destructive" icon={ShieldAlert} title="Esta aula no es tuya">
          <div className="space-y-4">
            <p>Solo el profesor dueño puede editarla.</p>
            <Button render={<Link to="/mis-aulas" />} className="h-11 px-5 text-base">
              Volver a Mis aulas
            </Button>
          </div>
        </Callout>
      )}

      {aula && esDueno && !esAulaEditable(aula) && (
        <Callout variant="attention" title="Esta clase ya no se puede editar">
          <div className="space-y-4">
            <p>
              {aula.status === ClassroomStatus.CANCELLED
                ? 'Esta clase está cancelada.'
                : 'Esta clase ya comenzó.'}
            </p>
            <Button render={<Link to={`/aulas/${aula.id}`} />} className="h-11 px-5 text-base">
              Ver la clase
            </Button>
          </div>
        </Callout>
      )}

      {/* `key={aula.id}` fuerza a remontar si se navega de una aula a otra sin
          desmontar la página: el `useState` perezoso del formulario vuelve a
          leer los valores de la aula nueva. */}
      {aula && esDueno && esAulaEditable(aula) && (
        <FormularioAula key={aula.id} aula={aula} onGuardada={alGuardar} />
      )}
    </AppShell>
  );
}
