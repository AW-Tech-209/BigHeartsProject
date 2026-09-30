import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { ResumenValoracion } from './resumen-valoracion';
import { SeccionValoracionAula } from './seccion-valoracion-aula';

const valoracion = {
  respuestas: 3,
  si: 2,
  aMedias: 1,
  no: 0,
  problemas: { INTERPRETE: 0, SUBTITULOS: 1, CONEXION: 0, RITMO: 0, OTRO: 0 },
  comentarios: ['Muy claro', 'Más despacio, por favor'],
};

describe('comentarios para el profesor dueño', () => {
  it('el historial los ofrece en un desplegable con citas', async () => {
    const { user } = renderConProviders(<ResumenValoracion valoracion={valoracion} />);

    await user.click(screen.getByText('Lo que escribieron tus estudiantes (2)'));

    expect(screen.getByText('Muy claro').tagName).toBe('BLOCKQUOTE');
    expect(screen.getByText('Más despacio, por favor')).toBeVisible();
  });

  it('sin comentarios no hay desplegable', () => {
    renderConProviders(<ResumenValoracion valoracion={{ ...valoracion, comentarios: [] }} />);

    expect(screen.queryByText(/Lo que escribieron/)).not.toBeInTheDocument();
  });

  it('el detalle muestra conteos, problemas y comentarios; sin fallos de accesibilidad', async () => {
    const { container } = renderConProviders(<SeccionValoracionAula valoracion={valoracion} />);

    expect(screen.getByRole('heading', { name: 'Cómo la vivieron tus estudiantes' })).toBeVisible();
    expect(screen.getByText('3 respuestas · 2 sí · 1 a medias')).toBeVisible();
    expect(screen.getByText('Muy claro')).toBeVisible();
    await esperarSinFallosDeAccesibilidad(container);
  });

  it('con null dice cuántas respuestas faltan', () => {
    renderConProviders(<SeccionValoracionAula valoracion={null} />);

    expect(
      screen.getByText('Aún no hay suficientes respuestas para mostrar (mínimo 3).'),
    ).toBeVisible();
  });
});
