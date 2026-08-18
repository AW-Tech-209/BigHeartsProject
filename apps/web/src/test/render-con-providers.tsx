import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { LiveAnnouncerProvider } from '@/components/live-announcer';

/**
 * Los tres modos de color que define `src/index.css`.
 *
 * `light` no lleva clase (es `:root`); `dark` y `hc` se activan con una clase
 * ancestro, porque las variantes de Tailwind están declaradas como
 * `&:is(.dark *)` y `&:is(.hc *)`.
 */
export type Tema = 'light' | 'dark' | 'hc';

const CLASE_POR_TEMA: Record<Tema, string> = {
  light: '',
  dark: 'dark',
  hc: 'hc',
};

type OpcionesRender = Omit<RenderOptions, 'wrapper'> & {
  /** Modo de color en el que montar el componente. Por defecto `light`. */
  tema?: Tema;
  /** Ruta inicial del router de memoria. Por defecto `/`. */
  ruta?: string;
};

type ResultadoRender = RenderResult & {
  /** Sesión de `user-event` ya inicializada, para interactuar como un humano. */
  user: ReturnType<typeof userEvent.setup>;
};

/**
 * Monta un componente con los providers que la app le da en producción.
 *
 * NO reutiliza `<AppProviders>` a propósito: ese componente incluye
 * `useSessionBootstrap()`, que dispara `POST /auth/refresh` nada más montar.
 * Un test no debe salir a la red, y un fallo de red ahí aparecería como un
 * error incomprensible en un test que no va de sesiones.
 *
 * Tampoco usa el `queryClient` singleton de `@/lib/query-client`: es un objeto
 * compartido con caché, y dos tests que consultaran la misma query se
 * contaminarían entre sí según el orden en que corrieran.
 *
 * Ejemplo:
 * ```tsx
 * const { user } = renderConProviders(<LoginForm onLoggedIn={vi.fn()} />, { tema: 'dark' });
 * await user.tab();
 * ```
 */
export function renderConProviders(
  ui: ReactElement,
  options: OpcionesRender = {},
): ResultadoRender {
  const { tema = 'light', ruta = '/', ...rest } = options;

  const queryClient = new QueryClient({
    defaultOptions: {
      // Sin reintentos: un test que provoca un error a propósito no debe
      // esperar tres rondas de backoff para verlo.
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Providers({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <LiveAnnouncerProvider>
          <MemoryRouter initialEntries={[ruta]}>
            {/*
              La clase del tema va en un ancestro del componente, no en el
              componente: es como funcionan las variantes `dark:` y `hc:`.
            */}
            <div className={CLASE_POR_TEMA[tema]}>{children}</div>
          </MemoryRouter>
        </LiveAnnouncerProvider>
      </QueryClientProvider>
    );
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Providers, ...rest }),
  };
}
