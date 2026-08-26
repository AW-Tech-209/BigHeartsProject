import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { renderConProviders } from '@/test/render-con-providers';
import { SelectorTema } from './selector-tema';

/**
 * AC1-AC3 de HU-216: aplicar clase a `<html>` sin recargar, persistir en
 * `localStorage` y operarse completo con teclado con el cambio anunciado.
 */
describe('SelectorTema', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'hc');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark', 'hc');
  });

  it('AC1 — cambiar la selección aplica la clase a <html> de inmediato', async () => {
    const { user } = renderConProviders(<SelectorTema />);

    await user.selectOptions(screen.getByLabelText('Tema visual'), 'Tema oscuro');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.selectOptions(screen.getByLabelText('Tema visual'), 'Tema de alto contraste');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('hc')).toBe(true);
  });

  it('AC2 — la preferencia persiste entre sesiones', async () => {
    const { user, unmount } = renderConProviders(<SelectorTema />);

    await user.selectOptions(screen.getByLabelText('Tema visual'), 'Tema oscuro');
    unmount();
    document.documentElement.classList.remove('dark', 'hc');

    renderConProviders(<SelectorTema />);
    expect(screen.getByLabelText('Tema visual')).toHaveValue('oscuro');
  });

  it('AC3 — se opera con teclado y el cambio se anuncia por región viva', async () => {
    const { user } = renderConProviders(<SelectorTema />);

    await user.tab();
    expect(screen.getByLabelText('Tema visual')).toHaveFocus();

    await user.selectOptions(screen.getByLabelText('Tema visual'), 'Tema oscuro');
    expect(await screen.findByText('Tema oscuro activado.')).toBeInTheDocument();
  });
});
