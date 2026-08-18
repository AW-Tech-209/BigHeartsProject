import { UserRole, UserStatus } from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser } from '../auth/auth.types';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersController } from './users.controller';
import type { UsersService } from './users.service';

/** Usuario del token, tal como lo planta el JwtAuthGuard en `request.user`. */
const tokenUser: AuthenticatedUser = {
  id: 'usuario-del-token',
  email: 'user@academia.local',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

function setup() {
  const getProfile = vi.fn().mockResolvedValue({ id: 'usuario-del-token' });
  const updateProfile = vi.fn().mockResolvedValue({ id: 'usuario-del-token' });
  const service = { getProfile, updateProfile } as unknown as UsersService;

  return { controller: new UsersController(service), getProfile, updateProfile };
}

/**
 * Estos tests defienden la invariante de autorización de la HU-103 (AC6): el id
 * que llega al service sale SIEMPRE del token. No hay parámetro de ruta ni
 * lectura del cuerpo que puedan sustituirlo.
 */
describe('UsersController', () => {
  it('GET /users/me lee el perfil del id del token', async () => {
    const { controller, getProfile } = setup();

    await controller.getMe(tokenUser);

    expect(getProfile).toHaveBeenCalledWith('usuario-del-token');
  });

  it('PATCH /users/me edita el perfil del id del token', async () => {
    const { controller, updateProfile } = setup();
    const dto = { firstName: 'Ana', lastName: 'Ruiz' } as UpdateProfileDto;

    await controller.updateMe(tokenUser, dto);

    expect(updateProfile).toHaveBeenCalledWith('usuario-del-token', dto);
  });

  it('un `id` ajeno en el cuerpo no cambia a quién se edita (AC6)', async () => {
    const { controller, updateProfile } = setup();
    const dto = {
      firstName: 'Ana',
      lastName: 'Ruiz',
      id: 'victima',
      email: 'victima@academia.local',
    } as unknown as UpdateProfileDto;

    await controller.updateMe(tokenUser, dto);

    // El primer argumento —el único que decide QUÉ fila se toca— es el del token.
    expect(updateProfile.mock.calls[0]![0]).toBe('usuario-del-token');
  });

  it('devuelve el perfil envuelto en `{ user }`, como declara ProfileResponse', async () => {
    const { controller } = setup();

    await expect(controller.getMe(tokenUser)).resolves.toEqual({
      user: { id: 'usuario-del-token' },
    });
  });
});
