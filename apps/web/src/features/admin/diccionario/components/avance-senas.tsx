import type { AvanceModulo } from '@academia/types';

import { InsigniaTramo } from '@/features/diccionario/components/insignia-tramo';

/** Siempre «N de M», nunca porcentaje: la barra repite lo que dice el texto. */
export function AvanceSenas({ modulos }: { modulos: AvanceModulo[] }) {
  const conEntradas = modulos.filter((m) => m.palabras > 0);
  const vacios = modulos.filter((m) => m.palabras === 0).map((m) => m.numero);

  return (
    <section
      aria-labelledby="titulo-avance"
      className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6"
    >
      <div className="space-y-1">
        <h2 id="titulo-avance" className="text-xl font-semibold">
          Avance de señas
        </h2>
        <p className="text-base text-muted-foreground">
          Señas listas por módulo.
          {vacios.length > 0 &&
            ` ${vacios.length === 1 ? 'El módulo' : 'Los módulos'} ${rango(vacios)} todavía no ${vacios.length === 1 ? 'tiene' : 'tienen'} entradas.`}
        </p>
      </div>
      {conEntradas.length === 0 ? (
        <p className="text-base">Todavía no hay entradas en el diccionario.</p>
      ) : (
        <ul className="divide-y divide-border">
          {conEntradas.map((m) => {
            const texto = `${m.conSena} de ${m.palabras} con seña`;
            return (
              <li key={m.numero} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <InsigniaTramo tramo={m.tramo} texto={`Módulo ${m.numero}`} />
                <div
                  role="progressbar"
                  aria-label={`Módulo ${m.numero}`}
                  aria-valuemin={0}
                  aria-valuemax={m.palabras}
                  aria-valuenow={m.conSena}
                  aria-valuetext={texto}
                  className="h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${(m.conSena / m.palabras) * 100}%` }}
                  />
                </div>
                <p className="text-base">
                  <strong className="font-semibold">
                    {m.conSena} de {m.palabras}
                  </strong>{' '}
                  con seña
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function rango(numeros: number[]): string {
  const ordenados = [...numeros].sort((a, b) => a - b);
  const contiguos = ordenados.every((n, i) => i === 0 || n === (ordenados[i - 1] ?? n) + 1);
  if (ordenados.length > 2 && contiguos) return `${ordenados[0]} a ${ordenados.at(-1)}`;
  if (ordenados.length === 1) return String(ordenados[0]);
  return `${ordenados.slice(0, -1).join(', ')} y ${ordenados.at(-1)}`;
}
