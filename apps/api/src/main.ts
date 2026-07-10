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

  await app.listen(config.port);

  Logger.log(
    `API escuchando en http://localhost:${config.port} [entorno: ${config.nodeEnv}]`,
    'Bootstrap',
  );
}

void bootstrap();
