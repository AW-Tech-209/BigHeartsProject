import { EstadoTemporalAula, type MisAulasQuery } from '@academia/types';

import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { estadoActivo } from '../lib/filtros-mis-aulas';

type FiltroEstadoAulasProps = {
  value: MisAulasQuery;
  onChange: (query: MisAulasQuery) => void;
};

/**
 * Las cuatro opciones, con el texto que lee el profesor.
 *
 * Sentence case y literal (`voz-microcopy.md`): «Ya impartidas» y no
 * «Históricas», que obliga a traducir una metáfora antes de poder filtrar.
 */
const OPCIONES: { valor: EstadoTemporalAula; etiqueta: string }[] = [
  { valor: EstadoTemporalAula.TODAS, etiqueta: 'Todas' },
  { valor: EstadoTemporalAula.PROXIMAS, etiqueta: 'Próximas' },
  { valor: EstadoTemporalAula.PASADAS, etiqueta: 'Ya impartidas' },
  { valor: EstadoTemporalAula.CANCELADAS, etiqueta: 'Canceladas' },
];

/**
 * Filtro por estado temporal de «Mis aulas» (B2).
 *
 * `<select>` nativo, igual que los filtros del catálogo: es el control que ya
 * se recorre con teclado y que el lector de pantalla anuncia sin que haya que
 * construir nada. Persistente en la pantalla, nunca dentro de un desplegable
 * que haya que abrir (`layout-y-composicion.md`).
 *
 * Al cambiar de filtro se quita `page` del query: la página 3 de un resultado
 * que acaba de cambiar de tamaño no significa nada.
 */
export function FiltroEstadoAulas({ value, onChange }: FiltroEstadoAulasProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-border pb-6">
      <Field id="filtro-estado" label="Estado" className="w-56">
        <NativeSelect
          value={estadoActivo(value)}
          onChange={(event) => {
            const { page: _page, ...resto } = value;
            onChange({ ...resto, estado: event.target.value as EstadoTemporalAula });
          }}
        >
          {OPCIONES.map(({ valor, etiqueta }) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </NativeSelect>
      </Field>
    </div>
  );
}
