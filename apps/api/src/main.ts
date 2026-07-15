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

  // Solo orígenes de dev: Vite arranca en 5173 y prueba el siguiente puerto
  // libre si ya hay algo escuchando (5174, 5175...), así que se acepta
  // cualquier puerto de localhost en vez de fijar uno o dos.
  if (config.isDevelopment) {
    app.enableCors({
      origin: /^http:\/\/localhost:\d+$/,
    });
  }

  await app.listen(config.port);

  Logger.log(
    `API escuchando en http://localhost:${config.port} [entorno: ${config.nodeEnv}]`,
    'Bootstrap',
  );
}

void bootstrap();
