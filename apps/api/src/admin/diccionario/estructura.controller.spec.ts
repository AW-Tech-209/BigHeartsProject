import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserStatus } from '@academia/types';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { RolesGuard } from '../../auth/guards/roles.guard';
import { CrearCategoriaDto } from './dto/estructura.dto';
import { EstructuraController } from './estructura.controller';
import { PapeleraController } from './papelera.controller';
import { quedanDias } from './papelera.service';

function contexto(clase: object, handler: unknown, role: UserRole): ExecutionContext {
  const user = { id: 'u', email: 'u@academia.local', role, status: UserStatus.ACTIVE };
  return {
    getHandler: () => handler,
    getClass: () => clase,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

const metodos = (clase: { prototype: object }) =>
  Object.getOwnPropertyNames(clase.prototype)
    .filter((m) => m !== 'constructor')
    .map((m) => (clase.prototype as Record<string, unknown>)[m]);

describe('papelera y estructura — autorización', () => {
  const guard = new RolesGuard(new Reflector());

  it.each([UserRole.STUDENT, UserRole.TEACHER])('%s recibe 403 en todas las rutas', (role) => {
    for (const clase of [PapeleraController, EstructuraController]) {
      for (const handler of metodos(clase)) {
        expect(() => guard.canActivate(contexto(clase, handler, role))).toThrowError(
          ForbiddenException,
        );
      }
    }
  });
});

describe('CrearCategoriaDto — ícono de la lista curada', () => {
  const errores = (icono: string) =>
    validateSync(plainToInstance(CrearCategoriaDto, { nombre: 'Animales', icono }));

  it('acepta un ícono de la lista y rechaza cualquier otro', () => {
    expect(errores('dog')).toHaveLength(0);
    expect(errores('skull')).not.toHaveLength(0);
  });
});

describe('quedanDias', () => {
  const DIA = 24 * 60 * 60 * 1000;
  const ahora = new Date('2026-11-16T12:00:00Z');

  it('cuenta los días que faltan y nunca baja de 0', () => {
    expect(quedanDias(ahora, 30, ahora)).toBe(30);
    expect(quedanDias(new Date(ahora.getTime() - 27 * DIA), 30, ahora)).toBe(3);
    expect(quedanDias(new Date(ahora.getTime() - 31 * DIA), 30, ahora)).toBe(0);
  });
});
