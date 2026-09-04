import type { User } from '@academia/types';
import { LoaderCircle, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { MarcaBigHearts } from '@/components/dominio/marca-bighearts';
import { SkipLink } from '@/components/skip-link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { roleDisplay } from '@/features/auth/lib/role-labels';
import { useAnnounce } from '@/hooks/use-announce';
import { useEsMovil } from '@/hooks/use-es-movil';
import { cn } from '@/lib/utils';
import { Contenedor } from './contenedor';
import { destinosPorRol, type Destino } from './destinos-por-rol';
import { SelectorTema } from './selector-tema';

type AppShellProps = {
  children: ReactNode;
  /**
   * `false` en login y registro: todavía no hay sesión, así que no hay destinos
   * que ofrecer. La pantalla se queda con la marca y el contenedor.
   */
  conNavegacion?: boolean;
};

/**
 * El armazón de todas las pantallas: marca, navegación y contenido.
 *
 * Tres decisiones que esta pieza fija para toda la aplicación:
 *
 *  1. **Navegación superior, nunca lateral.** Hay 3–4 destinos por rol; una
 *     columna lateral para eso es espacio muerto, y la rejilla de aulas es lo
 *     que agradece el ancho.
 *  2. **Sin estado oculto.** No hay hamburguesa en escritorio ni cajón en móvil:
 *     todos los destinos se ven sin pulsar nada, y en móvil bajan a una barra
 *     inferior fija con ícono **+ texto**. Un cajón añade un estado que
 *     aprender, y para quien lee español como segunda lengua eso cuesta más.
 *  3. **El estado de la sesión está siempre a la vista.** Quién eres y cómo
 *     salir no viven detrás de un menú de avatar.
 */
export function AppShell({ children, conNavegacion = true }: AppShellProps) {
  const { user } = useAuth();
  const esMovil = useEsMovil();

  // Sin usuario no hay rol, y sin rol no hay destinos: la home pública y el 404
  // se pintan con marca y contenedor, igual que login y registro.
  const destinos = conNavegacion && user ? destinosPorRol[user.role] : [];
  const hayNavegacion = destinos.length > 0;
  const navegacionAbajo = hayNavegacion && esMovil;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Primer elemento enfocable del documento, antes que nada más. */}
      <SkipLink />

      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <Contenedor className="flex h-[58px] items-center justify-between gap-4">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5 rounded-lg text-lg font-medium text-primary hover:underline"
          >
            <span aria-hidden="true">
              <MarcaBigHearts className="size-6" />
            </span>
            BigHearts
          </Link>

          {hayNavegacion && !esMovil && (
            <nav aria-label="Secciones" className="flex min-w-0 flex-1 items-center gap-1">
              {destinos.map((destino) => (
                <EnlaceSuperior key={destino.to} destino={destino} />
              ))}
            </nav>
          )}

          <div className="flex shrink-0 items-center gap-3">
            {user && <CuentaDelShell user={user} />}
            <SelectorTema />
          </div>
        </Contenedor>
      </header>

      {/*
        `tabIndex={-1}` no es decorativo: sin él, activar el skip-link mueve el
        indicador del navegador pero no siempre el foco real (Safari es el caso
        conocido). Con él, el foco entra en `<main>` en todos los navegadores.
      */}
      <main
        id="contenido"
        tabIndex={-1}
        className={cn('flex-1 outline-none', navegacionAbajo && 'pb-24')}
      >
        <Contenedor className="space-y-8 py-8">{children}</Contenedor>
      </main>

      {navegacionAbajo && (
        <nav
          aria-label="Secciones"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
        >
          {destinos.map((destino) => (
            <EnlaceInferior key={destino.to} destino={destino} />
          ))}
        </nav>
      )}
    </div>
  );
}

/**
 * Enlace de la barra superior.
 *
 * El activo lleva **borde inferior de 2px** además del cambio de color. El color
 * solo no basta: no lo distingue todo el mundo y, sobre todo, no sobrevive al
 * modo de alto contraste, donde la paleta se aplana a propósito.
 *
 * `<NavLink>` pone `aria-current="page"` solo: quien navega con lector de
 * pantalla oye dónde está sin depender de ningún píxel.
 */
function EnlaceSuperior({ destino }: { destino: Destino }) {
  const Icono = destino.icon;

  return (
    <NavLink
      to={destino.to}
      className={({ isActive }) =>
        cn(
          'inline-flex h-[58px] items-center gap-2 border-b-2 px-3 text-sm transition-colors',
          isActive
            ? 'border-primary font-medium text-primary'
            : 'border-transparent text-foreground hover:text-primary',
        )
      }
    >
      <Icono aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
      {destino.label}
    </NavLink>
  );
}

/**
 * Enlace de la barra inferior de móvil. Siempre **ícono + texto**, nunca ícono
 * solo: un pictograma sin palabra obliga a adivinar, y adivinar es exactamente
 * lo que este producto le ahorra al usuario.
 *
 * Aquí el borde de 2px va arriba y no abajo: en el borde inferior de la pantalla
 * no se vería. Sigue siendo la misma señal no cromática que exige el sistema.
 */
function EnlaceInferior({ destino }: { destino: Destino }) {
  const Icono = destino.icon;

  return (
    <NavLink
      to={destino.to}
      className={({ isActive }) =>
        cn(
          'flex min-h-14 flex-1 flex-col items-center justify-center gap-1 border-t-2 px-2 py-2 text-xs transition-colors',
          isActive
            ? 'border-primary font-medium text-primary'
            : 'border-transparent text-foreground',
        )
      }
    >
      <Icono aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
      {destino.label}
    </NavLink>
  );
}

/**
 * Quién eres y cómo salir, a la derecha de la barra.
 *
 * El avatar va `aria-hidden`: son dos iniciales, no información. El nombre y el
 * rol viajan en texto, y bajo 640px siguen en el árbol accesible aunque no se
 * vean (`sr-only sm:not-sr-only`) — ocultarlos con `hidden` los borraría también
 * para el lector de pantalla, que es a quien menos podemos permitirnos borrar.
 */
function CuentaDelShell({ user }: { user: User }) {
  const logout = useLogout();
  const navigate = useNavigate();
  const announce = useAnnounce();
  const { label } = roleDisplay[user.role];

  const iniciales = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  function cerrarSesion() {
    logout.mutate(undefined, {
      onSettled: () => {
        announce('Cerraste tu sesión.');
        navigate('/login', { replace: true });
      },
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-medium text-primary-soft-foreground"
      >
        {iniciales}
      </span>

      <p className="sr-only min-w-0 text-sm leading-tight sm:not-sr-only sm:block">
        <span className="block truncate font-medium text-foreground">
          {user.firstName} {user.lastName}
        </span>
        <span className="block truncate text-muted-foreground">{label}</span>
      </p>

      <Button
        variant="outline"
        onClick={cerrarSesion}
        disabled={logout.isPending}
        className="h-11 gap-2 px-3 text-sm sm:px-4"
      >
        {logout.isPending ? (
          <>
            <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-4 animate-spin" />
            <span className="sr-only sm:not-sr-only">Cerrando tu sesión…</span>
          </>
        ) : (
          <>
            <LogOut aria-hidden="true" strokeWidth={2} className="size-4" />
            <span className="sr-only sm:not-sr-only">Cerrar sesión</span>
          </>
        )}
      </Button>
    </div>
  );
}
