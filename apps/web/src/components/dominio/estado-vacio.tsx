import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { IlustracionError, IlustracionNoEncontrado, IlustracionVacio } from './ilustraciones';

const ILUSTRACIONES = {
  vacio: IlustracionVacio,
  'no-encontrado': IlustracionNoEncontrado,
  error: IlustracionError,
} as const;

type EstadoVacioProps = {
  /** Cuál de las tres ilustraciones acompaña al mensaje. */
  ilustracion?: keyof typeof ILUSTRACIONES;
  /** Qué pasa, en una frase corta. Nunca «Sin resultados». */
  titular: string;
  /** Por qué pasa y qué se puede hacer. Una línea. */
  ayuda: string;
  /** La salida: un botón o enlace con un verbo («Explorar las aulas»). */
  accion?: ReactNode;
  className?: string;
};

/**
 * Pantalla o bloque sin contenido.
 *
 * Un vacío **invita a actuar**: dice qué falta, por qué, y ofrece la salida.
 * «Sin resultados» deja al usuario adivinando si el sistema falló o si de verdad
 * no hay nada — y quien lee español como segunda lengua paga esa ambigüedad más
 * cara que tú.
 *
 * El titular es un `<p>` y no un encabezado a propósito: este bloque aparece
 * dentro de páginas con jerarquías distintas, y meter un `<h2>` fijo rompería
 * el orden de encabezados justo donde se use anidado.
 */
export function EstadoVacio({
  ilustracion = 'vacio',
  titular,
  ayuda,
  accion,
  className,
}: EstadoVacioProps) {
  const Ilustracion = ILUSTRACIONES[ilustracion];

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center',
        className,
      )}
    >
      <Ilustracion className="mb-1" />
      <p className="font-serif text-2xl font-normal text-balance text-foreground">{titular}</p>
      <p className="max-w-[38ch] text-base text-muted-foreground">{ayuda}</p>
      {accion && <div className="pt-1">{accion}</div>}
    </div>
  );
}
