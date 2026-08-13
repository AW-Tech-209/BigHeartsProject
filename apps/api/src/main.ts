import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  // Si el .env es inválido, NestFactory.create lanza aquí: el proceso muere
  // antes de abrir ningún puerto.
  const app = await NestFactory.create(AppModule);

  const config = app.get(AppConfigService);

  // CORS:
  //  - development → cualquier localhost (Vite puede acabar en 5173, 5174...).
  //  - staging/prod → solo los orígenes de CORS_ORIGIN (el frontend desplegado).
  //    Si no se define, no se habilita CORS y el navegador bloqueará al front:
  //    es intencional, obliga a configurarlo explícitamente al desplegar.
  if (config.isDevelopment) {
    app.enableCors({ origin: /^http:\/\/localhost:\d+$/ });
  } else if (config.corsOrigins.length > 0) {
    app.enableCors({ origin: config.corsOrigins });
  }

  await app.listen(config.port);

  Logger.log(
    `API escuchando en http://localhost:${config.port} [entorno: ${config.nodeEnv}]`,
    'Bootstrap',
  );
}

void bootstrap();
