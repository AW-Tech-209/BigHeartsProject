import { type AdminUsuariosResponse, UserRole, UserStatus } from '@academia/types';
import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRoutes } from '@/app/router';
import {
  crearUsuario,
  generarContrasenaTemporal,
  getAdminUsuarios,
} from '@/features/admin/api/usuarios';
import { construirBloqueCredenciales } from '@/features/admin/lib/credenciales';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders } from '@/test/render-con-providers';
import { darSesion, usuarioDePrueba } from '@/test/sesion';

vi.mock('@/features/admin/api/usuarios', () => ({
  getAdminUsuarios: vi.fn(),
  crearUsuario: vi.fn(),
  generarContrasenaTemporal: vi.fn(),
}));

const lista: AdminUsuariosResponse = {
  items: [
    {
      id: 'u1',
      firstName: 'Luis',
      lastName: 'Pérez',
      email: 'luis@correo.com',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      pendienteDePrimerIngreso: true,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

const cuenta = {
  usuario: {
    ...usuarioDePrueba(UserRole.STUDENT),
    id: 'u2',
    firstName: 'Marta',
    lastName: 'Ríos',
    email: 'marta@correo.com',
  },
  contrasenaTemporal: 'Abc-1234-xyz',
  caducaEl: '2026-10-07T17:00:00.000Z',
};

const montar = () => renderConProviders(<AppRoutes />, { ruta: '/admin/usuarios' });

async function crearCuenta(user: ReturnType<typeof montar>['user']) {
  await user.click(await screen.findByRole('button', { name: 'Crear cuenta' }));
  await user.type(screen.getByLabelText(/Nombre/), 'Marta');
  await user.type(screen.getByLabelText(/Apellido/), 'Ríos');
  await user.type(screen.getByLabelText(/Correo/), 'marta@correo.com');
  await user.click(screen.getByRole('radio', { name: /Estudiante/ }));
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAdminUsuarios).mockResolvedValue(lista);
  vi.mocked(crearUsuario).mockResolvedValue(cuenta);
  vi.mocked(generarContrasenaTemporal).mockResolvedValue(cuenta);
});

describe('construirBloqueCredenciales', () => {
  it('produce el bloque exacto, con la hora de Colombia', () => {
    const lineas = construirBloqueCredenciales({
      nombre: 'Marta',
      correo: 'marta@correo.com',
      contrasena: 'Abc-1234-xyz',
      caducaEl: cuenta.caducaEl,
      origen: 'https://app.test',
    }).split('\n');

    expect(lineas.slice(0, 5)).toEqual([
      'Hola Marta, esta es tu cuenta de BigHearts.',
      'Entra en: https://app.test/login',
      'Correo: marta@correo.com',
      'Contraseña temporal: Abc-1234-xyz',
      'Al entrar te pediremos crear tu propia contraseña.',
    ]);
    expect(lineas[5]).toMatch(
      /^Esta contraseña caduca el 7 de octubre de 2026.*12:00.*\(hora de Colombia\)\.$/,
    );
  });
});

describe('UsuariosPage — autorización', () => {
  it.each([UserRole.STUDENT, UserRole.TEACHER])('%s no ve el destino ni la pantalla', (rol) => {
    darSesion(rol);
    montar();

    expect(
      screen.getByRole('heading', { level: 1, name: 'No tienes acceso a esta página' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Usuarios' })).toBeNull();
    expect(getAdminUsuarios).not.toHaveBeenCalled();
  });
});

describe('UsuariosPage — admin', () => {
  beforeEach(() => darSesion(UserRole.ADMIN));

  it('lista con rol, estado y «Pendiente de primer ingreso»', async () => {
    montar();

    expect(await screen.findByText('Luis Pérez')).toBeInTheDocument();
    const fila = within(screen.getByRole('list', { name: 'Usuarios de la academia' }));
    expect(fila.getByText('Estudiante')).toBeInTheDocument();
    expect(fila.getByText('Activa')).toBeInTheDocument();
    expect(fila.getByText('Pendiente de primer ingreso')).toBeInTheDocument();
  });

  it('crear muestra el bloque con los datos exactos y copia todo con un clic', async () => {
    const { user } = montar();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    await crearCuenta(user);

    const bloque = construirBloqueCredenciales({
      nombre: 'Marta',
      correo: 'marta@correo.com',
      contrasena: 'Abc-1234-xyz',
      caducaEl: cuenta.caducaEl,
      origen: window.location.origin,
    });
    expect(await screen.findByText('Esta contraseña no se volverá a mostrar')).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.tagName === 'PRE' && el.textContent === bloque),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copiar credenciales' }));

    expect(writeText).toHaveBeenCalledWith(bloque);
    expect(await screen.findByRole('button', { name: 'Copiado' })).toBeInTheDocument();
  });

  it('cerrar sin copiar pide confirmar dentro del mismo diálogo', async () => {
    const { user } = montar();
    await crearCuenta(user);
    await screen.findByText('Esta contraseña no se volverá a mostrar');

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(screen.getByText('¿Cerrar sin copiar?')).toBeInTheDocument();
    expect(screen.getAllByRole('alertdialog')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Cerrar sin copiar' }));
    expect(screen.queryByText('Abc-1234-xyz')).toBeNull();
  });

  it('un correo repetido se dice junto al campo', async () => {
    const { ApiClientError } = await import('@/lib/api-error');
    vi.mocked(crearUsuario).mockRejectedValue(
      new ApiClientError({ code: 'EMAIL_ALREADY_EXISTS', message: 'x' }, 409),
    );
    const { user } = montar();
    await crearCuenta(user);

    expect(await screen.findByText('Ya hay una cuenta con ese correo.')).toBeInTheDocument();
  });

  it('generar contraseña nueva confirma y termina en el diálogo de credenciales', async () => {
    const { user } = montar();
    await user.click(
      await screen.findByRole('button', { name: 'Generar contraseña nueva para Luis Pérez' }),
    );
    expect(screen.getByText(/Se cerrarán sus sesiones abiertas/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Generar contraseña' }));

    expect(generarContrasenaTemporal).toHaveBeenCalledWith('u1');
    expect(await screen.findByText('Esta contraseña no se volverá a mostrar')).toBeInTheDocument();
  });

  it('axe limpio', async () => {
    const { container } = montar();
    await screen.findByText('Luis Pérez');
    await esperarSinFallosDeAccesibilidad(container);
  });
});
