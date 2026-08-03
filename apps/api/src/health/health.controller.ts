import { Controller, Get, HttpStatus, Logger, Res } from '@nestjs/common';
import type { Response } from 'express';
// Import desde el paquete compartido del monorepo: el envelope de respuesta es
// el contrato acordado entre backend y frontend.
import type { ApiResponse } from '@academia/types';

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
   *  - Todo OK        → 200 con `success: true`.
   *  - BD inaccesible → 503 con `success: false`. El proceso sigue vivo, pero
   *    no puede servir peticiones que dependan de la base de datos.
   */
  @Get()
  async check(@Res({ passthrough: true }) res: Response): Promise<ApiResponse<HealthStatus>> {
    const timestamp = new Date().toISOString();

    if (!(await this.isDatabaseReachable())) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return {
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'La API está viva pero no puede conectar con la base de datos.',
        },
        timestamp,
      };
    }

    return {
      success: true,
      data: {
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        database: 'up',
      },
      timestamp,
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
