import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppConfigService } from './app-config.service';
import { validateEnv } from './env.validation';

/**
 * Configuración global de la aplicación.
 *
 * `@Global()` + `exports` hacen que cualquier módulo pueda inyectar
 * `AppConfigService` sin tener que importar este módulo explícitamente.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      // Disponible en toda la app sin re-importar.
      isGlobal: true,

      // Se resuelve relativo al cwd del proceso, que al lanzar la app con los
      // scripts del workspace es `apps/api/`.
      envFilePath: ['.env'],

      // Si esto lanza, Nest aborta el arranque antes de levantar el servidor.
      validate: validateEnv,

      // Evita releer y re-parsear el .env en cada acceso.
      cache: true,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
