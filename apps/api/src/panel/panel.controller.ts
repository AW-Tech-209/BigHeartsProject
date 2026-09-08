import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { ResumenPanelResponse } from '@academia/types';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { API_THROTTLE } from '../common/api-throttle';
import { PanelService } from './panel.service';

/**
 * `GET /panel/resumen` (HU-502). Lo ve cualquier usuario autenticado; la forma
 * de la respuesta sale del rol del token y no hay ningún parámetro que amplíe
 * el alcance (§4.8: un endpoint por propósito, alcance desde el token).
 */
@Controller('panel')
@Throttle(API_THROTTLE)
export class PanelController {
  constructor(private readonly panelService: PanelService) {}

  @Get('resumen')
  async resumen(@CurrentUser() viewer: AuthenticatedUser): Promise<ResumenPanelResponse> {
    return this.panelService.resumen(viewer);
  }
}
