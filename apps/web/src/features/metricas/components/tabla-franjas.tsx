import type { MetricasFranja } from '@academia/types';

import { cn } from '@/lib/utils';

import { DIAS_SEMANA, hora, porcentaje, textoClases } from '../lib/formato';

/** Un solo token (`info`) en cuatro escalones; el número escrito es la señal real. */
const ESCALON = ['', 'bg-info/10', 'bg-info/20', 'bg-info/30', 'bg-info/40'];

function escalon(clases: number, maximo: number): number {
  return maximo === 0 ? 0 : Math.ceil((clases / maximo) * 4);
}

export function TablaFranjas({ franjas }: { franjas: MetricasFranja[] }) {
  const horas = [...new Set(franjas.map((f) => f.hora))].sort((a, b) => a - b);
  const maximo = Math.max(0, ...franjas.map((f) => f.clases));
  const porCelda = new Map(franjas.map((f) => [`${f.diaSemana}-${f.hora}`, f]));

  return (
    <section aria-labelledby="metricas-franjas" className="space-y-4">
      <h2 id="metricas-franjas" className="text-xl font-medium text-foreground">
        Franjas: día y hora
      </h2>
      {franjas.length === 0 ? (
        <p className="text-muted-foreground">No hubo clases en este rango.</p>
      ) : (
        <div
          role="region"
          aria-label="Tabla de franjas por día y hora, se desplaza a los lados"
          tabIndex={0}
          className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-xs"
        >
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Clases y ocupación por día de la semana y hora de inicio
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground">
                  Día
                </th>
                {horas.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-3 text-left font-medium text-muted-foreground"
                  >
                    {hora(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIAS_SEMANA.map((dia, i) => (
                <tr key={dia} className="border-b border-border last:border-b-0">
                  <th scope="row" className="px-3 py-3 text-left font-medium text-foreground">
                    {dia}
                  </th>
                  {horas.map((h) => {
                    const franja = porCelda.get(`${i + 1}-${h}`);
                    return (
                      <td
                        key={h}
                        className={cn(
                          'min-w-28 px-3 py-3 align-top text-foreground',
                          franja && ESCALON[escalon(franja.clases, maximo)],
                        )}
                      >
                        {franja ? (
                          <>
                            <span className="block font-medium tabular-nums">
                              {textoClases(franja.clases)}
                            </span>
                            <span className="block tabular-nums">
                              Ocupación {porcentaje(franja.ocupacion)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">Sin clases</span>
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
