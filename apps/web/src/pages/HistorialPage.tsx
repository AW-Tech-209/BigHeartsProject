import {
  type AulaImpartida,
  type ClassroomListItem,
  type HistorialQuery,
  UserRole,
} from '@academia/types';
import { LoaderCircle, RotateCw } from 'lucide-react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { TablaHistorialEstudiante } from '@/features/historial/components/tabla-historial-estudiante';
import { TablaHistorialProfesor } from '@/features/historial/components/tabla-historial-profesor';
import { useHistorial } from '@/features/historial/hooks/use-historial';
import { useAnnounce } from '@/hooks/use-announce';

/**
 * El historial de clases ya pasadas (HU-404, D34): lo que un estudiante
 * reservó y cómo acabó, o lo que un profesor impartió y con qué asistencia.
 *
 * Una sola pantalla y un solo endpoint: la forma de la respuesta cambia según
 * el rol de quien pregunta, nunca según un parámetro (§4.8).
 */
export function HistorialPage() {
  const { user } = useAuth();
  const esProfesor = user?.role === UserRole.TEACHER;
  const [searchParams, setSearchParams] = useSearchParams();
  const query: HistorialQuery = { page: paginaDe(searchParams) };
  const { data, isPending, isError, refetch, isRefetching } = useHistorial(query);
  const announce = useAnnounce();

  const hayLista = Boolean(data && data.items.length > 0);

  useEffect(() => {
    if (!data) return;

    if (data.total === 0) {
      announce(
        esProfesor ? 'Todavía no impartiste ninguna clase.' : 'Todavía no tienes clases pasadas.',
      );
      return;
    }

    announce(`Se encontraron ${data.total} clase${data.total === 1 ? '' : 's'}.`);
  }, [data, announce, esProfesor]);

  function irAPagina(pagina: number) {
    const params = new URLSearchParams();
    if (pagina !== 1) params.set('page', String(pagina));
    setSearchParams(params);
  }

  const paginaActual = query.page ?? 1;
  const totalPaginas = data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1;

  return (
    <AppShell>
      <PaginaCabecera
        titulo="Historial"
        contexto={
          esProfesor
            ? 'Las clases que impartiste, con cuántos se inscribieron y cuántos asistieron.'
            : 'Las clases que reservaste y ya pasaron, con su resultado.'
        }
      />

      {/* Estado 1 — cargando. Con texto, nunca un spinner mudo. */}
      {isPending && (
        <p role="status" className="flex items-center gap-3 py-12 text-base text-muted-foreground">
          <LoaderCircle
            aria-hidden="true"
            strokeWidth={2}
            className="size-5 shrink-0 animate-spin"
          />
          Cargando tu historial…
        </p>
      )}

      {/* Estado 2 — error de lectura. */}
      {isError && (
        <Callout variant="destructive" live="assertive" title="No pudimos cargar tu historial">
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
              {isRefetching ? 'Cargando tu historial…' : 'Volver a cargar'}
            </Button>
          </div>
        </Callout>
      )}

      {/* Estado 3 — vacío. */}
      {!isPending && !isError && data && data.items.length === 0 && (
        <EstadoVacio
          titular={
            esProfesor ? 'Todavía no impartiste ninguna clase' : 'Todavía no tienes clases pasadas'
          }
          ayuda={
            esProfesor
              ? 'Cuando termine tu primera clase, aparecerá aquí con su asistencia.'
              : 'Cuando termine tu primera clase reservada, aparecerá aquí con su resultado.'
          }
        />
      )}

      {/* Estado 4 — la lista. */}
      {!isPending && !isError && hayLista && data && (
        <>
          {esProfesor ? (
            <TablaHistorialProfesor items={data.items as AulaImpartida[]} total={data.total} />
          ) : (
            <TablaHistorialEstudiante
              items={data.items as ClassroomListItem[]}
              total={data.total}
            />
          )}

          {totalPaginas > 1 && (
            <nav
              aria-label="Paginación del historial"
              className="flex items-center justify-center gap-4"
            >
              <Button
                variant="outline"
                disabled={paginaActual <= 1}
                onClick={() => irAPagina(paginaActual - 1)}
              >
                Anterior
              </Button>
              <p className="text-sm text-muted-foreground">
                Página {paginaActual} de {totalPaginas}
              </p>
              <Button
                variant="outline"
                disabled={paginaActual >= totalPaginas}
                onClick={() => irAPagina(paginaActual + 1)}
              >
                Siguiente
              </Button>
            </nav>
          )}
        </>
      )}
    </AppShell>
  );
}

function paginaDe(searchParams: URLSearchParams): number | undefined {
  const valor = Number(searchParams.get('page'));
  return Number.isInteger(valor) && valor >= 1 ? valor : undefined;
}
