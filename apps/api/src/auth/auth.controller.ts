import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { RegisterResponse } from '@academia/types';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   *
   * Registra un estudiante o profesor. Devuelve el usuario público (con su
   * `status`, que el frontend usa para el mensaje de confirmación). El envelope
   * de éxito lo añade el ResponseInterceptor global.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<RegisterResponse> {
    const user = await this.authService.register(dto);
    return { user };
  }
}
