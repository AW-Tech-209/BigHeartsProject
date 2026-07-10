import { Controller, Get } from '@nestjs/common';
// Import desde el paquete compartido del monorepo: prueba de que el enlace de
// npm workspaces funciona y de que los tipos resuelven.
import type { ApiResponse } from '@academia/types';

/** Payload que devuelve el health-check. */
export interface HealthStatus {
  status: 'ok';
  /** Segundos que lleva el proceso vivo. */
  uptime: number;
}

@Controller('health')
export class HealthController {
  /**
   * GET /health
   *
   * Comprueba únicamente que el proceso de la API responde. No toca base de
   * datos ni servicios externos.
   *
   * TODO: cuando exista Prisma, añadir aquí una comprobación de conectividad
   * con la BD y devolver 503 si está caída.
   */
  @Get()
  check(): ApiResponse<HealthStatus> {
    return {
      success: true,
      data: {
        status: 'ok',
        uptime: Math.floor(process.uptime()),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
