import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EstadoVideo, UserRole, UserStatus } from '@academia/types';
import { describe, expect, it } from 'vitest';

import { RolesGuard } from '../../auth/guards/roles.guard';
import { AdminDiccionarioController } from './admin-diccionario.controller';
import { estadoSenaAdmin } from './admin-diccionario.mapper';
import { MediosController } from './medios.controller';

const RUTAS = ['avance', 'listar', 'duplicados', 'lote', 'obtener', 'crear', 'editar'] as const;

function contexto(ruta: (typeof RUTAS)[number], role: UserRole): ExecutionContext {
  const user = { id: 'u', email: 'u@academia.local', role, status: UserStatus.ACTIVE };
  return {
    getHandler: () => AdminDiccionarioController.prototype[ruta],
    getClass: () => AdminDiccionarioController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('AdminDiccionarioController — autorización', () => {
  const guard = new RolesGuard(new Reflector());

  it.each([UserRole.STUDENT, UserRole.TEACHER])('%s recibe 403 en todas las rutas', (role) => {
    for (const ruta of RUTAS) {
      expect(() => guard.canActivate(contexto(ruta, role))).toThrowError(ForbiddenException);
    }
  });

  it('ADMIN pasa en todas las rutas', () => {
    for (const ruta of RUTAS) expect(guard.canActivate(contexto(ruta, UserRole.ADMIN))).toBe(true);
  });
});

describe('estadoSenaAdmin', () => {
  it('lista gana a todo; luego procesando, error y sin seña', () => {
    expect(estadoSenaAdmin([EstadoVideo.ERROR, EstadoVideo.LISTO, EstadoVideo.SUBIENDO])).toBe(
      'lista',
    );
    expect(estadoSenaAdmin([EstadoVideo.ERROR, EstadoVideo.SUBIENDO])).toBe('procesando');
    expect(estadoSenaAdmin([EstadoVideo.PROCESANDO])).toBe('procesando');
    expect(estadoSenaAdmin([EstadoVideo.ERROR])).toBe('error');
    expect(estadoSenaAdmin([])).toBe('sin-sena');
  });
});

describe('MediosController — autorización', () => {
  const guard = new RolesGuard(new Reflector());
  const rutas = [
    'sinSena',
    'sinSenaCsv',
    'subirVideo',
    'confirmarVideo',
    'quitarVideo',
    'subirImagen',
    'confirmarImagen',
    'quitarImagen',
  ] as const;
  const ctx = (ruta: (typeof rutas)[number], role: UserRole) =>
    ({
      getHandler: () => MediosController.prototype[ruta],
      getClass: () => MediosController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'u', email: 'u@a.local', role, status: UserStatus.ACTIVE },
        }),
      }),
    }) as unknown as ExecutionContext;

  it.each([UserRole.STUDENT, UserRole.TEACHER])(
    '%s recibe 403 en todas las rutas de medios',
    (role) => {
      for (const ruta of rutas)
        expect(() => guard.canActivate(ctx(ruta, role))).toThrowError(ForbiddenException);
    },
  );
});
