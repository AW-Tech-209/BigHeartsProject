import { createElement } from 'react';

import { iconoDeCategoria } from '../lib/iconos-categoria';

/** Ícono decorativo de una categoría: el nombre de la categoría siempre va al lado en texto. */
export function IconoCategoria({ nombre, className }: { nombre: string; className?: string }) {
  return createElement(iconoDeCategoria(nombre), {
    'aria-hidden': true,
    strokeWidth: 2,
    className,
  });
}
