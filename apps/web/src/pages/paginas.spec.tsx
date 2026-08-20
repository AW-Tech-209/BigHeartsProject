import { UserRole } from '@academia/types';
import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPendingTeachers } from '@/features/admin/api/get-pending-teachers';
import { getProfile } from '@/features/profile/api/get-profile';
import { httpClient } from '@/lib/http-client';
import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { darSesion, usuarioDePrueba } from '@/test/sesion';
import { AdminPage } from './AdminPage';
import { AulasPage } from './AulasPage';
import { HomePage } from './HomePage';
import { LoginPage } from './LoginPage';
import { MisAulasPage } from './MisAulasPage';
import { MisClasesPage } from './MisClasesPage';
import { NotFoundPage } from './NotFoundPage';
import { PanelPage } from './PanelPage';
import { PerfilPage } from './PerfilPage';
import { RegisterPage } from './RegisterPage';

/**
 * El contrato estructural de TODAS las pantallas, en un solo sitio.
 *
 * Tres cosas por página y por tema: que haya exactamente un `<h1>`, que el foco
 * aterrice en él al montar —una navegación en una SPA es silenciosa, y sin ese
 * salto quien usa lector de pantalla no se entera de que cambió de pantalla— y
 * que `axe` no encuentre nada.
 *
 * Se mockean las dos fronteras de red, no axios: es donde acaba el dominio.
 */
vi.mock('@/lib/http-client', () => ({ httpClient: { get: vi.fn() } }));
vi.mock('@/features/profile/api/get-profile', () => ({ getProfile: vi.fn() }));
vi.mock('@/features/admin/api/get-pending-teachers', () => ({ getPendingTeachers: vi.fn() }));

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

type CasoDePagina = {
  nombre: string;
  elemento: ReactElement;
  h1: string;
  /** Rol con el que hay que montar, o `null` para una pantalla pública. */
  rol: UserRole | null;
};

/** Las seis pantallas que ya existían, más las tres que estrena esta HU. */
const PAGINAS: CasoDePagina[] = [
  { nombre: 'HomePage', elemento: <HomePage />, h1: 'Academia', rol: null },
  { nombre: 'LoginPage', elemento: <LoginPage />, h1: 'Inicia sesión', rol: null },
  { nombre: 'RegisterPage', elemento: <RegisterPage />, h1: 'Crea tu cuenta', rol: null },
  { nombre: 'PanelPage', elemento: <PanelPage />, h1: 'Hola, Ana', rol: UserRole.STUDENT },
  { nombre: 'PerfilPage', elemento: <PerfilPage />, h1: 'Tu perfil', rol: UserRole.STUDENT },
  {
    nombre: 'NotFoundPage',
    elemento: <NotFoundPage />,
    h1: 'No encontramos esta página',
    rol: null,
  },
  { nombre: 'AulasPage', elemento: <AulasPage />, h1: 'Aulas', rol: UserRole.STUDENT },
  {
    nombre: 'MisClasesPage',
    elemento: <MisClasesPage />,
    h1: 'Mis clases',
    rol: UserRole.STUDENT,
  },
  { nombre: 'MisAulasPage', elemento: <MisAulasPage />, h1: 'Mis aulas', rol: UserRole.TEACHER },
  {
    nombre: 'AdminPage',
    elemento: <AdminPage />,
    h1: 'Profesores pendientes',
    rol: UserRole.ADMIN,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(httpClient.get).mockResolvedValue({ status: 'ok', uptime: 1 });
  vi.mocked(getProfile).mockResolvedValue({ user: usuarioDePrueba() });
  // La cola vacía es el estado normal de esta pantalla; el resto de sus estados
  // se prueban en `AdminPage.spec.tsx`.
  vi.mocked(getPendingTeachers).mockResolvedValue({ teachers: [] });
});

describe.each(PAGINAS)('$nombre', ({ elemento, h1, rol }) => {
  it('tiene exactamente un <h1>, y es el título de la cabecera', () => {
    darSesion(rol);
    renderConProviders(elemento);

    const encabezados = screen.getAllByRole('heading', { level: 1 });

    expect(encabezados).toHaveLength(1);
    expect(encabezados[0]).toHaveTextContent(h1);
  });

  it('lleva el foco al <h1> al montar', () => {
    darSesion(rol);
    renderConProviders(elemento);

    expect(screen.getByRole('heading', { level: 1, name: h1 })).toHaveFocus();
  });

  it('pone el título del documento', () => {
    darSesion(rol);
    renderConProviders(elemento);

    expect(document.title).toMatch(/ · BigHearts$/);
  });

  it('monta el shell: skip-link primero y <main> como destino del salto', () => {
    darSesion(rol);
    const { container } = renderConProviders(elemento);

    const skipLink = screen.getByRole('link', { name: 'Saltar al contenido' });
    const main = container.querySelector('main');

    expect(skipLink).toHaveAttribute('href', `#${main?.id}`);
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  it.each(TEMAS)('no tiene violaciones de accesibilidad en el tema %s', async (tema) => {
    darSesion(rol);
    const { container } = renderConProviders(elemento, { tema });

    await esperarSinFallosDeAccesibilidad(container);
  });
});

describe('Login y registro — shell sin navegación', () => {
  it.each([
    ['LoginPage', <LoginPage key="login" />],
    ['RegisterPage', <RegisterPage key="registro" />],
  ] as const)('%s no ofrece destinos aunque quedara una sesión abierta', (_nombre, elemento) => {
    // Caso real: la sesión sigue en el store y el usuario vuelve a /login. La
    // pantalla no debe pintar una navegación que aún no le corresponde.
    darSesion(UserRole.STUDENT);
    renderConProviders(elemento);

    expect(screen.queryByRole('navigation', { name: 'Secciones' })).toBeNull();
  });
});
