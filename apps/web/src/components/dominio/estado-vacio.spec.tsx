import { screen } from '@testing-library/react';
import { Link } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { Button } from '@/components/ui/button';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { EstadoVacio } from './estado-vacio';

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

function vacioConSalida() {
  return (
    <EstadoVacio
      titular="Todavía no tienes clases reservadas"
      ayuda="Cuando reserves tu cupo en un aula, la verás aquí con su fecha y su enlace de acceso."
      accion={
        <Button render={<Link to="/aulas" />} className="h-12 px-6 text-base">
          Explorar las aulas
        </Button>
      }
    />
  );
}

describe('EstadoVacio', () => {
  it.each(TEMAS)('no tiene violaciones de accesibilidad en el tema %s', async (tema) => {
    const { container } = renderConProviders(vacioConSalida(), { tema });

    await esperarSinFallosDeAccesibilidad(container);
  });

  it('dice qué falta, por qué, y ofrece una salida con verbo', () => {
    renderConProviders(vacioConSalida());

    expect(screen.getByText('Todavía no tienes clases reservadas')).toBeInTheDocument();
    expect(screen.getByText(/Cuando reserves tu cupo/)).toBeInTheDocument();
    // La salida es un enlace real: funciona con clic central y con teclado.
    expect(screen.getByRole('link', { name: 'Explorar las aulas' })).toHaveAttribute(
      'href',
      '/aulas',
    );
  });

  it('la acción se alcanza con Tab', async () => {
    const { user } = renderConProviders(vacioConSalida());

    await user.tab();

    expect(screen.getByRole('link', { name: 'Explorar las aulas' })).toHaveFocus();
  });

  it('no introduce un encabezado que rompa la jerarquía de la página', () => {
    renderConProviders(vacioConSalida());

    // El titular es un `<p>` a propósito: este bloque se usa dentro de páginas
    // con jerarquías distintas, y un `<h2>` fijo desordenaría los encabezados
    // justo donde se anide.
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });

  it('la ilustración acompaña al texto, no lo sustituye', () => {
    renderConProviders(vacioConSalida());

    // Está en el árbol accesible como imagen con nombre…
    expect(screen.getByRole('img')).toHaveAccessibleName();
    // …pero todo lo que hace falta para actuar sigue estando en texto.
    expect(screen.getByText('Todavía no tienes clases reservadas')).toBeInTheDocument();
  });

  it('funciona sin acción, cuando de verdad no hay nada que hacer todavía', async () => {
    const { container } = renderConProviders(
      <EstadoVacio
        ilustracion="no-encontrado"
        titular="Todavía no hay aulas publicadas"
        ayuda="Cuando un profesor publique una clase, aparecerá aquí."
      />,
    );

    expect(screen.queryByRole('link')).toBeNull();
    await esperarSinFallosDeAccesibilidad(container);
  });
});
