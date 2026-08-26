import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { renderConProviders } from '@/test/render-con-providers';
import { SelectorTema } from './selector-tema';

/**
 * AC1-AC3 de HU-216: alternar el botón aplica `.dark` a `<html>` sin
 * recargar, la elección persiste en `localStorage` y se opera con teclado
 * con el cambio anunciado.
 */
describe('SelectorTema', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('AC1 — alternar el botón aplica y quita la clase `dark` de <html> de inmediato', async () => {
    const { user } = renderConProviders(<SelectorTema />);

    const boton = screen.getByRole('button', { name: 'Cambiar a tema oscuro' });
    await user.click(boton);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Cambiar a tema claro' }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('AC2 — la preferencia persiste entre sesiones', async () => {
    const { user, unmount } = renderConProviders(<SelectorTema />);

    await user.click(screen.getByRole('button', { name: 'Cambiar a tema oscuro' }));
    unmount();
    document.documentElement.classList.remove('dark');

    renderConProviders(<SelectorTema />);
    expect(screen.getByRole('button', { name: 'Cambiar a tema claro' })).toBeInTheDocument();
  });

  it('AC3 — se opera con teclado y el cambio se anuncia por región viva', async () => {
    const { user } = renderConProviders(<SelectorTema />);

    await user.tab();
    const boton = screen.getByRole('button', { name: 'Cambiar a tema oscuro' });
    expect(boton).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(await screen.findByText('Tema oscuro activado.')).toBeInTheDocument();
  });
});
