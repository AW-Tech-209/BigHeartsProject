import {
  CalendarCheck,
  ClipboardList,
  Download,
  LoaderCircle,
  RotateCw,
  Users,
  Percent,
} from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Desglose } from '@/features/metricas/components/desglose';
import { SelectorRango } from '@/features/metricas/components/selector-rango';
import { TablaFranjas } from '@/features/metricas/components/tabla-franjas';
import { Valoraciones } from '@/features/metricas/components/valoraciones';
import { useMetricas } from '@/features/metricas/hooks/use-metricas';
import { construirCsvs, descargarCsvs } from '@/features/metricas/lib/csv';
import {
  NIVELES_EN_ORDEN,
  porcentaje,
  textoModo,
  textoNivel,
} from '@/features/metricas/lib/formato';
import { leerRango, rangoAParams, rangoAQuery, type RangoUrl } from '@/features/metricas/lib/rango';
import { Numero, TarjetaResumen } from '@/features/panel/components/tarjeta-resumen';

export function MetricasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rango = leerRango(searchParams);
  const query = useMemo(() => rangoAQuery(rango), [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps -- `rango` sale de `searchParams`.
  const { data, isPending, isError, refetch, isRefetching } = useMetricas(query);

  function cambiarRango(siguiente: RangoUrl) {
    setSearchParams(rangoAParams(siguiente));
  }

  const r = data?.resumen;
  const vacio = r !== undefined && r.clasesPublicadas === 0 && r.clasesImpartidas === 0;

  return (
    <AppShell>
      <PaginaCabecera
        titulo="Métricas de la academia"
        contexto="Cómo van las clases, la asistencia y la ocupación en el rango que elijas."
      />

      <SelectorRango key={JSON.stringify(rango)} rango={rango} onChange={cambiarRango} />

      {isPending && (
        <p role="status" className="flex items-center gap-3 py-12 text-base text-muted-foreground">
          <LoaderCircle
            aria-hidden="true"
            strokeWidth={2}
            className="size-5 shrink-0 animate-spin"
          />
          Cargando las métricas…
        </p>
      )}

      {isError && (
        <Callout variant="destructive" live="assertive" title="No pudimos cargar las métricas">
          <div className="space-y-4">
            <p>Revisa tu conexión e inténtalo otra vez.</p>
            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="h-11 gap-2 px-5 text-base"
            >
              <RotateCw aria-hidden="true" strokeWidth={2} className="size-5" />
              {isRefetching ? 'Cargando las métricas…' : 'Volver a cargar'}
            </Button>
          </div>
        </Callout>
      )}

      {!isError && data && vacio && (
        <EstadoVacio
          titular="No hubo clases en este rango"
          ayuda="Prueba con un rango más amplio."
        />
      )}

      {!isError && data && r && !vacio && (
        <div className="space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground">
              Del {data.desde} al {data.hasta}
            </p>
            <Button
              variant="outline"
              onClick={() => descargarCsvs(construirCsvs(data))}
              className="h-11 gap-2 px-5"
            >
              <Download aria-hidden="true" strokeWidth={2} className="size-5" />
              Exportar CSV
            </Button>
          </div>

          <section aria-labelledby="metricas-resumen" className="space-y-4">
            <h2 id="metricas-resumen" className="text-xl font-medium text-foreground">
              Resumen
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TarjetaResumen titulo="Clases impartidas" icono={CalendarCheck}>
                <Numero contexto={`de ${r.clasesPublicadas} publicadas`}>
                  {r.clasesImpartidas}
                </Numero>
              </TarjetaResumen>
              <TarjetaResumen titulo="Ocupación" icono={Percent}>
                <Numero contexto="de los cupos ofrecidos">{porcentaje(r.ocupacion)}</Numero>
              </TarjetaResumen>
              <TarjetaResumen titulo="Asistencia" icono={ClipboardList}>
                <Numero contexto="de quienes reservaron">{porcentaje(r.asistencia)}</Numero>
              </TarjetaResumen>
              <TarjetaResumen titulo="Estudiantes activos" icono={Users}>
                <Numero contexto={`${r.estudiantesNuevos} nuevos`}>{r.estudiantesActivos}</Numero>
              </TarjetaResumen>
              <TarjetaResumen
                titulo="Clases sin asistencia marcada"
                icono={ClipboardList}
                tono={r.clasesSinAsistenciaMarcada > 0 ? 'attention' : 'success'}
                enlace={
                  r.clasesSinAsistenciaMarcada > 0
                    ? { texto: 'Ir a supervisión de aulas', a: '/admin/aulas' }
                    : undefined
                }
              >
                <Numero contexto={r.clasesSinAsistenciaMarcada > 0 ? 'por revisar' : 'todo al día'}>
                  {r.clasesSinAsistenciaMarcada}
                </Numero>
              </TarjetaResumen>
            </div>
          </section>

          <Desglose
            titulo="Por nivel"
            filas={NIVELES_EN_ORDEN.flatMap((n) => {
              const fila = data.porNivel.find((f) => f.nivel === n);
              return fila ? [{ clave: n, etiqueta: textoNivel(n), datos: fila }] : [];
            })}
          />
          <Desglose
            titulo="Por modo de instrucción"
            filas={data.porModo.map((f) => ({
              clave: f.modo ?? 'sin-declarar',
              etiqueta: textoModo(f.modo),
              datos: f,
            }))}
          />
          <Desglose
            titulo="Por profesor"
            filas={data.porProfesor.map((f) => ({
              clave: f.profesorId,
              etiqueta: f.nombre,
              datos: f,
            }))}
          />
          <TablaFranjas franjas={data.porFranja} />
          <Valoraciones datos={data.valoraciones} />
        </div>
      )}
    </AppShell>
  );
}
