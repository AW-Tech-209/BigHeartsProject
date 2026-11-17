import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '@academia/types';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DiccionarioController } from './diccionario.controller';
import { BuscarQueryDto } from './dto/buscar-query.dto';

const RUTAS = ['inicio', 'buscar', 'modulo', 'categoria', 'entrada'] as const;

function contexto(ruta: (typeof RUTAS)[number], request: object): ExecutionContext {
  return {
    getHandler: () => DiccionarioController.prototype[ruta],
    getClass: () => DiccionarioController,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('DiccionarioController — autorización', () => {
  it.each(RUTAS)('%s sin sesión responde 401', (ruta) => {
    const guard = new JwtAuthGuard(new Reflector(), {} as JwtService);

    expect(() => guard.canActivate(contexto(ruta, { headers: {} }))).toThrowError(
      UnauthorizedException,
    );
  });

  it.each([UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN])('deja leer a %s', (role) => {
    const guard = new RolesGuard(new Reflector());
    const user = { id: 'u', email: 'u@academia.local', role, status: UserStatus.ACTIVE };

    for (const ruta of RUTAS) expect(guard.canActivate(contexto(ruta, { user }))).toBe(true);
  });
});

describe('BuscarQueryDto', () => {
  const validar = (q: unknown) => {
    const dto = plainToInstance(BuscarQueryDto, { q });
    return { dto, errores: validateSync(dto) };
  };

  it('rechaza menos de 2 letras', () => {
    expect(validar('a').errores).not.toHaveLength(0);
    expect(validar(' ¿a? ').errores).not.toHaveLength(0);
  });

  it('normaliza la consulta: tildes y mayúsculas no cuentan', () => {
    const { dto, errores } = validar('  Lápiz ');

    expect(errores).toHaveLength(0);
    expect(dto.q).toBe('lapiz');
  });
});
