import { screen } from '@testing-library/react';
import { Mail } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { Input } from '@/components/ui/input';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { Field } from './field';

/**
 * PATRÓN A COPIAR — accesibilidad automatizada con axe.
 *
 * `<Field>` es el sitio donde vive el patrón accesible de todo formulario de la
 * app: label visible, `aria-invalid`, `aria-describedby`, error con
 * `role="alert"`. Si se rompe aquí, se rompe en todas las pantallas a la vez,
 * así que es el componente que más barato sale vigilar.
 *
 * Comprobación de que la red atrapa algo: quitar el `<Label>` de `field.tsx`
 * hace fallar el primer test de este bloque con la violación `label` de axe.
 */

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

function campoDeEmail(props: { error?: string; description?: string } = {}) {
  return (
    <Field id="email" label="Email" required {...props}>
      <Input type="email" name="email" />
    </Field>
  );
}

describe('Field — accesibilidad', () => {
  it.each(TEMAS)('no tiene violaciones de accesibilidad en el tema %s', async (tema) => {
    const { container } = renderConProviders(campoDeEmail(), { tema });

    await esperarSinFallosDeAccesibilidad(container);
  });

  it('sigue sin violaciones cuando el campo está en error', async () => {
    const { container } = renderConProviders(
      campoDeEmail({ error: 'El email no tiene un formato válido. Ejemplo: nombre@correo.com' }),
    );

    await esperarSinFallosDeAccesibilidad(container);
  });
});

describe('Field — contrato accesible', () => {
  it('asocia la etiqueta visible al control, y la marca de obligatorio es una palabra', () => {
    renderConProviders(campoDeEmail());

    // `getByLabelText` solo encuentra el input si el `<label htmlFor>` está
    // bien cableado: es la misma consulta que hace un lector de pantalla.
    const input = screen.getByLabelText('Email (obligatorio)');

    expect(input).toHaveAttribute('aria-required', 'true');
    // Un asterisco no lo lee nadie; la palabra sí.
    expect(screen.getByText('(obligatorio)')).toBeInTheDocument();
  });

  it('cablea el error al control con aria-invalid, aria-describedby y role="alert"', () => {
    const mensaje = 'El email es obligatorio.';
    renderConProviders(campoDeEmail({ error: mensaje }));

    const input = screen.getByLabelText('Email (obligatorio)');
    const error = screen.getByRole('alert');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(error).toHaveTextContent(mensaje);
    expect(input.getAttribute('aria-describedby')).toContain(error.id);
    // El error viaja en el nombre accesible del campo: quien navega con lector
    // se entera del fallo al llegar al input, sin tener que buscarlo.
    expect(input).toHaveAccessibleDescription(mensaje);
  });

  it('encadena descripción y error en aria-describedby, en ese orden', () => {
    renderConProviders(
      campoDeEmail({ description: 'Usa el email con el que te registraste.', error: 'No existe.' }),
    );

    const input = screen.getByLabelText('Email (obligatorio)');

    expect(input.getAttribute('aria-describedby')).toBe('email-description email-error');
  });

  it('con un ícono guía en el control mantiene la etiqueta asociada y axe limpio', async () => {
    const { container } = renderConProviders(
      <Field id="email" label="Email" required>
        <Input type="email" name="email" iconoInicio={Mail} />
      </Field>,
    );

    expect(screen.getByLabelText('Email (obligatorio)')).toHaveAttribute('type', 'email');
    await esperarSinFallosDeAccesibilidad(container);
  });
});
