import type { ListClassroomsQuery } from '@academia/types';
import { EnglishLevel } from '@academia/types';
import { screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { FiltrosAulas } from './filtros-aulas';

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

/**
 * Arnés con estado real, igual que `AulasPage` (el query vive fuera, en la
 * URL; aquí en un `useState`). Sin él, un `input[type=date]` controlado con
 * un `value` fijo se resetea entre cada tecla en jsdom —mismo problema que
 * documenta `formulario-aula.spec.tsx`— y no se puede probar que el texto
 * tecleado se acumula.
 */
function Arnes({
  inicial = {},
  onChange,
}: {
  inicial?: ListClassroomsQuery;
  onChange: (query: ListClassroomsQuery) => void;
}) {
  const [value, setValue] = useState(inicial);

  return (
    <FiltrosAulas
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

function montar(inicial: ListClassroomsQuery = {}) {
  const onChange = vi.fn();
  const resultado = renderConProviders(<Arnes inicial={inicial} onChange={onChange} />);
  return { ...resultado, onChange };
}

describe('<FiltrosAulas /> — controles y teclado (B4)', () => {
  it('los tres controles se llegan con Tab, en orden', async () => {
    const { user } = montar();

    await user.tab();
    expect(screen.getByLabelText('Nivel')).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText('Desde')).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText('Hasta')).toHaveFocus();
  });

  it('elegir un nivel avisa con el nivel elegido', async () => {
    const { user, onChange } = montar();

    await user.selectOptions(screen.getByLabelText('Nivel'), EnglishLevel.ADVANCED);

    expect(onChange).toHaveBeenCalledWith({ level: EnglishLevel.ADVANCED });
  });

  it('volver a "Todos los niveles" limpia el filtro', async () => {
    const { user, onChange } = montar({ level: EnglishLevel.ADVANCED });

    await user.selectOptions(screen.getByLabelText('Nivel'), 'Todos los niveles');

    expect(onChange).toHaveBeenCalledWith({ level: undefined });
  });

  it('escribir una fecha "desde" avisa con el valor completo', async () => {
    const { user, onChange } = montar();

    await user.type(screen.getByLabelText('Desde'), '2026-09-01');

    expect(onChange).toHaveBeenLastCalledWith({ desde: '2026-09-01' });
  });

  it('cambiar un filtro quita la página del query: no tiene sentido seguir en la 3', async () => {
    const { user, onChange } = montar({ page: 3, level: EnglishLevel.BEGINNER });

    await user.selectOptions(screen.getByLabelText('Nivel'), EnglishLevel.ADVANCED);

    expect(onChange).toHaveBeenCalledWith({ level: EnglishLevel.ADVANCED });
    expect(onChange.mock.calls[0]?.[0]).not.toHaveProperty('page');
  });
});

describe('<FiltrosAulas /> — accesibilidad automática', () => {
  it.each(TEMAS)('sin violaciones en el tema %s', async (tema) => {
    const { container } = renderConProviders(<FiltrosAulas value={{}} onChange={vi.fn()} />, {
      tema,
    });

    await esperarSinFallosDeAccesibilidad(container);
  });
});
