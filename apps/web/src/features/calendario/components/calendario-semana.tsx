import { useState } from 'react';

import { textoEstadoAula } from '@/components/dominio/estado-aula';
import { varianteEstadoAula, type EstadoAula } from '@/components/dominio/estado-aula-variantes';
import { useEsMovil } from '@/hooks/use-es-movil';
import { cn } from '@/lib/utils';

import { estadoEnCalendario } from '../lib/estado';
import { agruparPorDia, aClaveDia, diasDeSemana, minutoDelDia, rangoDeHoras } from '../lib/semana';
import {
  BloqueCalendario,
  TarjetaClaseDia,
  type AulaEnCalendario,
  type Rol,
} from './evento-calendario';

/** Alto de una hora en la rejilla, en rem: escala con el tamaño de texto elegido. */
const HORA_REM = 5.5;
const aRem = (minutos: number) => `${(minutos / 60) * HORA_REM}rem`;

const diaLargo = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
const diaCorto = new Intl.DateTimeFormat('es', { weekday: 'short' });
const formatoHora = new Intl.DateTimeFormat('es', { hour: 'numeric', hour12: true });

const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);
const abreviatura = (fecha: Date) => mayuscula(diaCorto.format(fecha).replace('.', ''));
const etiquetaHora = (hora: number) => formatoHora.format(new Date(2000, 0, 1, hora));

type Props = { lunes: string; items: AulaEnCalendario[]; rol: Rol; ahora?: Date };

/**
 * La semana de lunes a domingo. En escritorio, rejilla horaria de 7 columnas donde el alto
 * de cada clase es su duración; en móvil, tira de días y la agenda del día elegido.
 */
