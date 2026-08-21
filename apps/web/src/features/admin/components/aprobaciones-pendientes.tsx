import type { User } from '@academia/types';
import { LoaderCircle, RotateCw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card } from '@/components/ui/card';
import { ApiClientError } from '@/lib/api-error';
import { usePendingTeachers } from '../hooks/use-pending-teachers';
import { useResolveTeacher } from '../hooks/use-resolve-teacher';
import type { TeacherResolution } from '../lib/teacher-resolution';
import { PendingTeachersTable } from './pending-teachers-table';

/**
 * Aprobación de profesores (HU-104).
 *
 * Es la operación que desbloquea el Sprint 2: sin ella no hay ningún profesor
 * `ACTIVE` que pueda crear un aula.
 *
 * **Vivía en `/admin` y ahora es el contenido principal de `/panel`** (HU-209,
 * D19 de `ARQUITECTURA.md` §4.8). El cambio es de ubicación, no de conducta: la
 * lógica de resolución, los códigos de error y el anuncio por región viva son
 * exactamente los de HU-104. Si algo de esto se comporta distinto que antes, es
 * un fallo, no una mejora.
 *
 * Los cuatro estados que exige la guía de UI están todos aquí: `cargando`,
 * `vacío` —el caso normal en una academia sana, no un error—, `error` de
 * lectura y `éxito`. El resultado de cada acción se anuncia por región viva
 * desde `useResolveTeacher`, no desde aquí: el anuncio pertenece al momento en
 * que el servidor confirma, no al momento en que se pinta.
 *
 * Es una `<section>` con `<h2>`, no una página con `<h1>`: el único `<h1>` de
 * `/panel` es el saludo de `<PaginaCabecera>`.
 */
export function AprobacionesPendientes() {
  const { data: teachers, isPending, isError, error, refetch, isRefetching } = usePendingTeachers();
  const resolve = useResolveTeacher();

  // Qué fila está esperando respuesta. Se guarda el id y no un booleano para
  // que solo se bloqueen los botones de esa fila: con doce solicitudes en
  // pantalla, congelar la tabla entera por una es castigar al administrador.
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  /**
   * Devuelve una promesa que **siempre se resuelve**, nunca rechaza: es la
   * señal con la que el diálogo sabe que puede cerrarse. Un rechazo aquí lo
   * dejaría abierto tapando el aviso de error que se pinta abajo.
   *
   * El fallo no se pierde: `resolve.isError` lo recoge y lo explica en la
   * pantalla, que es donde se puede leer.
   */
  function resolver(teacher: User, resolution: TeacherResolution): Promise<void> {
    setResolvingId(teacher.id);

    return resolve
      .mutateAsync({ teacherId: teacher.id, resolution })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => setResolvingId(null));
  }

  return (
    <section aria-labelledby="panel-aprobaciones" className="space-y-4">
      <div className="space-y-2">
        <h2
          id="panel-aprobaciones"
          className="flex items-center gap-2 text-xl font-medium text-foreground"
        >
          <ShieldCheck aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
          Profesores pendientes
        </h2>
        <p className="max-w-[65ch] text-base text-muted-foreground">
          Revisa quién pidió una cuenta de profesor. Hasta que apruebes su cuenta no puede entrar a
          la plataforma.
        </p>
      </div>

      {/* Estado 1 — cargando. Con texto, nunca un spinner mudo. */}
      {isPending && (
        <Card className="p-6">
          <p role="status" className="flex items-center gap-3 text-base text-muted-foreground">
            <LoaderCircle
              aria-hidden="true"
              strokeWidth={2}
              className="size-5 shrink-0 animate-spin"
            />
            Cargando los profesores pendientes…
          </p>
        </Card>
      )}

      {/* Estado 2 — error de lectura. Explica y ofrece la salida. */}
      {isError && (
        <Callout variant="destructive" live="assertive" title="No pudimos cargar la lista">
          <div className="space-y-4">
            <p>
              {error instanceof Error && error.message
                ? error.message
                : 'Revisa tu conexión e inténtalo otra vez.'}
            </p>
            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="h-11 gap-2 px-5 text-base"
            >
              {isRefetching ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    strokeWidth={2}
                    className="size-5 animate-spin"
                  />
                  Cargando los profesores pendientes…
                </>
              ) : (
                <>
                  <RotateCw aria-hidden="true" strokeWidth={2} className="size-5" />
                  Volver a cargar
                </>
              )}
            </Button>
          </div>
        </Callout>
      )}

      {/*
        Error de la ACCIÓN, distinto del error de lectura de arriba.
        `INVALID_STATUS_TRANSITION` no es un fallo del administrador: significa
        que otro llegó antes, y lo único que hay que hacer es recargar. Por eso
        se explica en vez de disculparse, y por eso el mensaje del servidor
        —que ya dice justo eso— se muestra tal cual.
      */}
      {resolve.isError && (
        <Callout variant="destructive" live="assertive" title="No pudimos guardar tu decisión">
          <div className="space-y-4">
            <p>
              {resolve.error instanceof ApiClientError && resolve.error.message
                ? resolve.error.message
                : 'Revisa tu conexión e inténtalo otra vez.'}
            </p>
            <Button
              variant="outline"
              onClick={() => void refetch()}
              className="h-11 gap-2 px-5 text-base"
            >
              <RotateCw aria-hidden="true" strokeWidth={2} className="size-5" />
              Volver a cargar la lista
            </Button>
          </div>
        </Callout>
      )}

      {/* Estado 3 — vacío. Es el estado SANO de esta operación: no hay nadie
          bloqueado esperando. Por eso el texto no lamenta nada ni ofrece una
          acción de salida: no falta nada que hacer. */}
      {teachers?.length === 0 && (
        <EstadoVacio
          titular="No hay profesores esperando aprobación."
          ayuda="Cuando alguien cree una cuenta de profesor, aparecerá aquí para que apruebes o rechaces su solicitud."
        />
      )}

      {/* Estado 4 — éxito: hay cola que resolver. */}
      {teachers && teachers.length > 0 && (
        <PendingTeachersTable teachers={teachers} resolvingId={resolvingId} onResolve={resolver} />
      )}
    </section>
  );
}
