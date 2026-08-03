import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Cliente de Prisma integrado en el ciclo de vida de NestJS.
 *
 * Extiende `PrismaClient` para poder inyectarlo como provider en cualquier
 * servicio. La conexión se abre al iniciar el módulo y se cierra de forma
 * ordenada al apagar la app, para no dejar conexiones colgando en el pooler.
 *
 * La URL de conexión la lee Prisma de `DATABASE_URL` (ver prisma/schema.prisma);
 * `@nestjs/config` ya ha cargado el `.env` en `process.env` antes de que este
 * servicio se instancie, así que el orden es correcto.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    // No tumbamos el arranque si la BD está caída: la app arranca igual y el
    // endpoint /health reporta el problema con un 503 (patrón readiness probe).
    // Así el orquestador deja de enrutar tráfico en vez de entrar en
    // crash-loop, y el fallo es observable en vez de opaco.
    try {
      await this.$connect();
      this.logger.log('Conexión con PostgreSQL establecida');
    } catch (error) {
      this.logger.error(
        'No se pudo conectar con PostgreSQL al arrancar. La app sigue viva; ' +
          'GET /health devolverá 503 hasta que la BD responda.',
        error as Error,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