export function CalendarioSemana({ lunes, items, rol, ahora = new Date() }: Props) {
  const esMovil = useEsMovil();
  const porDia = agruparPorDia(items);
  const hoy = aClaveDia(ahora);
  const dias = diasDeSemana(lunes).map((fecha) => {
    const clave = aClaveDia(fecha);
    const clases = [...(porDia.get(clave) ?? [])].sort((a, b) =>
      a.scheduledAt.localeCompare(b.scheduledAt),
    );
    return { fecha, clave, esHoy: clave === hoy, esPasado: clave < hoy, clases };
  });

  if (esMovil) return <AgendaMovil dias={dias} rol={rol} ahora={ahora} />;

  const { desde, hasta } = rangoDeHoras(items);
  const altoRejilla = aRem((hasta - desde) * 60);
  const minutoAhora = minutoDelDia(ahora);
  const ahoraVisible = minutoAhora >= desde * 60 && minutoAhora < hasta * 60;
  const horas = Array.from({ length: hasta - desde }, (_, i) => desde + i);
  const estados = [...new Set(items.map((a) => estadoEnCalendario(a, ahora)))];

  return (
    <div className="space-y-4">
      <Leyenda estados={estados} />

      <div className="grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))] overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div aria-hidden="true">
          <div className="h-18 border-b border-border" />
          <div className="relative" style={{ height: altoRejilla }}>
            {horas.map((hora, i) => (
              <span
                key={hora}
                className="absolute right-2 text-xs text-muted-foreground tabular-nums"
                style={{ top: i === 0 ? '0.25rem' : `calc(${aRem(i * 60)} - 0.6rem)` }}
              >
                {etiquetaHora(hora)}
              </span>
            ))}
          </div>
        </div>

        {dias.map((d) => (
          <section
            key={d.clave}
            aria-labelledby={`dia-${d.clave}`}
            className={cn('min-w-0 border-l border-border', d.esHoy && 'bg-primary-soft')}
          >
            <h3
              id={`dia-${d.clave}`}
              className={cn(
                'flex h-18 flex-col justify-center border-b border-border px-3',
                d.esPasado ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              <span className="sr-only">
                {mayuscula(diaLargo.format(d.fecha))}
                {d.esHoy && ', hoy'}
              </span>
              <span
                aria-hidden="true"
                className={cn('text-xs font-medium', d.esHoy && 'text-primary-soft-foreground')}
              >
                {abreviatura(d.fecha)}
                {d.esHoy && ' · Hoy'}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  'text-xl font-semibold tabular-nums',
                  d.esHoy &&
                    '-ml-1 flex size-9 items-center justify-center rounded-full bg-primary text-lg text-primary-foreground',
                )}
              >
                {d.fecha.getDate()}
              </span>
            </h3>

            <div className="rejilla-horas relative" style={{ height: altoRejilla }}>
              {d.clases.length === 0 ? (
                <p className="sr-only">Sin clases</p>
              ) : (
                <ul>
                  {d.clases.map((aula) => {
                    const inicio = minutoDelDia(new Date(aula.scheduledAt)) - desde * 60;
                    const duracion = Math.min(aula.durationMinutes, (hasta - desde) * 60 - inicio);
                    return (
                      <li
                        key={aula.id}
                        className="absolute inset-x-1 p-px"
                        style={{ top: aRem(inicio), height: aRem(Math.max(duracion, 30)) }}
                      >
                        <BloqueCalendario aula={aula} ahora={ahora} />
                      </li>
                    );
                  })}
                </ul>
              )}
              {d.esHoy && ahoraVisible && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-attention"
                  style={{ top: aRem(minutoAhora - desde * 60) }}
                >
                  <span className="absolute -top-1 -left-1 size-2.5 rounded-full bg-attention" />
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Leyenda({ estados }: { estados: EstadoAula[] }) {
  return (
    <ul aria-label="Estados de esta semana" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {estados.map((estado) => {
        const Icono = varianteEstadoAula[estado].icon;
        return (
          <li key={estado} className="flex items-center gap-1.5 text-foreground">
            <Icono aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
            {textoEstadoAula(estado)}
          </li>
        );
      })}
      <li className="flex items-center gap-1.5 text-muted-foreground">
        <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-attention" />
        Hora actual
      </li>
    </ul>
  );
}

type Dia = {
  fecha: Date;
  clave: string;
  esHoy: boolean;
  esPasado: boolean;
  clases: AulaEnCalendario[];
};

function AgendaMovil({ dias, rol, ahora }: { dias: Dia[]; rol: Rol; ahora: Date }) {
  const inicial =
    dias.find((d) => d.esHoy && d.clases.length > 0) ?? dias.find((d) => d.clases.length > 0);
  const [elegido, setElegido] = useState(inicial?.clave ?? dias[0]!.clave);
  const dia = dias.find((d) => d.clave === elegido) ?? dias[0]!;
  const sustantivo = (n: number) =>
    rol === 'profesor' ? (n === 1 ? 'aula' : 'aulas') : n === 1 ? 'clase' : 'clases';

  return (
    <div className="space-y-5">
      <div
        role="group"
        aria-label="Días de la semana"
        className="grid grid-cols-7 gap-1 rounded-xl border border-border bg-card p-1.5"
      >
        {dias.map((d) => {
          const activo = d.clave === elegido;
          const n = d.clases.length;
          return (
            <button
              key={d.clave}
              type="button"
              aria-pressed={activo}
              aria-label={`${mayuscula(diaLargo.format(d.fecha))}${d.esHoy ? ', hoy' : ''}: ${
                n === 0 ? `sin ${sustantivo(2)}` : `${n} ${sustantivo(n)}`
              }`}
              onClick={() => setElegido(d.clave)}
              className={cn(
                'transicion-rapida flex min-h-16 min-w-0 flex-col items-center justify-center rounded-lg py-1',
                activo
                  ? 'bg-primary text-primary-foreground'
                  : d.esPasado
                    ? 'text-muted-foreground hover:bg-muted'
                    : 'text-foreground hover:bg-muted',
              )}
            >
              <span className="text-xs font-medium">{d.esHoy ? 'Hoy' : abreviatura(d.fecha)}</span>
              <span className="text-lg leading-tight font-semibold tabular-nums">
                {d.fecha.getDate()}
              </span>
              <span
                className={cn(
                  'min-h-4 text-xs leading-4 font-semibold tabular-nums',
                  !activo && 'text-primary',
                )}
              >
                {n > 0 ? n : ''}
              </span>
            </button>
          );
        })}
      </div>

      <section aria-labelledby="dia-elegido" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="dia-elegido" className="text-lg font-semibold text-foreground">
            {mayuscula(diaLargo.format(dia.fecha))}
          </h3>
          {dia.clases.length > 0 && (
            <span className="shrink-0 text-sm text-muted-foreground">
              {dia.clases.length} {sustantivo(dia.clases.length)}
            </span>
          )}
        </div>
        {dia.clases.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-muted-foreground">
            Sin {sustantivo(2)} este día.
          </p>
        ) : (
          <ul className="space-y-3">
            {dia.clases.map((aula) => (
              <li key={aula.id}>
                <TarjetaClaseDia aula={aula} ahora={ahora} rol={rol} />
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-muted-foreground">
          El número bajo cada día indica cuántas {sustantivo(2)} hay. Toca un día para verlas.
        </p>
      </section>
    </div>
  );
}
