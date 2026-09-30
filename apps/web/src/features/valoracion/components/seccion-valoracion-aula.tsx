import { VALORACION_MINIMO_RESPUESTAS, type ValoracionAgregada } from '@academia/types';
import { MessageSquareHeart } from 'lucide-react';

import { TEXTO_PROBLEMA } from '../lib/opciones';
import { describirRespuestas, problemasMasCitados } from '../lib/resumen';
import { CitasDeComentarios } from './comentarios-valoracion';

/**
 * «Cómo la vivieron tus estudiantes»: el detalle de una clase terminada para su
 * profesor dueño. El servidor manda `null` bajo el mínimo de respuestas.
 */
export function SeccionValoracionAula({ valoracion }: { valoracion: ValoracionAgregada | null }) {
  const citados = valoracion ? problemasMasCitados(valoracion.problemas) : [];

  return (
    <section
      aria-labelledby="aula-valoracion"
      className="rounded-xl border border-border bg-card p-6 shadow-xs sm:p-7"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-primary-soft p-2 text-primary">
            <MessageSquareHeart aria-hidden="true" strokeWidth={2} className="size-5" />
          </span>
          <h2 id="aula-valoracion" className="text-xl font-medium">
            Cómo la vivieron tus estudiantes
          </h2>
        </div>

        {!valoracion ? (
          <p className="text-base text-muted-foreground">
            Aún no hay suficientes respuestas para mostrar (mínimo {VALORACION_MINIMO_RESPUESTAS}).
          </p>
        ) : (
          <>
            <p className="text-base tabular-nums">{describirRespuestas(valoracion)}</p>
            {citados.length > 0 && (
              <p className="text-base">
                Lo más citado:{' '}
                {citados
                  .map(({ problema, veces }) => `${TEXTO_PROBLEMA[problema]} (${veces})`)
                  .join(', ')}
              </p>
            )}
            {valoracion.comentarios.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-medium">Lo que escribieron</h3>
                <CitasDeComentarios comentarios={valoracion.comentarios} />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
