import { UserRole, UserStatus, type AuthSession } from '@academia/types';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderConProviders } from '@/test/render-con-providers';
import { useAuthStore } from '@/stores/auth-store';
import { login } from '../api/login';
import { LoginForm } from './login-form';

/**
 * PATRÓN A COPIAR — componente con interacción de teclado.
 *
 * Tres cosas que este archivo hace a propósito y conviene imitar:
 *
 *  1. Se consulta por **rol accesible y etiqueta**, nunca por `data-testid` ni
 *     por clase CSS. Así el test falla cuando la accesibilidad se rompe, que es
 *     justo lo que queremos que vigile.
 *  2. Se interactúa con `user-event` (`user.tab()`, `user.keyboard()`), no
 *     disparando eventos a mano con `fireEvent`. Un `fireEvent.change` pasa por
 *     encima de la realidad: no comprueba que el elemento sea alcanzable con
 *     Tab, ni que esté habilitado, ni que reciba el foco. En un producto para
 *     personas sordas el recorrido con teclado no es un detalle.
 *  3. Se mockea la capa `api/`, no axios. Es la frontera del dominio.
 */

// El módulo real llama a `httpClient.post`. Mockeamos la función exportada, no
// axios, para que el test no dependa de cómo se hace la petición.
vi.mock('../api/login', () => ({ login: vi.fn() }));

const loginMock = vi.mocked(login);

/**
 * Sesión de ejemplo. Importa `UserRole` y `UserStatus` de `@academia/types`
 * como VALORES en tiempo de ejecución, no como tipos — que es exactamente lo
 * que la trampa nº 1 del README rompe cuando la config de test no hereda la de
 * Vite (el paquete se compila a CommonJS).
 */
const SESION: AuthSession = {
  user: {
    id: 'user-1',
    email: 'ana@correo.com',
    firstName: 'Ana',
    lastName: 'García',
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    hearingLossLevel: null,
    communicationPreference: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  accessToken: 'access.token.jwt',
  expiresIn: 900,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Zustand vive fuera de React: sin esto, el login de un test deja la sesión
  // abierta para el siguiente.
  useAuthStore.setState({ status: 'anonymous', user: null, accessToken: null, endReason: 'none' });
});

describe('LoginForm — recorrido con teclado', () => {
  it('permite rellenar y enviar el formulario entero sin tocar el ratón', async () => {
    loginMock.mockResolvedValue(SESION);
    const onLoggedIn = vi.fn();
    const { user } = renderConProviders(<LoginForm onLoggedIn={onLoggedIn} />);

    // Tab llega al primer campo: si un campo no fuera alcanzable, esto falla.
    await user.tab();
    expect(screen.getByLabelText(/^Email/)).toHaveFocus();
    await user.keyboard('ana@correo.com');

    await user.tab(); // «¿Olvidaste tu contraseña?»
    await user.tab();
    expect(screen.getByLabelText(/^Contraseña/)).toHaveFocus();
    await user.keyboard('Password123!');

    // Enter dentro de un campo de texto envía el formulario.
    await user.keyboard('{Enter}');

    // Solo el primer argumento: React Query añade un segundo con su contexto
    // (`client`, `meta`, `mutationKey`) que no es asunto de este test.
    expect(loginMock.mock.calls[0]?.[0]).toEqual({
      email: 'ana@correo.com',
      password: 'Password123!',
    });
    await vi.waitFor(() => expect(onLoggedIn).toHaveBeenCalledWith(SESION));
  });

  it('alcanza el botón de enviar con Tab y lo activa con Enter', async () => {
    const onLoggedIn = vi.fn();
    const { user } = renderConProviders(<LoginForm onLoggedIn={onLoggedIn} />);

    await user.tab(); // Email
    await user.tab(); // ¿Olvidaste tu contraseña?
    await user.tab(); // Contraseña
    await user.tab(); // Mostrar contraseña
    await user.tab(); // Iniciar sesión

    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toHaveFocus();
    await user.keyboard('{Enter}');

    // Formulario vacío: no se llama a la API, se muestran los errores.
    expect(loginMock).not.toHaveBeenCalled();
    expect(await screen.findByText('El email es obligatorio.')).toBeInTheDocument();
  });

  it('el enlace «¿Olvidaste tu contraseña?» es alcanzable con Tab y lleva a la recuperación', async () => {
    const { user } = renderConProviders(<LoginForm onLoggedIn={vi.fn()} />);

    const enlace = screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' });
    expect(enlace).toHaveAttribute('href', '/recuperar-contrasena');

    await user.tab(); // Email
    await user.tab(); // enlace
    expect(enlace).toHaveFocus();
  });

  it('el botón de mostrar contraseña se activa con teclado y anuncia su estado', async () => {
    const { user } = renderConProviders(<LoginForm onLoggedIn={vi.fn()} />);

    const contrasena = screen.getByLabelText(/^Contraseña/);
    expect(contrasena).toHaveAttribute('type', 'password');

    const mostrar = screen.getByRole('button', { name: 'Mostrar contraseña' });
    expect(mostrar).toHaveAttribute('aria-pressed', 'false');

    mostrar.focus();
    await user.keyboard('{Enter}');

    expect(contrasena).toHaveAttribute('type', 'text');
    // El estado cambia también en el nombre accesible, no solo en el ícono:
    // codificación triple, aquí en su versión para lector de pantalla.
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('LoginForm — errores', () => {
  it('lleva el foco al primer campo con error y lo anuncia por la región viva', async () => {
    const { user } = renderConProviders(<LoginForm onLoggedIn={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(screen.getByLabelText(/^Email/)).toHaveFocus();
    expect(screen.getByLabelText(/^Email/)).toHaveAttribute('aria-invalid', 'true');
    // Los dos errores son alertas visibles, no solo un borde rojo.
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(
      await screen.findByText('El formulario tiene 2 errores. Revisa los campos marcados.'),
    ).toBeInTheDocument();
  });

  it('borra el error del campo en cuanto el usuario empieza a corregirlo', async () => {
    const { user } = renderConProviders(<LoginForm onLoggedIn={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(screen.getByText('El email es obligatorio.')).toBeInTheDocument();

    await user.keyboard('a'); // El foco ya está en el email.

    expect(screen.queryByText('El email es obligatorio.')).not.toBeInTheDocument();
  });
});

describe('LoginForm — los tres modos de color', () => {
  // El mismo componente, montado en los tres temas que define `index.css`.
  // Lo que se comprueba es que la clase del tema no cambia lo que el usuario
  // puede hacer: la accesibilidad no depende del modo de color.
  it.each([
    ['light', null],
    ['dark', 'dark'],
    ['hc', 'hc'],
  ] as const)('se monta y es operable en el tema %s', async (tema, claseEsperada) => {
    loginMock.mockResolvedValue(SESION);
    const onLoggedIn = vi.fn();
    const { user, container } = renderConProviders(<LoginForm onLoggedIn={onLoggedIn} />, { tema });

    expect(container.querySelector(claseEsperada ? `.${claseEsperada}` : 'form')).not.toBeNull();

    await user.type(screen.getByLabelText(/^Email/), 'ana@correo.com');
    await user.type(screen.getByLabelText(/^Contraseña/), 'Password123!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await vi.waitFor(() => expect(onLoggedIn).toHaveBeenCalledWith(SESION));
  });
});
