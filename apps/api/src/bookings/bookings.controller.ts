import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { type CreateBookingResponse, UserRole } from '@academia/types';

import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

/**
 * Reservas de aulas (HU-301). `@Roles(STUDENT)` en la clase: todo el módulo es
 * suyo, al revés que `ClassroomsController` — aquí no hay un endpoint que
 * también vean profesores o administradores (`ARQUITECTURA.md` §4.8, regla 1).
 */
@Controller('bookings')
@Roles(UserRole.STUDENT)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /** POST /bookings — reserva un cupo en un aula. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() student: AuthenticatedUser,
    @Body() dto: CreateBookingDto,
  ): Promise<CreateBookingResponse> {
    return this.bookingsService.createBooking(student, dto);
  }
}
