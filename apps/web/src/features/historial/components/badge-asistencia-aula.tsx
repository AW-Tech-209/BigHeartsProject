import type { AulaImpartida } from '@academia/types';
import { CircleCheck, ClipboardList, Users, type LucideIcon } from 'lucide-react';

import { Badge, type badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';

type Tono = NonNullable<VariantProps<typeof badgeVariants>['tono']>;

/**
 * El estado de la asistencia de un aula ya impartida (HU-403, D33): pendiente
 * de marcar, ya marcada, o sin nadie a quien marcar. Mismo eje que la tarjeta
 * «Asistencia sin marcar» del panel: ámbar mientras haya deuda, `success` al
 * cerrarla.
 */
export function estadoAsistenciaAula(
  aula: Pick<AulaImpartida, 'totalInscritos' | 'asistenciaPendiente'>,
): { icon: LucideIcon; texto: string; tono: Tono } {
  if (aula.totalInscritos === 0) {
    return { icon: Users, texto: 'Sin inscritos', tono: 'neutral' };
  }
  if (aula.asistenciaPendiente > 0) {
    return { icon: ClipboardList, texto: 'Falta marcar asistencia', tono: 'attention' };
  }
  return { icon: CircleCheck, texto: 'Asistencia marcada', tono: 'success' };
}

export function BadgeAsistenciaAula({
  aula,
}: {
  aula: Pick<AulaImpartida, 'totalInscritos' | 'asistenciaPendiente'>;
}) {
  const { icon, texto, tono } = estadoAsistenciaAula(aula);

  return (
    <Badge tono={tono} icon={icon}>
      {texto}
    </Badge>
  );
}
