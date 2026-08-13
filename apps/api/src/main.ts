import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  // Si el .env es inválido, NestFactory.create lanza aquí: el proceso muere
  // antes de abrir ningún puerto.
  const app = await NestFactory.create(AppModule);

  const config = app.get(AppConfigService);

  // Parseo de cookies: el refresh token viaja en una cookie httpOnly que
  // /auth/refresh y /auth/logout leen de `req.cookies`.
  app.use(cookieParser());

  // CORS:
  //  - development → cualquier localhost (Vite puede acabar en 5173, 5174...).
  //  - staging/prod → solo los orígenes de CORS_ORIGIN (el frontend desplegado).
  //    Si no se define, no se habilita CORS y el navegador bloqueará al front:
  //    es intencional, obliga a configurarlo explícitamente al desplegar.
  //
  // `credentials: true` es imprescindible para que el navegador envíe y reciba
  // la cookie httpOnly del refresh token en peticiones cross-origin (el frontend
  // debe llamar con `withCredentials`).
  if (config.isDevelopment) {
    app.enableCors({ origin: /^http:\/\/localhost:\d+$/, credentials: true });
  } else if (config.corsOrigins.length > 0) {
    app.enableCors({ origin: config.corsOrigins, credentials: true });
  }

  await app.listen(config.port);

  Logger.log(
    `API escuchando en http://localhost:${config.port} [entorno: ${config.nodeEnv}]`,
    'Bootstrap',
  );
}

void bootstrap();
