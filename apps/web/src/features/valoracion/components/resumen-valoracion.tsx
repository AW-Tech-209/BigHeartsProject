import type { ValoracionAgregada } from '@academia/types';

import { TEXTO_PROBLEMA } from '../lib/opciones';
import { describirRespuestas, problemasMasCitados } from '../lib/resumen';

/**
 * La valoración anónima de una clase para su profesor (HU-515, D47): conteos
 * en texto, sin gráficas. Bajo el mínimo de respuestas el servidor manda `null`.
 */
export function ResumenValoracion({ valoracion }: { valoracion: ValoracionAgregada | null }) {
  if (!valoracion) {
    return (
      <p className="text-sm text-muted-foreground">
        Aún no hay suficientes respuestas para mostrar.
      </p>
    );
  }

  const citados = problemasMasCitados(valoracion.problemas);

  return (
    <div className="space-y-0.5 text-sm text-muted-foreground">
      <p className="tabular-nums">{describirRespuestas(valoracion)}</p>
      {citados.length > 0 && (
        <p>
          Lo más citado:{' '}
          {citados
            .map(({ problema, veces }) => `${TEXTO_PROBLEMA[problema]} (${veces})`)
            .join(', ')}
        </p>
      )}
    </div>
  );
}
