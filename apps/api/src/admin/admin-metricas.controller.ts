import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { type MetricasAcademia, UserRole } from '@academia/types';

import { Roles } from '../auth/decorators/roles.decorator';
import { API_THROTTLE } from '../common/api-throttle';
import { AdminMetricasService } from './admin-metricas.service';
import { MetricasQueryDto } from './dto/metricas.dto';

@Controller('admin/metricas')
@Roles(UserRole.ADMIN)
@Throttle(API_THROTTLE)
export class AdminMetricasController {
  constructor(private readonly metricasService: AdminMetricasService) {}

  @Get()
  async obtener(@Query() query: MetricasQueryDto): Promise<MetricasAcademia> {
    return this.metricasService.obtener(query);
  }
}
