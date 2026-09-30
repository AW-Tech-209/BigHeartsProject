import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { ConfigPublica } from '@academia/types';

import { Public } from '../auth/decorators/public.decorator';
import { API_THROTTLE } from '../common/api-throttle';
import { AppConfigService } from '../config/app-config.service';

@Controller('config')
@Throttle(API_THROTTLE)
export class ConfigPublicaController {
  constructor(private readonly config: AppConfigService) {}

  /** GET /config/publica — lo que el front pregunta en vez de suponer. */
  @Public()
  @Get('publica')
  obtener(): ConfigPublica {
    return { registroAbierto: this.config.publicRegistrationEnabled };
  }
}
