import { type AdminClassroomsQuery, ClassroomStatus } from '@academia/types';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useTeachers } from '../hooks/use-teachers';

type FiltrosSupervisionProps = {
  value: AdminClassroomsQuery;
  onChange: (query: AdminClassroomsQuery) => void;
};

/**
 * Filtros de la supervisión (T10): profesor, estado y rango de fechas,
 * combinables (AC5). Controles nativos, persistentes en la pantalla, nunca
 * dentro de un desplegable (`layout-y-composicion.md`).
 *
 * Al cambiar cualquier filtro se quita `page` del query: la página 3 de un
 * resultado que acaba de reducirse no tiene sentido.
 */
export function FiltrosSupervision({ value, onChange }: FiltrosSupervisionProps) {
  const { data: teachers } = useTeachers();

  function actualizar(
    cambio: Partial<Pick<AdminClassroomsQuery, 'teacherId' | 'status' | 'desde' | 'hasta'>>,
  ) {
    const { page: _page, ...resto } = value;
    onChange({ ...resto, ...cambio });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-border pb-6">
      <Field id="filtro-profesor" label="Profesor" className="w-56">
        <NativeSelect
          value={value.teacherId ?? ''}
          onChange={(event) => actualizar({ teacherId: event.target.value || undefined })}
        >
          <option value="">Todos los profesores</option>
          {teachers?.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.firstName} {teacher.lastName}
            </option>
          ))}
        </NativeSelect>
      </Field>

      {/*
        Solo las dos opciones que de verdad ocurren en Fase 1 (D15, D16): un
        aula nace `PUBLISHED` y no hay flujo de `DRAFT`; `COMPLETED` no tiene
        escritor. Ofrecer las cuatro daría dos opciones que nunca devuelven nada.
      */}
      <Field id="filtro-estado-aula" label="Estado" className="w-56">
        <NativeSelect
          value={value.status ?? ''}
          onChange={(event) =>
            actualizar({
              status: (event.target.value || undefined) as ClassroomStatus | undefined,
            })
          }
        >
          <option value="">Todos los estados</option>
          <option value={ClassroomStatus.PUBLISHED}>Publicada</option>
          <option value={ClassroomStatus.CANCELLED}>Cancelada</option>
        </NativeSelect>
      </Field>

      <Field id="filtro-supervision-desde" label="Desde">
        <Input
          type="date"
          value={value.desde ?? ''}
          onChange={(event) => actualizar({ desde: event.target.value || undefined })}
        />
      </Field>

      <Field id="filtro-supervision-hasta" label="Hasta">
        <Input
          type="date"
          value={value.hasta ?? ''}
          onChange={(event) => actualizar({ hasta: event.target.value || undefined })}
        />
      </Field>
    </div>
  );
}
