import { Eye, Hand } from 'lucide-react';
import { useState } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { CheckboxCardGroup, type CheckboxCardOption } from './checkbox-card-group';

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

type Opcion = 'senas' | 'labial';

const OPCIONES: CheckboxCardOption<Opcion>[] = [
  { value: 'senas', label: 'Lengua de señas', icon: Hand },
  { value: 'labial', label: 'Lectura labial', icon: Eye },
];

/** Arnés con estado real: el grupo es controlado, igual que en producción. */
function Arnes({ onChange }: { onChange: (value: Opcion[]) => void }) {
  const [value, setValue] = useState<Opcion[]>([]);

  return (
    <div>
      <p id="grupo-heading">Modos</p>
      <CheckboxCardGroup
        labelledBy="grupo-heading"
        options={OPCIONES}
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    </div>
  );
}

function montar() {
  const onChange = vi.fn();
  const utils = renderConProviders(<Arnes onChange={onChange} />);
  return { ...utils, onChange };
}

describe('<CheckboxCardGroup /> — selección múltiple (AC11)', () => {
  it('cada opción se alcanza y se marca solo con teclado', async () => {
    const { user, onChange } = montar();

    await user.tab();
    expect(screen.getByLabelText('Lengua de señas')).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(['senas']);

    await user.tab();
    expect(screen.getByLabelText('Lectura labial')).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(['senas', 'labial']);
  });

  it('marcar dos opciones las mantiene a las dos: es selección múltiple, no exclusiva', async () => {
    const { user } = montar();

    await user.click(screen.getByLabelText('Lengua de señas'));
    await user.click(screen.getByLabelText('Lectura labial'));

    expect(screen.getByLabelText('Lengua de señas')).toBeChecked();
    expect(screen.getByLabelText('Lectura labial')).toBeChecked();
  });

  it('volver a marcar una opción ya elegida la quita', async () => {
    const { user, onChange } = montar();

    await user.click(screen.getByLabelText('Lengua de señas'));
    await user.click(screen.getByLabelText('Lengua de señas'));

    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByLabelText('Lengua de señas')).not.toBeChecked();
  });

  it.each(TEMAS)('sin violaciones de accesibilidad en el tema %s', async (tema) => {
    const { container } = renderConProviders(<Arnes onChange={vi.fn()} />, { tema });

    await esperarSinFallosDeAccesibilidad(container);
  });
});
