import { type EnglishLevel, type ListClassroomsQuery } from '@academia/types';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { nivelesDeIngles } from '../lib/niveles';

type FiltrosAulasProps = {
  value: ListClassroomsQuery;
  onChange: (query: ListClassroomsQuery) => void;
};

/**
 * Filtros de nivel y rango de fechas (B4). Controles nativos (`<select>`,
 * `<input type="date">`): son los que se recorren con teclado sin construir
 * nada propio, y ya vienen anunciados por el lector de pantalla.
 *
 * Persistentes en la pantalla, nunca dentro de un desplegable
 * (`layout-y-composicion.md`). Al cambiar cualquier filtro, quita `page` del
 * query: la página 3 de un resultado que acaba de reducirse no tiene sentido.
 */
export function FiltrosAulas({ value, onChange }: FiltrosAulasProps) {
  function actualizar(cambio: Partial<Pick<ListClassroomsQuery, 'level' | 'desde' | 'hasta'>>) {
    const { page: _page, ...resto } = value;
    onChange({ ...resto, ...cambio });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-border pb-6">
      <Field id="filtro-nivel" label="Nivel" className="w-56">
        <NativeSelect
          value={value.level ?? ''}
          onChange={(event) =>
            actualizar({ level: (event.target.value || undefined) as EnglishLevel | undefined })
          }
        >
          <option value="">Todos los niveles</option>
          {Object.entries(nivelesDeIngles).map(([nivel, { nombre }]) => (
            <option key={nivel} value={nivel}>
              {nombre}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field id="filtro-desde" label="Desde">
        <Input
          type="date"
          value={value.desde ?? ''}
          onChange={(event) => actualizar({ desde: event.target.value || undefined })}
        />
      </Field>

      <Field id="filtro-hasta" label="Hasta">
        <Input
          type="date"
          value={value.hasta ?? ''}
          onChange={(event) => actualizar({ hasta: event.target.value || undefined })}
        />
      </Field>
    </div>
  );
}
