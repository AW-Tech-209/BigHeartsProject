import type { ListClassroomsQuery } from '@academia/types';
import { CommunicationPreference, EnglishLevel } from '@academia/types';
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
  ofreceSoloMisClases = false,
}: {
  inicial?: ListClassroomsQuery;
  onChange: (query: ListClassroomsQuery) => void;
  ofreceSoloMisClases?: boolean;
}) {
  const [value, setValue] = useState(inicial);

  return (
    <FiltrosAulas
      value={value}
      ofreceSoloMisClases={ofreceSoloMisClases}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

function montar(inicial: ListClassroomsQuery = {}, ofreceSoloMisClases = false) {
  const onChange = vi.fn();
  const resultado = renderConProviders(
    <Arnes inicial={inicial} onChange={onChange} ofreceSoloMisClases={ofreceSoloMisClases} />,
  );
  return { ...resultado, onChange };
}

describe('<FiltrosAulas /> — controles y teclado (B4)', () => {
  it('los cuatro controles se llegan con Tab, en orden', async () => {
    const { user } = montar();

    await user.tab();
    expect(screen.getByLabelText('Nivel')).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText('Modo de comunicación')).toHaveFocus();
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

  // AC5, AC9: el filtro de modo existe, no viene puesto y se combina con los demás.
  it('"Todos los modos" es el valor inicial: AC5, no se filtra por defecto', () => {
    montar();

    expect(screen.getByLabelText('Modo de comunicación')).toHaveValue('');
  });

  it('elegir un modo avisa con el modo elegido', async () => {
    const { user, onChange } = montar();

    await user.selectOptions(
      screen.getByLabelText('Modo de comunicación'),
      CommunicationPreference.SIGN_LANGUAGE,
    );

    expect(onChange).toHaveBeenCalledWith({
      communicationMode: CommunicationPreference.SIGN_LANGUAGE,
    });
  });

  it('volver a "Todos los modos" limpia el filtro', async () => {
    const { user, onChange } = montar({ communicationMode: CommunicationPreference.LIP_READING });

    await user.selectOptions(screen.getByLabelText('Modo de comunicación'), 'Todos los modos');

    expect(onChange).toHaveBeenCalledWith({ communicationMode: undefined });
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

/**
 * HU-208, T4/AC5. La casilla del profesor. Quién es profesor lo decide la
 * página; aquí solo se comprueba que la prop la enciende y la apaga, y que
 * apagarla **quita** la clave en vez de mandarla en `false`.
 */
describe('<FiltrosAulas /> — «Solo mis clases» (T4, AC5)', () => {
  it('no se pinta si no se ofrece: ausente, no deshabilitada', () => {
    montar();

    expect(screen.queryByLabelText('Solo mis clases')).not.toBeInTheDocument();
  });

  it('se pinta cuando se ofrece, y arranca desmarcada', () => {
    montar({}, true);

    expect(screen.getByLabelText('Solo mis clases')).not.toBeChecked();
  });

  it('refleja el valor que llega en el query (AC6)', () => {
    montar({ mias: true }, true);

    expect(screen.getByLabelText('Solo mis clases')).toBeChecked();
  });

  it('marcarla avisa con `mias: true`', async () => {
    const { user, onChange } = montar({}, true);

    await user.click(screen.getByLabelText('Solo mis clases'));

    expect(onChange).toHaveBeenCalledWith({ mias: true });
  });

  /**
   * `undefined` y **no `false`**, igual que «Todos los niveles» limpia `level`.
   * Es lo que hace que `buildSearchParams()` lo omita y el enlace que el
   * profesor comparte no arrastre un `mias=false` que no significa nada — ese
   * lado del contrato lo verifica `filtros-url.spec.ts`.
   */
  it('desmarcarla apaga el filtro con undefined, no con false', async () => {
    const { user, onChange } = montar({ mias: true }, true);

    await user.click(screen.getByLabelText('Solo mis clases'));

    expect(onChange).toHaveBeenCalledWith({ mias: undefined });
  });

  it('se alcanza con el teclado, después de los otros cuatro controles', async () => {
    const { user } = montar({}, true);

    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();

    expect(screen.getByLabelText('Solo mis clases')).toHaveFocus();
  });

  it('cambiarla también quita la página del query', async () => {
    const { user, onChange } = montar({ page: 3 }, true);

    await user.click(screen.getByLabelText('Solo mis clases'));

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

  // AC8: con la casilla del profesor puesta, que es un control más en la fila.
  it.each(TEMAS)('con «Solo mis clases», sin violaciones en el tema %s', async (tema) => {
    const { container } = renderConProviders(
      <FiltrosAulas value={{}} onChange={vi.fn()} ofreceSoloMisClases />,
      { tema },
    );

    await esperarSinFallosDeAccesibilidad(container);
  });
});
