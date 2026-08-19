import { UserRole } from '@academia/types';
import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { darSesion } from '@/test/sesion';
import { AppShell } from './app-shell';

/**
 * El shell es la única pieza que ven las seis pantallas, así que aquí se vigila
 * lo que, si se rompe, se rompe en toda la aplicación a la vez: qué destinos ve
 * cada rol, que ninguno esté escondido detrás de un botón, y que el activo se
 * distinga sin depender del color.
 */

const TEMAS: Tema[] = ['light', 'dark', 'hc'];

const DESTINOS_ESPERADOS: Record<UserRole, string[]> = {
  [UserRole.STUDENT]: ['Aulas', 'Mis clases', 'Perfil'],
  [UserRole.TEACHER]: ['Aulas', 'Mis aulas', 'Perfil'],
  [UserRole.ADMIN]: ['Aulas', 'Panel', 'Perfil'],
};

/**
 * Fija el ancho de la ventana para `useEsMovil`.
 *
 * `setup.ts` solo instala el stub de `matchMedia` si no existe, y devuelve
 * siempre `false`. Aquí hace falta poder decir «esto es un móvil», así que se
 * sustituye la función entera y se restaura al terminar.
 */
function simularViewport(esMovil: boolean) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: esMovil,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

const matchMediaOriginal = window.matchMedia;

beforeEach(() => {
  simularViewport(false);
});

afterEach(() => {
  window.matchMedia = matchMediaOriginal;
});

describe('AppShell — navegación por rol', () => {
  it.each([UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN])(
    'un %s ve exactamente sus destinos',
    (role) => {
      darSesion(role);
      renderConProviders(<AppShell>Contenido</AppShell>);

      const navegacion = screen.getByRole('navigation', { name: 'Secciones' });
      const enlaces = within(navegacion)
        .getAllByRole('link')
        .map((enlace) => enlace.textContent);

      expect(enlaces).toEqual(DESTINOS_ESPERADOS[role]);
    },
  );

  it('sin sesión no ofrece destinos: la home pública solo lleva marca y contenido', () => {
    darSesion(null);
    renderConProviders(<AppShell>Contenido</AppShell>);

    expect(screen.queryByRole('navigation', { name: 'Secciones' })).toBeNull();
    expect(screen.getByRole('link', { name: 'BigHearts' })).toBeInTheDocument();
  });

  it('con `conNavegacion={false}` no hay navegación aunque haya sesión (login y registro)', () => {
    darSesion(UserRole.STUDENT);
    renderConProviders(<AppShell conNavegacion={false}>Contenido</AppShell>);

    expect(screen.queryByRole('navigation', { name: 'Secciones' })).toBeNull();
  });
});

describe('AppShell — sin estado oculto', () => {
  it('en escritorio los tres destinos se ven sin pulsar nada', () => {
    darSesion(UserRole.STUDENT);
    renderConProviders(<AppShell>Contenido</AppShell>);

    // Sin una sola interacción previa: los enlaces ya están ahí.
    const navegacion = screen.getByRole('navigation', { name: 'Secciones' });
    expect(within(navegacion).getAllByRole('link')).toHaveLength(3);
  });

  it('no existe ningún control que despliegue la navegación', () => {
    darSesion(UserRole.STUDENT);
    const { container } = renderConProviders(<AppShell>Contenido</AppShell>);

    // Un desplegable siempre deja huella en el DOM: `aria-expanded` para decir
    // si está abierto, `aria-haspopup` para anunciar que hay algo detrás. Si no
    // hay ninguno de los dos, no hay nada escondido.
    expect(container.querySelector('[aria-expanded]')).toBeNull();
    expect(container.querySelector('[aria-haspopup]')).toBeNull();

    // El único botón de la barra es el de salir.
    const botones = screen.getAllByRole('button').map((boton) => boton.textContent);
    expect(botones).toEqual(['Cerrar sesión']);
  });

  it('en móvil la barra inferior está siempre visible y tampoco tiene toggle', () => {
    simularViewport(true);
    darSesion(UserRole.STUDENT);
    const { container } = renderConProviders(<AppShell>Contenido</AppShell>);

    const navegacion = screen.getByRole('navigation', { name: 'Secciones' });
    expect(
      within(navegacion)
        .getAllByRole('link')
        .map((e) => e.textContent),
    ).toEqual(['Aulas', 'Mis clases', 'Perfil']);
    expect(navegacion.className).toContain('fixed');
    expect(navegacion.className).toContain('bottom-0');
    expect(container.querySelector('[aria-expanded]')).toBeNull();
  });

  it('en móvil cada destino lleva ícono Y texto, nunca ícono solo', () => {
    simularViewport(true);
    darSesion(UserRole.STUDENT);
    renderConProviders(<AppShell>Contenido</AppShell>);

    const navegacion = screen.getByRole('navigation', { name: 'Secciones' });

    for (const enlace of within(navegacion).getAllByRole('link')) {
      expect(enlace.textContent?.trim()).not.toBe('');
      expect(enlace.querySelector('svg')).not.toBeNull();
    }
  });

  it('solo hay una navegación a la vez: los enlaces no se duplican en el árbol accesible', () => {
    darSesion(UserRole.STUDENT);
    renderConProviders(<AppShell>Contenido</AppShell>);

    // `getByRole` falla si encuentra dos. Es justo lo que queremos vigilar: con
    // las dos barras montadas a la vez, un lector de pantalla leería cada
    // destino dos veces.
    expect(screen.getByRole('link', { name: 'Aulas' })).toBeInTheDocument();
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
  });
});

