import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { LoginDto } from './login.dto';

/** Valida un payload plano contra el DTO y devuelve los campos con error. */
async function invalidFields(payload: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(LoginDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

const validPayload = { email: 'user@academia.local', password: 'cualquier-cosa' };

describe('LoginDto (validación)', () => {
  it('acepta un payload válido', async () => {
    expect(await invalidFields(validPayload)).toHaveLength(0);
  });

  it('normaliza el email a minúsculas y sin espacios', () => {
    const dto = plainToInstance(LoginDto, { email: '  USER@Academia.Local  ', password: 'x' });
    expect(dto.email).toBe('user@academia.local');
  });

  it('rechaza un email mal formado', async () => {
    expect(await invalidFields({ ...validPayload, email: 'no-es-email' })).toContain('email');
  });

  it('exige contraseña, pero NO impone reglas de complejidad (a diferencia del registro)', async () => {
    expect(await invalidFields({ ...validPayload, password: '' })).toContain('password');
    // Una contraseña "débil" es válida para login: se comprueba contra el hash.
    expect(await invalidFields({ ...validPayload, password: 'abc' })).toHaveLength(0);
  });
});
