import { ApiErrorCode } from '@academia/types';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@/lib/api-error';
import { renderConProviders } from '@/test/render-con-providers';
import { resetPassword } from '../api/reset-password';
import { NuevaContrasenaForm } from './nueva-contrasena-form';

vi.mock('../api/reset-password', () => ({ resetPassword: vi.fn() }));
const resetPasswordMock = vi.mocked(resetPassword);

beforeEach(() => {
  vi.clearAllMocks();
});

function errorApi(code: string, details?: Record<string, unknown>) {
  return new ApiClientError({ code, message: code, details }, 400);
}

describe('NuevaContrasenaForm', () => {
  it('se rellena y envía con el teclado, y llama al endpoint con el token y la contraseña', async () => {
    resetPasswordMock.mockResolvedValue({ reset: true });
    const onHecho = vi.fn();
    const { user } = renderConProviders(<NuevaContrasenaForm token="tok-123" onHecho={onHecho} />);

    await user.tab();
    expect(screen.getByLabelText(/^Contraseña nueva/)).toHaveFocus();
    await user.keyboard('Password123!');
    await user.keyboard('{Enter}');

    expect(resetPasswordMock.mock.calls[0]?.[0]).toEqual({
      token: 'tok-123',
      password: 'Password123!',
    });
    await vi.waitFor(() => expect(onHecho).toHaveBeenCalled());
  });

  it('valida la fuerza de la contraseña en cliente', async () => {
    const { user } = renderConProviders(<NuevaContrasenaForm token="t" onHecho={vi.fn()} />);

    await user.type(screen.getByLabelText(/^Contraseña nueva/), 'abc');
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña nueva' }));

    expect(
      await screen.findByText('La contraseña debe tener al menos 8 caracteres.'),
    ).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it('ante un token caducado explica y ofrece pedir otro enlace', async () => {
    resetPasswordMock.mockRejectedValue(errorApi(ApiErrorCode.PASSWORD_RESET_TOKEN_EXPIRED));
    const { user } = renderConProviders(<NuevaContrasenaForm token="t" onHecho={vi.fn()} />);

    await user.type(screen.getByLabelText(/^Contraseña nueva/), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña nueva' }));

    expect(await screen.findByText('El enlace caducó')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pide uno nuevo' })).toHaveAttribute(
      'href',
      '/recuperar-contrasena',
    );
  });

  it('ante un token inválido ofrece pedir otro enlace', async () => {
    resetPasswordMock.mockRejectedValue(errorApi(ApiErrorCode.PASSWORD_RESET_TOKEN_INVALID));
    const { user } = renderConProviders(<NuevaContrasenaForm token="t" onHecho={vi.fn()} />);

    await user.type(screen.getByLabelText(/^Contraseña nueva/), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña nueva' }));

    expect(await screen.findByText('El enlace ya no sirve')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pide uno nuevo' })).toBeInTheDocument();
  });

  it('mapea VALIDATION_ERROR del servidor al error junto al campo', async () => {
    resetPasswordMock.mockRejectedValue(
      errorApi(ApiErrorCode.VALIDATION_ERROR, {
        fields: [{ field: 'password', message: 'La contraseña es demasiado común.' }],
      }),
    );
    const { user } = renderConProviders(<NuevaContrasenaForm token="t" onHecho={vi.fn()} />);

    await user.type(screen.getByLabelText(/^Contraseña nueva/), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña nueva' }));

    expect(await screen.findByText('La contraseña es demasiado común.')).toBeInTheDocument();
  });
});
