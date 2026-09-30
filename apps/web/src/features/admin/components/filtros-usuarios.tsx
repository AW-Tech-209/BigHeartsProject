import { type AdminUsuariosQuery, UserRole, UserStatus } from '@academia/types';
import { Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

type Props = {
  value: AdminUsuariosQuery;
  onChange: (query: AdminUsuariosQuery) => void;
};

/** Al cambiar cualquier filtro se descarta `page`. La búsqueda se aplica al enviar. */
export function FiltrosUsuarios({ value, onChange }: Props) {
  const [texto, setTexto] = useState(value.q ?? '');

  function actualizar(cambio: Partial<AdminUsuariosQuery>) {
    const { page: _page, ...resto } = value;
    onChange({ ...resto, ...cambio });
  }

  function buscar(event: FormEvent) {
    event.preventDefault();
    actualizar({ q: texto.trim() || undefined });
  }

  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-border pb-6">
      <form
        onSubmit={buscar}
        role="search"
        className="flex w-full flex-wrap items-end gap-3 sm:w-auto"
      >
        <Field id="filtro-usuarios-q" label="Buscar" className="w-full sm:w-72">
          <Input
            type="search"
            placeholder="Nombre o correo"
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
          />
        </Field>
        <Button type="submit" variant="outline" className="h-11 gap-2 px-4 text-base">
          <Search aria-hidden="true" strokeWidth={2} className="size-5" />
          Buscar
        </Button>
      </form>

      <Field id="filtro-usuarios-rol" label="Rol" className="w-full sm:w-48">
        <NativeSelect
          value={value.rol ?? ''}
          onChange={(event) => actualizar({ rol: (event.target.value || undefined) as UserRole })}
        >
          <option value="">Todos los roles</option>
          <option value={UserRole.STUDENT}>Estudiantes</option>
          <option value={UserRole.TEACHER}>Profesores</option>
          <option value={UserRole.ADMIN}>Administradores</option>
        </NativeSelect>
      </Field>

      <Field id="filtro-usuarios-estado" label="Estado" className="w-full sm:w-48">
        <NativeSelect
          value={value.estado ?? ''}
          onChange={(event) =>
            actualizar({ estado: (event.target.value || undefined) as UserStatus })
          }
        >
          <option value="">Todos los estados</option>
          <option value={UserStatus.ACTIVE}>Activa</option>
          <option value={UserStatus.PENDING}>Pendiente de aprobación</option>
          <option value={UserStatus.REJECTED}>Rechazada</option>
          <option value={UserStatus.SUSPENDED}>Suspendida</option>
        </NativeSelect>
      </Field>
    </div>
  );
}
