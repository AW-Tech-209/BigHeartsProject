import { type MetricasValoraciones, ProblemaClase } from '@academia/types';

import { TEXTO_PROBLEMA } from '@/features/valoracion/lib/opciones';

export function Valoraciones({ datos }: { datos: MetricasValoraciones }) {
  const problemas = Object.values(ProblemaClase)
    .map((p) => ({ p, n: datos.problemas[p] ?? 0 }))
    .filter(({ n }) => n > 0)
    .sort((a, b) => b.n - a.n);

  return (
    <section aria-labelledby="metricas-valoraciones" className="space-y-4">
      <h2 id="metricas-valoraciones" className="text-xl font-medium text-foreground">
        ¿Pudieron seguir la clase?
      </h2>

      {datos.respuestas === 0 ? (
        <p className="text-muted-foreground">Todavía no hay valoraciones en este rango.</p>
      ) : (
        <>
          <p className="text-foreground">
            {datos.respuestas} {datos.respuestas === 1 ? 'respuesta' : 'respuestas'}: {datos.si} Sí
            · {datos.aMedias} A medias · {datos.no} No
          </p>

          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Problemas más citados</h3>
            {problemas.length === 0 ? (
              <p className="text-muted-foreground">Nadie señaló problemas.</p>
            ) : (
              <ul className="space-y-1">
                {problemas.map(({ p, n }) => (
                  <li key={p} className="tabular-nums">
                    {TEXTO_PROBLEMA[p]}: {n} {n === 1 ? 'vez' : 'veces'}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {datos.comentarios.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">Comentarios</h3>
              <ul className="space-y-3">
                {datos.comentarios.map((c, i) => (
                  <li key={i} className="rounded-xl border border-border bg-card p-4">
                    <p className="max-w-[65ch] text-foreground">{c.comentario}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.claseTitulo} · {c.claseFecha}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
