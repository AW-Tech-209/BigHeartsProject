import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { ClassroomsController } from './classrooms.controller';
import { ClassroomsService } from './classrooms.service';
import { MeetingLinkCipher } from './meeting-link.cipher';

/**
 * Aulas: catálogo, capacidad y disponibilidad.
 *
 * `MeetingLinkCipher` se **exporta** porque el enlace cifrado es de este
 * módulo, pero no solo lo lee este módulo: HU-303 lo descifra desde el dominio
 * de reservas para el estudiante que entra en su ventana de 30 minutos. Que
 * haya que importar `ClassroomsModule` para poder descifrar es intencional —
 * deja el alcance del secreto visible en el grafo de módulos, en vez de
 * repartido en un helper global que cualquiera puede llamar.
 *
 * `NotificationsModule` entra desde HU-306: cancelar un aula avisa a cada
 * estudiante afectado por el mismo puerto que usa `BookingsModule`.
 */
@Module({
  imports: [NotificationsModule],
  controllers: [ClassroomsController],
  providers: [ClassroomsService, MeetingLinkCipher],
  exports: [MeetingLinkCipher],
})
export class ClassroomsModule {}