describe('AppShell — el destino activo', () => {
  it.each(TEMAS)('se distingue por borde de 2px además del color, en el tema %s', (tema) => {
    darSesion(UserRole.STUDENT);
    renderConProviders(<AppShell>Contenido</AppShell>, { tema, ruta: '/aulas' });

    const activo = screen.getByRole('link', { name: 'Aulas' });

    // La señal semántica, la que oye quien navega con lector de pantalla.
    expect(activo).toHaveAttribute('aria-current', 'page');
    // La señal no cromática, la que sobrevive al alto contraste.
    expect(activo.className).toContain('border-b-2');
    expect(activo.className).toContain('border-primary');

    const inactivo = screen.getByRole('link', { name: 'Perfil' });
    expect(inactivo).not.toHaveAttribute('aria-current');
    expect(inactivo.className).toContain('border-transparent');
  });

  it('en móvil el borde de 2px va arriba, que es donde se ve', () => {
    simularViewport(true);
    darSesion(UserRole.STUDENT);
    renderConProviders(<AppShell>Contenido</AppShell>, { ruta: '/aulas' });

    const activo = screen.getByRole('link', { name: 'Aulas' });

    expect(activo).toHaveAttribute('aria-current', 'page');
    expect(activo.className).toContain('border-t-2');
    expect(activo.className).toContain('border-primary');
  });
});

describe('AppShell — skip-link y contenido', () => {
  it('el skip-link es el primer elemento enfocable y apunta al <main>', async () => {
    darSesion(UserRole.STUDENT);
    const { user, container } = renderConProviders(<AppShell>Contenido</AppShell>);

    await user.tab();

    const skipLink = screen.getByRole('link', { name: 'Saltar al contenido' });
    expect(skipLink).toHaveFocus();

    const main = container.querySelector('main');
    expect(skipLink).toHaveAttribute('href', `#${main?.id}`);
    // Sin `tabIndex="-1"` el foco no entraría en `<main>` en todos los
    // navegadores: el destino de un salto tiene que poder recibir foco.
    expect(main).toHaveAttribute('tabindex', '-1');
  });
});

describe('AppShell — accesibilidad', () => {
  it.each(TEMAS)('no tiene violaciones en el tema %s', async (tema) => {
    darSesion(UserRole.STUDENT);
    const { container } = renderConProviders(
      <AppShell>
        <h1>Una página</h1>
      </AppShell>,
      { tema },
    );

    await esperarSinFallosDeAccesibilidad(container);
  });

  it('tampoco las tiene en móvil', async () => {
    simularViewport(true);
    darSesion(UserRole.TEACHER);
    const { container } = renderConProviders(
      <AppShell>
        <h1>Una página</h1>
      </AppShell>,
    );

    await esperarSinFallosDeAccesibilidad(container);
  });
});
