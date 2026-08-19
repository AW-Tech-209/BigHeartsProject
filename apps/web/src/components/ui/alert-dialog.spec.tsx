import { useRef } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { Button } from './button';
import {
  AlertDialog,
  AlertDialogAcciones,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';

/**
 * El patrón de acción destructiva, ejecutado.
 *
 * Este archivo existe porque HU-104 y HU-202 van a copiar el ejemplo del
 * docblock de `alert-dialog.tsx` tal cual. Un patrón documentado que nadie ha
 * corrido nunca es una suposición, y aquí lo que se supone es dónde aterriza el
 * foco al abrir un diálogo que puede borrar el cupo de alguien.
 */

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

function DialogoDeCancelacion({ onConfirmar = vi.fn() }: { onConfirmar?: () => void }) {
  const volverRef = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Cancelar mi reserva
      </AlertDialogTrigger>
      <AlertDialogContent initialFocus={volverRef}>
        <AlertDialogTitle>
          ¿Cancelar tu reserva de «Inglés básico — martes 6 p.m.»?
        </AlertDialogTitle>
        <AlertDialogDescription>
          Tu lugar quedará disponible para otro estudiante.
        </AlertDialogDescription>
        <AlertDialogAcciones>
          <AlertDialogClose render={<Button variant="outline" ref={volverRef} />}>
            Volver
          </AlertDialogClose>
          <Button variant="destructive" onClick={onConfirmar}>
            Cancelar mi reserva
          </Button>
        </AlertDialogAcciones>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe('AlertDialog — el patrón de acción destructiva', () => {
  it('se abre con teclado desde el disparador', async () => {
    const { user } = renderConProviders(<DialogoDeCancelacion />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancelar mi reserva' })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });

  it('el foco inicial va al botón seguro, no al destructivo', async () => {
    const { user } = renderConProviders(<DialogoDeCancelacion />);

    await user.click(screen.getByRole('button', { name: 'Cancelar mi reserva' }));

    // Si el foco cayera en el botón destructivo, un Enter de más borraría la
    // reserva. El botón de salida es el que recibe el foco.
    expect(await screen.findByRole('button', { name: 'Volver' })).toHaveFocus();
  });

  it('el título nombra el objeto y la descripción dice la consecuencia', async () => {
    const { user } = renderConProviders(<DialogoDeCancelacion />);

    await user.click(screen.getByRole('button', { name: 'Cancelar mi reserva' }));
    const dialogo = await screen.findByRole('alertdialog');

    // Ambos viajan en el nombre y la descripción accesibles del diálogo: quien
    // usa lector de pantalla los oye al entrar, sin tener que buscarlos.
    expect(dialogo).toHaveAccessibleName(
      '¿Cancelar tu reserva de «Inglés básico — martes 6 p.m.»?',
    );
    expect(dialogo).toHaveAccessibleDescription(
      'Tu lugar quedará disponible para otro estudiante.',
    );
  });

  it('los dos botones llevan verbos, nunca Sí/No', async () => {
    const { user } = renderConProviders(<DialogoDeCancelacion />);

    await user.click(screen.getByRole('button', { name: 'Cancelar mi reserva' }));
    const dialogo = await screen.findByRole('alertdialog');

    const nombres = Array.from(dialogo.querySelectorAll('button')).map((b) => b.textContent);
    expect(nombres).toEqual(['Volver', 'Cancelar mi reserva']);
  });

  it('«Volver» cierra sin ejecutar la acción', async () => {
    const onConfirmar = vi.fn();
    const { user } = renderConProviders(<DialogoDeCancelacion onConfirmar={onConfirmar} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar mi reserva' }));
    await user.click(await screen.findByRole('button', { name: 'Volver' }));

    expect(onConfirmar).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('confirmar ejecuta la acción', async () => {
    const onConfirmar = vi.fn();
    const { user } = renderConProviders(<DialogoDeCancelacion onConfirmar={onConfirmar} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar mi reserva' }));
    const dialogo = await screen.findByRole('alertdialog');

    const [, confirmar] = Array.from(dialogo.querySelectorAll('button'));
    await user.click(confirmar!);

    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it.each(TEMAS)('no tiene violaciones de accesibilidad abierto en el tema %s', async (tema) => {
    const { user, baseElement } = renderConProviders(<DialogoDeCancelacion />, { tema });

    await user.click(screen.getByRole('button', { name: 'Cancelar mi reserva' }));
    await screen.findByRole('alertdialog');

    // `baseElement` y no `container`: el diálogo vive en un portal, fuera del
    // árbol del componente.
    await esperarSinFallosDeAccesibilidad(baseElement);
  });
});
