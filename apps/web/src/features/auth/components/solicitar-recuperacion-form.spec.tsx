import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderConProviders } from '@/test/render-con-providers';
import { forgotPassword } from '../api/forgot-password';
import { SolicitarRecuperacionForm } from './solicitar-recuperacion-form';

vi.mock('../api/forgot-password', () => ({ forgotPassword: vi.fn() }));
const forgotPasswordMock = vi.mocked(forgotPassword);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SolicitarRecuperacionForm', () => {
  it('se rellena y envía con el teclado, y llama al endpoint con el email', async () => {
    forgotPasswordMock.mockResolvedValue({ requested: true });
    const onEnviado = vi.fn();
    const { user } = renderConProviders(<SolicitarRecuperacionForm onEnviado={onEnviado} />);

    await user.tab();
    expect(screen.getByLabelText(/^Email/)).toHaveFocus();
    await user.keyboard('ana@correo.com');
    await user.keyboard('{Enter}');

    expect(forgotPasswordMock.mock.calls[0]?.[0]).toEqual({ email: 'ana@correo.com' });
    await vi.waitFor(() => expect(onEnviado).toHaveBeenCalled());
  });

  it('valida el email en cliente antes de llamar al endpoint', async () => {
    const { user } = renderConProviders(<SolicitarRecuperacionForm onEnviado={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect(await screen.findByText('El email es obligatorio.')).toBeInTheDocument();
    expect(forgotPasswordMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^Email/)).toHaveFocus();
  });

  it('muestra un aviso si el envío falla', async () => {
    forgotPasswordMock.mockRejectedValue(new Error('offline'));
    const { user } = renderConProviders(<SolicitarRecuperacionForm onEnviado={vi.fn()} />);

    await user.type(screen.getByLabelText(/^Email/), 'ana@correo.com');
    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/No pudimos enviar el enlace/);
  });
});
