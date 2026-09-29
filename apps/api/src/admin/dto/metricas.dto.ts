import type { MetricasQuery } from '@academia/types';
import { IsOptional, Matches } from 'class-validator';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** DTO de `GET /admin/metricas`. El orden y el tope de días los valida el servicio. */
export class MetricasQueryDto implements MetricasQuery {
  @IsOptional()
  @Matches(FECHA, { message: 'La fecha de inicio debe tener la forma AAAA-MM-DD.' })
  desde?: string;

  @IsOptional()
  @Matches(FECHA, { message: 'La fecha de fin debe tener la forma AAAA-MM-DD.' })
  hasta?: string;
}
