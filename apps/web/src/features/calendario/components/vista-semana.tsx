import { BookingStatus } from '@academia/types';
import { ChevronLeft, ChevronRight, LoaderCircle, RotateCw } from 'lucide-react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { describirHorarioRenglon } from '@/features/aulas/lib/horario';
import { useAnnounce } from '@/hooks/use-announce';

import {
  aClaveDia,
  deClaveDia,
  describirSemana,
  leerSemana,
  lunesDe,
  rangoDeSemana,
  sumarDias,
  tituloSemana,
} from '../lib/semana';
import { CalendarioSemana } from './calendario-semana';
import type { AulaEnCalendario, Rol } from './evento-calendario';

type Consulta = {
  data?: { items: AulaEnCalendario[] };
  isPending: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => unknown;
};

type Props = {
  /** El hook de datos de la pantalla (`useMisReservas` o `useMisAulas`), pedido por rango. */
  useConsulta: (rango: { desde: string; hasta: string }) => Consulta;
  textoVacio: string;
  rol: Rol;
};

/** La vista «Semana»: navegación, anuncio del rango y calendario. La semana vive en la URL. */
export function VistaSemana({ useConsulta, textoVacio, rol }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const lunes = leerSemana(searchParams);
  const { data, isPending, isError, isRefetching, refetch } = useConsulta(rangoDeSemana(lunes));
  const announce = useAnnounce();
  const items = data?.items.filter((a) => a.myBookingStatus !== BookingStatus.CANCELLED);

  const rango = describirSemana(lunes);
  const inicio = deClaveDia(lunes);
  const zona = describirHorarioRenglon(inicio.toISOString()).zona;
  const total = items?.length;
  const sustantivo = rol === 'profesor' ? ['aula', 'aulas'] : ['clase', 'clases'];
  const conteo =
    total === undefined
      ? null
      : `${total} ${total === 1 ? sustantivo[0] : sustantivo[1]} esta semana`;

  useEffect(() => {
    if (total === undefined) return;
    const clases = total === 1 ? '1 clase' : `${total} clases`;
    announce(`Semana ${rango}: ${total === 0 ? 'sin clases' : clases}.`);
  }, [total, rango, announce]);

  function irA(destino: Date) {
    const params = new URLSearchParams(searchParams);
    params.set('vista', 'semana');
    params.set('semana', aClaveDia(destino));
    setSearchParams(params);
  }

  return (
    <section aria-labelledby="semana-titulo" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 id="semana-titulo" className="text-2xl font-semibold text-foreground">
            {tituloSemana(lunes)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {conteo && `${conteo} · `}Horas en {zona}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => irA(lunesDe(new Date()))} className="h-11 px-4">
            Esta semana
          </Button>
          <Button
            variant="outline"
            onClick={() => irA(sumarDias(inicio, -7))}
            aria-label="Semana anterior"
            className="size-11 p-0"
          >
            <ChevronLeft aria-hidden="true" strokeWidth={2} className="size-5" />
          </Button>
          <Button
            variant="outline"
            onClick={() => irA(sumarDias(inicio, 7))}
            aria-label="Semana siguiente"
            className="size-11 p-0"
          >
            <ChevronRight aria-hidden="true" strokeWidth={2} className="size-5" />
          </Button>
        </div>
      </div>

      {isPending && (
        <p role="status" className="flex items-center gap-3 py-12 text-base text-muted-foreground">
          <LoaderCircle
            aria-hidden="true"
            strokeWidth={2}
            className="size-5 shrink-0 animate-spin"
          />
          Cargando la semana…
        </p>
      )}

      {isError && (
        <Callout variant="destructive" live="assertive" title="No pudimos cargar la semana">
          <div className="space-y-4">
            <p>Revisa tu conexión e inténtalo otra vez.</p>
            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="h-11 gap-2 px-5 text-base"
            >
              <RotateCw aria-hidden="true" strokeWidth={2} className="size-5" />
              {isRefetching ? 'Cargando la semana…' : 'Volver a cargar'}
            </Button>
          </div>
        </Callout>
      )}

      {!isError && items && items.length === 0 && (
        <EstadoVacio titular={textoVacio} ayuda="Prueba con otra semana." />
      )}

      {!isError && items && items.length > 0 && (
        <CalendarioSemana lunes={lunes} items={items} rol={rol} />
      )}
    </section>
  );
}
