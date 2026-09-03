import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { MarcaBigHearts } from './marca-bighearts';

describe('MarcaBigHearts', () => {
  it('expone el nombre como texto, no solo como ícono', () => {
    renderConProviders(<MarcaBigHearts />);

    expect(screen.getByText('BigHearts')).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = renderConProviders(<MarcaBigHearts />);

    await esperarSinFallosDeAccesibilidad(container);
  });
});
