import type { AulaImpartida } from '@academia/types';
import { CircleCheck, ClipboardList, Users, type LucideIcon } from 'lucide-react';

import { Badge, type badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';

type Tono = NonNullable<VariantProps<typeof badgeVariants>['tono']>;

/**
 * El estado de la asistencia de un aula ya impartida (HU-403, D33): sin nadie a
 * quien marcar, pendiente (total o a medias), o resuelta para todos los
 * inscritos. Mismo eje que la tarjeta «Asistencia sin marcar» del panel: ámbar
 * mientras quede algo por marcar, `success` solo al cerrarla del todo.
 *
 * «Asistencia marcada» exige señal afirmativa: `asistenciaPendiente === 0`
 * real. Si el campo no llega (`undefined`/`NaN`) se muestra como pendiente,
 * nunca como hecha.
 */
export function estadoAsistenciaAula(
  aula: Pick<AulaImpartida, 'totalInscritos' | 'asistenciaPendiente'>,
): { icon: LucideIcon; texto: string; tono: Tono; completa: boolean; pendiente: boolean } {
  const inscritos = aula.totalInscritos;
  const pendientes = aula.asistenciaPendiente;

  if (!Number.isFinite(inscritos) || inscritos <= 0) {
    return {
      icon: Users,
      texto: 'Sin inscritos',
      tono: 'neutral',
      completa: false,
      pendiente: false,
    };
  }
  if (!Number.isFinite(pendientes) || pendientes >= inscritos) {
    return {
      icon: ClipboardList,
      texto: 'Falta marcar asistencia',
      tono: 'attention',
      completa: false,
      pendiente: true,
    };
  }
  if (pendientes > 0) {
    return {
      icon: ClipboardList,
      texto: `Falta marcar (${pendientes} de ${inscritos})`,
      tono: 'attention',
      completa: false,
      pendiente: true,
    };
  }
  return {
    icon: CircleCheck,
    texto: 'Asistencia marcada',
    tono: 'success',
    completa: true,
    pendiente: false,
  };
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
