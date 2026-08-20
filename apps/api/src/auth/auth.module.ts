import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';

import { AppConfigService } from '../config/app-config.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TokenService } from './token.service';

/**
 * Autenticación, registro y sesión (HU-102).
 *
 * PrismaService y AppConfigService se inyectan desde sus módulos globales.
 * JwtModule se configura de forma asíncrona para leer el secreto y la vida del
 * access token desde la config validada.
 *
 * El JwtAuthGuard se registra como APP_GUARD: es GLOBAL, así que protege toda la
 * API por defecto y solo deja pasar las rutas marcadas con `@Public()`.
 *
 * El RolesGuard va DETRÁS, y el orden importa: NestJS ejecuta los APP_GUARD en
 * el orden en que se declaran, y el segundo necesita el `request.user` que
 * planta el primero. Si se invierten, toda ruta con `@Roles` responde 401.
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtSecret,
        // `expiresIn` acepta formato `ms` ('15m', '1h'...); el tipo de `ms` es
        // un template-literal, así que casteamos el string validado por env.
        signOptions: {
          expiresIn: config.jwtAccessExpiresIn as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
