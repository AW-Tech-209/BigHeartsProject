import { Module } from '@nestjs/common';

import { HistorialController } from './historial.controller';
import { HistorialService } from './historial.service';

/** El historial de clases pasadas, por rol (HU-404, D34). */
@Module({
  controllers: [HistorialController],
  providers: [HistorialService],
})
export class HistorialModule {}
