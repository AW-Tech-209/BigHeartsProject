import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import type {
  ForgotPasswordResponse,
  LoginResponse,
  RefreshResponse,
  RegisterResponse,
  ResetPasswordResponse,
} from '@academia/types';
import type { Request, Response } from 'express';

import { AppConfigService } from '../config/app-config.service';
import { REFRESH_COOKIE_NAME } from './auth.constants';
import { AuthService } from './auth.service';
import type { IssuedSession } from './auth.types';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard';
import { clearRefreshCookie, setRefreshCookie } from './refresh-cookie';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfigService,
  ) {}

  /**
   * POST /auth/register
   *
   * Registra un estudiante o profesor. Público y con rate limiting (freno de
   * fuerza bruta / creación masiva). El envelope de éxito lo añade el
   * ResponseInterceptor global.
   */
  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<RegisterResponse> {
    const user = await this.authService.register(dto);
    return { user };
  }

  /**
   * POST /auth/login
   *
   * Valida credenciales y abre sesión: devuelve el Access Token en el cuerpo y
   * planta el Refresh Token en una cookie httpOnly. Público y con rate limiting.
   */
  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const issued = await this.authService.login(dto);
    this.plantCookie(res, issued);
    return issued.session;
  }

  /**
   * POST /auth/refresh
   *
   * Renueva la sesión a partir de la cookie del refresh token, rotándolo. Es
   * público para el guard de JWT (no usa Access Token; se apoya en la cookie).
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponse> {
    const rawToken = this.readRefreshCookie(req);
    const issued = await this.authService.refresh(rawToken);
    this.plantCookie(res, issued);
    return issued.session;
  }

  /**
   * POST /auth/logout
   *
   * Revoca el refresh token y borra la cookie. Idempotente y público: cerrar
   * sesión debe funcionar aunque el Access Token ya haya caducado.
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ loggedOut: true }> {
    const rawToken = this.readRefreshCookie(req);
    if (rawToken) {
      await this.authService.logout(rawToken);
    }
    clearRefreshCookie(res, this.config);
    return { loggedOut: true };
  }

  /**
   * POST /auth/forgot-password
   *
   * Pide un enlace de recuperación. Público y con rate limiting. La respuesta es
   * siempre la misma, exista o no la cuenta (HU-410, AC1).
   */
  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    await this.authService.requestPasswordReset(dto);
    return { requested: true };
  }

  /**
   * POST /auth/reset-password
   *
   * Cambia la contraseña con un token de un solo uso y revoca todas las
   * sesiones del usuario. Público y con rate limiting.
   */
  @Public()
  @UseGuards(AuthThrottlerGuard)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ResetPasswordResponse> {
    await this.authService.resetPassword(dto);
    return { reset: true };
  }

  private plantCookie(res: Response, issued: IssuedSession): void {
    setRefreshCookie(res, this.config, issued.refreshToken, issued.refreshExpiresAt);
  }

  private readRefreshCookie(req: Request): string | undefined {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    return cookies?.[REFRESH_COOKIE_NAME];
  }
}
