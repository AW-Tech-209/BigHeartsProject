import { UserRole } from '@academia/types';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { RegisterDto } from './register.dto';

/** Valida un payload plano contra el DTO y devuelve los campos con error. */
async function invalidFields(payload: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(RegisterDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

const validPayload = {
  email: 'nuevo@academia.local',
  password: 'Password123',
  firstName: 'Nombre',
  lastName: 'Apellido',
  role: UserRole.STUDENT,
};

describe('RegisterDto (validación)', () => {
  it('acepta un payload válido', async () => {
    expect(await invalidFields(validPayload)).toHaveLength(0);
  });

  it('rechaza un rol inválido (ADMIN no puede auto-registrarse)', async () => {
    expect(await invalidFields({ ...validPayload, role: UserRole.ADMIN })).toContain('role');
  });

  it('rechaza un rol que no existe', async () => {
    expect(await invalidFields({ ...validPayload, role: 'DIRECTOR' })).toContain('role');
  });

  it('rechaza un email mal formado', async () => {
    expect(await invalidFields({ ...validPayload, email: 'no-es-un-email' })).toContain('email');
  });

  it('rechaza una contraseña demasiado corta', async () => {
    expect(await invalidFields({ ...validPayload, password: 'Ab1' })).toContain('password');
  });

  it('rechaza una contraseña sin números', async () => {
    expect(await invalidFields({ ...validPayload, password: 'solo-letras' })).toContain('password');
  });

  it('acepta preferencias de accesibilidad válidas y rechaza las inválidas', async () => {
    expect(await invalidFields({ ...validPayload, hearingLossLevel: 'SEVERE' })).toHaveLength(0);
    expect(await invalidFields({ ...validPayload, hearingLossLevel: 'INVENTADO' })).toContain(
      'hearingLossLevel',
    );
  });
});
