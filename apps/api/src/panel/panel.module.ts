import { Module } from '@nestjs/common';

import { PanelController } from './panel.controller';
import { PanelService } from './panel.service';

/** El resumen de portada por rol (HU-502): `GET /panel/resumen`. */
@Module({
  controllers: [PanelController],
  providers: [PanelService],
})
export class PanelModule {}
