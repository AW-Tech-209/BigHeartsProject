import { ArrowRight, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

/**
 * El botón de acción de una fila del historial (HU-404). Es una **extensión del
 * enlace del título**: lleva al mismo `/aulas/:id` y no hace nada nuevo. Existe
 * porque para parte de los usuarios no es evidente que el título sea un enlace.
 *
 * `marcarAsistencia` solo lo pide el historial del profesor cuando le queda
 * asistencia por resolver — el control está en el detalle (HU-403).
 */
export function AccionFilaHistorial({
  aulaId,
  marcarAsistencia = false,
}: {
  aulaId: string;
  marcarAsistencia?: boolean;
}) {
  const Icono = marcarAsistencia ? ClipboardList : ArrowRight;

  return (
    <Button
      render={<Link to={`/aulas/${aulaId}`} />}
      variant="outline"
      className="h-11 gap-2 px-3.5 text-sm"
    >
      <Icono aria-hidden="true" strokeWidth={2} className="size-4" />
      {marcarAsistencia ? 'Marcar asistencia' : 'Ver detalle'}
    </Button>
  );
}
