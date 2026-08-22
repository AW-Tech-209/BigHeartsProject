import { type ClassroomDetail, MeetingProvider } from '@academia/types';
import { LoaderCircle, RotateCw, ShieldAlert } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SeccionAccesibilidadAula,
  type ValoresAccesibilidadAula,
} from '@/features/aulas/components/seccion-accesibilidad-aula';
import { esAulaNoEncontrada, useClassroom } from '@/features/aulas/hooks/use-classroom';
import { useUpdateClassroomAccessibility } from '@/features/aulas/hooks/use-update-classroom-accessibility';
import {
  etiquetaPlataformaReunion,
  PLATAFORMAS_OFRECIDAS,
} from '@/features/aulas/lib/plataforma-reunion';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useAnnounce } from '@/hooks/use-announce';
import { ApiClientError } from '@/lib/api-error';

/**
 * Completa (o corrige) los 5 campos de accesibilidad de un aula ya creada
 * (HU-211, T4/T15). **No es la edición general del aula** — eso es HU-202,
 * pendiente—: aquí solo viven los campos que introdujo esta HU.
 *
 * Llega desde el enlace «Completar accesibilidad» de `<TarjetaAula
 * perspectiva="profesor">` cuando el aula está «sin indicar», pero también
 * sirve para CORREGIR una ya declarada — no exige que esté vacía.
 */
export function CompletarAccesibilidadPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data, isPending, isError, error, refetch, isRefetching } = useClassroom(id);

  const aula = data?.classroom;
  const noEncontrada = isError && esAulaNoEncontrada(error);
  const esDueno = Boolean(user && aula && user.id === aula.teacherId);

  const titulo = aula
    ? `Accesibilidad de "${aula.title}"`
    : isPending
      ? 'Cargando la clase…'
      : noEncontrada
        ? 'No encontramos esta clase'
        : 'No pudimos cargar esta clase';

  return (
    <AppShell>
      <PaginaCabecera
        titulo={titulo}
        contexto={
          aula
            ? 'Declara en qué modos se imparte, sus apoyos y la plataforma de la reunión.'
            : undefined
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
            <p>Solo el profesor dueño puede completar su accesibilidad.</p>
            <Button render={<Link to="/mis-aulas" />} className="h-11 px-5 text-base">
              Volver a Mis aulas
            </Button>
          </div>
        </Callout>
      )}

      {/*
        `key={aula.id}` fuerza a remontar si algún día se navega de una aula a
        otra sin desmontar la página (hoy no ocurre, la ruta siempre trae un
        `:id` fijo): así el `useState` perezoso de abajo vuelve a leer los
        valores del aula nueva en vez de arrastrar los del formulario anterior.
      */}
      {aula && esDueno && <FormularioAccesibilidad key={aula.id} aula={aula} />}
    </AppShell>
  );
}

type FormValues = ValoresAccesibilidadAula & { meetingProvider: MeetingProvider };

function valoresIniciales(aula: ClassroomDetail): FormValues {
  return {
    communicationModes: aula.communicationModes,
    hasInterpreter: aula.hasInterpreter,
    hasLiveCaptions: aula.hasLiveCaptions,
    hasVisualMaterials: aula.hasVisualMaterials,
    meetingProvider: aula.meetingProvider,
  };
}

/**
 * El formulario en sí, separado de la página que decide si mostrarlo.
 *
 * **Recibe `aula` ya resuelta y precarga su estado con un inicializador
 * perezoso de `useState`, no con un `useEffect`.** El aula solo puede llegar
 * aquí una vez que `esDueno` es verdadero, así que no hace falta sincronizar
 * nada con un sistema externo tras el montaje — es precisamente el caso que
 * la guía de React pide resolver sin efecto.
 */
function FormularioAccesibilidad({ aula }: { aula: ClassroomDetail }) {
  const navigate = useNavigate();
  const announce = useAnnounce();
  const mutation = useUpdateClassroomAccessibility(aula.id);

  const [values, setValues] = useState<FormValues>(() => valoresIniciales(aula));
  const [errorModos, setErrorModos] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (values.communicationModes.length === 0) {
      setErrorModos('Elige al menos un modo en que se imparte la clase.');
      document.getElementById('communicationModes')?.focus();
      announce('El formulario tiene un error. Revisa el campo marcado.');
      return;
    }
    setErrorModos(null);

    mutation.mutate(values, {
      onSuccess: () => {
        announce(`Accesibilidad actualizada: ${aula.title}.`);
        navigate('/mis-aulas');
      },
      onError: (err) => {
        const mensaje =
          err instanceof ApiClientError
            ? err.message
            : 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.';
        setFormError(mensaje || 'No pudimos guardar los cambios. Inténtalo otra vez.');
        announce('No pudimos guardar los cambios.');
      },
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {formError && (
        <Callout variant="destructive" live="assertive" title="No pudimos guardar los cambios">
          <p>{formError}</p>
        </Callout>
      )}

      <SeccionAccesibilidadAula
        values={values}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        error={errorModos ?? undefined}
      />

      <Field
        id="meetingProvider"
        label="Plataforma de la reunión"
        required
        description="Los subtítulos automáticos no funcionan igual en todas las plataformas: el estudiante lo necesita saber para prepararse."
      >
        <NativeSelect
          name="meetingProvider"
          value={values.meetingProvider}
          onChange={(event) =>
            setValues((prev) => ({
              ...prev,
              meetingProvider: event.target.value as MeetingProvider,
            }))
          }
        >
          {PLATAFORMAS_OFRECIDAS.map((plataforma) => (
            <option key={plataforma} value={plataforma}>
              {etiquetaPlataformaReunion[plataforma]}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Button type="submit" disabled={mutation.isPending} className="h-12 w-full gap-2 text-base">
        {mutation.isPending ? (
          <>
            <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
            Guardando…
          </>
        ) : (
          'Guardar accesibilidad'
        )}
      </Button>
    </form>
  );
}
