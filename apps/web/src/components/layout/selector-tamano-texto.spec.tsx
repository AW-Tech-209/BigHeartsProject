import { screen } from '@testing-library/react';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderConProviders } from '@/test/render-con-providers';
import { SelectorTamanoTexto } from './selector-tamano-texto';

const html = document.documentElement;

describe('SelectorTamanoTexto', () => {
  beforeEach(() => {
    localStorage.clear();
    html.classList.remove('texto-grande', 'texto-muy-grande');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    html.classList.remove('texto-grande', 'texto-muy-grande');
  });

  it('elegir «Muy grande» aplica la clase a <html> y la persiste', async () => {
    const { user } = renderConProviders(<SelectorTamanoTexto />);

    await user.click(screen.getByRole('radio', { name: /Muy grande/ }));

    expect(html.classList.contains('texto-muy-grande')).toBe(true);
    expect(localStorage.getItem('bighearts:tamano-texto')).toBe('muy-grande');

    await user.click(screen.getByRole('radio', { name: /Normal/ }));
    expect(html.classList.contains('texto-muy-grande')).toBe(false);
  });

  it('con localStorage bloqueado funciona sin romper', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const { user } = renderConProviders(<SelectorTamanoTexto />);

    await user.click(screen.getByRole('radio', { name: /Grande/ }));
    expect(html.classList.contains('texto-grande')).toBe(true);
  });

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = renderConProviders(<SelectorTamanoTexto />);
    await esperarSinFallosDeAccesibilidad(container);
  });
});
