import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ApiErrorCode } from '@academia/types';

import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

/** Payload que devuelve el health-check cuando todo está operativo. */
export interface HealthStatus {
  status: 'ok';
  /** Segundos que lleva el proceso vivo. */
  uptime: number;
  /** Estado de la conexión con la base de datos. */
  database: 'up';
}

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /health
   *
   * Confirma que el proceso responde Y que hay conexión con PostgreSQL.
   *  - Todo OK        → 200. El ResponseInterceptor envuelve el payload.
   *  - BD inaccesible → 503 (ServiceUnavailableException). El AllExceptionsFilter
   *    lo convierte en el envelope de error con code DATABASE_UNAVAILABLE.
   *
   * Público: es una readiness probe, no debe exigir sesión.
   */
  @Public()
  @Get()
  async check(): Promise<HealthStatus> {
    if (!(await this.isDatabaseReachable())) {
      throw new ServiceUnavailableException({
        code: ApiErrorCode.DATABASE_UNAVAILABLE,
        message: 'La API está viva pero no puede conectar con la base de datos.',
      });
    }

    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      database: 'up',
    };
  }

  /** Hace un ping mínimo a PostgreSQL. No lanza: traduce el fallo a `false`. */
  private async isDatabaseReachable(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Health-check: sin conexión con PostgreSQL', error as Error);
      return false;
    }
  }
}
