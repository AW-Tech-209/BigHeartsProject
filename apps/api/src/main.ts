import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // TODO(Bloque 4): leer el puerto desde el ConfigService tipado en lugar de
  // process.env directamente.
  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);

  Logger.log(`API escuchando en http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
