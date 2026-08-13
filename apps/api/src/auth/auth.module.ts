import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * Autenticación y registro. PrismaService y AppConfigService se inyectan desde
 * sus módulos globales (PrismaModule / AppConfigModule).
 *
 * TODO(HU siguiente): login, emisión/validación de JWT y guards de rol.
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
