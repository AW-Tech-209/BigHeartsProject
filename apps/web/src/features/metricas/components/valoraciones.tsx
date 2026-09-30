import { type MetricasValoraciones, ProblemaClase } from '@academia/types';
import { Check, MessageSquare, Minus, X, type LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { TEXTO_PROBLEMA } from '@/features/valoracion/lib/opciones';
import { cn } from '@/lib/utils';

import { porcentaje } from '../lib/formato';

type Respuesta = {
  clave: 'si' | 'aMedias' | 'no';
  texto: string;
  Icono: LucideIcon;
  tarjeta: string;
  circulo: string;
  barra: string;
};

/** «A medias» va en neutro y no en ámbar: el ámbar significa tiempo, no «regular». */
const RESPUESTAS: Respuesta[] = [
  {
    clave: 'si',
    texto: 'Sí, la siguieron',
    Icono: Check,
    tarjeta: 'border-success-border bg-success-soft text-success-soft-foreground',
    circulo: 'bg-success text-success-foreground',
    barra: 'bg-success',
  },
  {
    clave: 'aMedias',
    texto: 'A medias',
    Icono: Minus,
    tarjeta: 'border-input bg-muted text-foreground',
    circulo: 'bg-muted-foreground text-background',
    barra: 'bg-muted-foreground',
  },
  {
    clave: 'no',
    texto: 'No pudieron',
    Icono: X,
    tarjeta: 'border-destructive-border bg-destructive-soft text-destructive-soft-foreground',
    circulo: 'bg-destructive text-destructive-foreground',
    barra: 'bg-destructive',
  },
];

const veces = (n: number) => (n === 1 ? '1 vez' : `${n} veces`);

export function Valoraciones({ datos }: { datos: MetricasValoraciones }) {
  const problemas = Object.values(ProblemaClase)
    .map((p) => ({ p, n: datos.problemas[p] ?? 0 }))
    .sort((a, b) => b.n - a.n);
  const maximo = Math.max(...problemas.map(({ n }) => n), 1);
  const hayProblemas = problemas.some(({ n }) => n > 0);

  return (
    <section aria-labelledby="metricas-valoraciones" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 id="metricas-valoraciones" className="text-xl font-medium text-foreground">
            ¿Pudieron seguir la clase?
          </h2>
          <p className="text-sm text-muted-foreground">
            Respuestas anónimas de los estudiantes al terminar cada clase.
          </p>
        </div>
        {datos.respuestas > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-foreground tabular-nums">
            <MessageSquare aria-hidden="true" strokeWidth={2} className="size-4" />
            {datos.respuestas} {datos.respuestas === 1 ? 'respuesta' : 'respuestas'}
          </span>
        )}
      </div>

      {datos.respuestas === 0 ? (
        <p className="text-muted-foreground">Todavía no hay valoraciones en este rango.</p>
      ) : (
        <Card className="space-y-6 p-5 sm:p-6">
          <div className="space-y-4">
            <div aria-hidden="true" className="flex h-3.5 gap-0.5 overflow-hidden rounded-full">
              {RESPUESTAS.filter(({ clave }) => datos[clave] > 0).map(({ clave, barra }) => (
                <div key={clave} className={barra} style={{ flexGrow: datos[clave] }} />
              ))}
            </div>

            <ul className="grid gap-3 sm:grid-cols-3">
              {RESPUESTAS.map(({ clave, texto, Icono, tarjeta, circulo }) => {
                const n = datos[clave];
                return (
                  <li
                    key={clave}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-4',
                      n > 0 ? tarjeta : 'border-dashed border-border bg-card text-muted-foreground',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-full',
                        n > 0 ? circulo : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icono strokeWidth={2.25} className="size-5" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">{texto}</span>
                      <span className="text-2xl font-semibold tabular-nums">
                        {n}{' '}
                        <span className="text-sm font-medium">
                          · {porcentaje(n / datos.respuestas)}
                        </span>
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid gap-8 border-t border-border pt-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-medium text-foreground">Problemas más citados</h3>
                <p className="text-sm text-muted-foreground">
                  {hayProblemas
                    ? 'Lo que señalaron quienes no pudieron seguirla del todo.'
                    : 'Nadie señaló problemas.'}
                </p>
              </div>
              {hayProblemas && (
                <ul className="space-y-3">
                  {problemas.map(({ p, n }) => (
                    <li
                      key={p}
                      className={cn(
                        'grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] items-center gap-3',
                        n === 0 ? 'text-muted-foreground' : 'text-foreground',
                      )}
                    >
                      <span className={cn(n > 0 && 'font-medium')}>{TEXTO_PROBLEMA[p]}</span>
                      <span
                        aria-hidden="true"
                        className="h-2.5 overflow-hidden rounded-full bg-muted"
                      >
                        <span
                          className="block h-full rounded-full bg-info"
                          style={{ width: `${(n / maximo) * 100}%` }}
                        />
                      </span>
                      <span className={cn('text-right tabular-nums', n > 0 && 'font-semibold')}>
                        {veces(n)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-medium text-foreground">Comentarios</h3>
                <p className="text-sm text-muted-foreground">
                  {datos.comentarios.length > 0
                    ? 'Anónimos, tal como los escribieron.'
                    : 'Nadie dejó comentarios en este rango.'}
                </p>
              </div>
              {datos.comentarios.length > 0 && (
                <ul className="space-y-3">
                  {datos.comentarios.map((c, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded-xl border border-border bg-background p-4"
                    >
                      <MessageSquare
                        aria-hidden="true"
                        strokeWidth={2}
                        className="mt-1 size-5 shrink-0 text-muted-foreground"
                      />
                      <div className="min-w-0 space-y-1">
                        <p className="max-w-[65ch] text-foreground">{c.comentario}</p>
                        <p className="text-sm text-muted-foreground">
                          {c.claseTitulo} · {c.claseFecha}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}
    </section>
  );
}
