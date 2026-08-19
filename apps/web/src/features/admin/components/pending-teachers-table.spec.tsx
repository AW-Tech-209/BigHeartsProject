import { UserRole, UserStatus, type User } from '@academia/types';
import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { PendingTeachersTable } from './pending-teachers-table';

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

function profesor(overrides: Partial<User> = {}): User {
  return {
    id: 'profe-1',
    email: 'paula@academia.local',
    firstName: 'Paula',
    lastName: 'Profesora',
    role: UserRole.TEACHER,
    status: UserStatus.PENDING,
    hearingLossLevel: null,
    communicationPreference: null,
    createdAt: '2026-08-12T15:30:00.000Z',
    updatedAt: '2026-08-12T15:30:00.000Z',
    ...overrides,
  };
}

function montar(options: { teachers?: User[]; resolvingId?: string | null } = {}) {
  const onResolve = vi.fn();
  const resultado = renderConProviders(
    <PendingTeachersTable
      teachers={options.teachers ?? [profesor()]}
      resolvingId={options.resolvingId ?? null}
      onResolve={onResolve}
    />,
  );

  return { ...resultado, onResolve };
}

describe('PendingTeachersTable — semántica de la tabla (B3)', () => {
  it('tiene un `<caption>` que la nombra', () => {
    montar();

    expect(screen.getByRole('table')).toHaveAccessibleName(
      '1 profesor espera tu aprobación, del más antiguo al más reciente.',
    );
  });

  it('tiene encabezados de columna reales', () => {
    montar();

    const encabezados = screen.getAllByRole('columnheader').map((th) => th.textContent);
    expect(encabezados).toEqual(['Profesor', 'Solicitud', 'Acciones']);
  });

  it('el nombre del profesor es el encabezado de su fila', () => {
    montar();

    const filaDePaula = screen.getByRole('rowheader');
    expect(filaDePaula).toHaveTextContent('Paula Profesora');
    expect(filaDePaula).toHaveTextContent('paula@academia.local');
  });

  it('muestra la fecha de solicitud escrita entera', () => {
    montar();

    expect(screen.getByRole('cell', { name: /12 de agosto de 2026/ })).toBeInTheDocument();
  });

  it('las acciones son botones, no divs pulsables', () => {
    montar();

    // Si fueran `<div onClick>`, estas dos consultas por rol devolverían null —
    // y ese es exactamente el fallo que queremos que salte.
    expect(screen.getByRole('button', { name: 'Aprobar a Paula Profesora' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar a Paula Profesora' })).toBeInTheDocument();
  });

  it('cada botón nombra a SU profesor, no solo la acción', () => {
    montar({
      teachers: [profesor(), profesor({ id: 'profe-2', firstName: 'Iván', lastName: 'Ibáñez' })],
    });

    // Con doce filas, doce botones llamados «Aprobar» son indistinguibles para
    // quien navega con lector de pantalla.
    expect(screen.getByRole('button', { name: 'Aprobar a Iván Ibáñez' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aprobar a Paula Profesora' })).toBeInTheDocument();
  });
});

describe('PendingTeachersTable — recorrido con teclado (AC7)', () => {
  it('se llega a las dos acciones de una fila con Tab, en orden', async () => {
    const { user } = montar();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Aprobar a Paula Profesora' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Rechazar a Paula Profesora' })).toHaveFocus();
  });

  it('se recorren las filas en orden, sin saltarse ninguna', async () => {
    const { user } = montar({
      teachers: [profesor(), profesor({ id: 'profe-2', firstName: 'Iván', lastName: 'Ibáñez' })],
    });

    await user.tab();
    await user.tab();
    await user.tab();

    expect(screen.getByRole('button', { name: 'Aprobar a Iván Ibáñez' })).toHaveFocus();
  });

  it('el diálogo se abre con Enter desde el botón enfocado', async () => {
    const { user } = montar();

    await user.tab();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });
});

describe('PendingTeachersTable — la confirmación (B4, AC7)', () => {
  it('el foco inicial va a «Volver», no al botón que ejecuta', async () => {
    const { user } = montar();

    await user.click(screen.getByRole('button', { name: 'Rechazar a Paula Profesora' }));

    expect(await screen.findByRole('button', { name: 'Volver' })).toHaveFocus();
  });

  it('el diálogo atrapa el foco: Tab no se escapa a la tabla', async () => {
    const { user } = montar();

    await user.click(screen.getByRole('button', { name: 'Rechazar a Paula Profesora' }));
    const dialogo = await screen.findByRole('alertdialog');

    await user.tab();
    await user.tab();
    await user.tab();

    expect(dialogo).toContainElement(document.activeElement as HTMLElement);
  });

  it('se cierra con Esc sin ejecutar la acción', async () => {
    const { user, onResolve } = montar();

    await user.click(screen.getByRole('button', { name: 'Rechazar a Paula Profesora' }));
    await screen.findByRole('alertdialog');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onResolve).not.toHaveBeenCalled();
  });

  it('«Volver» cierra sin ejecutar la acción', async () => {
    const { user, onResolve } = montar();

    await user.click(screen.getByRole('button', { name: 'Rechazar a Paula Profesora' }));
    await user.click(await screen.findByRole('button', { name: 'Volver' }));

    expect(onResolve).not.toHaveBeenCalled();
  });

  it('los botones del diálogo llevan verbos, nunca Sí/No', async () => {
    const { user } = montar();

    await user.click(screen.getByRole('button', { name: 'Aprobar a Paula Profesora' }));
    const dialogo = await screen.findByRole('alertdialog');

    const nombres = within(dialogo)
      .getAllByRole('button')
      .map((boton) => boton.textContent);
    expect(nombres).toEqual(['Volver', 'Aprobar profesor']);
  });

  it('el título nombra a la persona y la descripción dice la consecuencia', async () => {
    const { user } = montar();

    await user.click(screen.getByRole('button', { name: 'Rechazar a Paula Profesora' }));
    const dialogo = await screen.findByRole('alertdialog');

    expect(dialogo).toHaveAccessibleName('¿Rechazar la solicitud de Paula Profesora?');
    expect(dialogo).toHaveAccessibleDescription(/no podrá entrar a la plataforma/i);
  });

  it('confirmar avisa con el profesor y la resolución correctos', async () => {
    const { user, onResolve } = montar();

    await user.click(screen.getByRole('button', { name: 'Aprobar a Paula Profesora' }));
    await screen.findByRole('alertdialog');
    await user.click(screen.getByRole('button', { name: 'Aprobar profesor' }));

    expect(onResolve).toHaveBeenCalledWith(expect.objectContaining({ id: 'profe-1' }), 'approve');
  });

  it('mientras el servidor responde, el diálogo sigue abierto y lo dice con texto', async () => {
    const { user } = montar({ resolvingId: 'profe-1' });

    await user.click(screen.getByRole('button', { name: 'Aprobar a Paula Profesora' }));
    const dialogo = await screen.findByRole('alertdialog');

    // Un spinner mudo no sirve: la espera se lee.
    expect(within(dialogo).getByText('Aprobando al profesor…')).toBeInTheDocument();
  });
});

describe('PendingTeachersTable — accesibilidad automática', () => {
  it.each(TEMAS)('sin violaciones en el tema %s', async (tema) => {
    const { container } = renderConProviders(
      <PendingTeachersTable teachers={[profesor()]} resolvingId={null} onResolve={vi.fn()} />,
      { tema },
    );

    await esperarSinFallosDeAccesibilidad(container);
  });

  it.each(TEMAS)('sin violaciones con el diálogo abierto en el tema %s', async (tema) => {
    const { user, baseElement } = renderConProviders(
      <PendingTeachersTable teachers={[profesor()]} resolvingId={null} onResolve={vi.fn()} />,
      { tema },
    );

    await user.click(screen.getByRole('button', { name: 'Rechazar a Paula Profesora' }));
    await screen.findByRole('alertdialog');

    // `baseElement` y no `container`: el diálogo vive en un portal.
    await esperarSinFallosDeAccesibilidad(baseElement);
  });
});
