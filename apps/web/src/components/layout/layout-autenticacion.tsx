import type { ReactNode } from 'react';

import { SkipLink } from '@/components/skip-link';
import { SelectorTema } from './selector-tema';
import { MarcaBigHearts } from './marca-bighearts';
import { PanelDeMarca } from './panel-de-marca';

/**
 * Armazón de las pantallas sin sesión (login, registro, recuperación).
 *
 * Dos columnas en escritorio: el formulario a la izquierda, el panel de marca
 * (`--brand`) a la derecha. Debajo de `lg` el panel se reduce a una barra con la
 * marca y el formulario ocupa el ancho. Mantiene el contrato del shell —
 * `<SkipLink>` primero, `<main id="contenido" tabIndex={-1}>` como destino— pero
 * sin navegación: todavía no hay rol que ofrecer.
 */
export function LayoutAutenticacion({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />

      <div className="lg:grid lg:min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(22rem,38%)]">
        <div className="flex min-h-dvh flex-col">
          <header>
            <div className="flex items-center justify-center bg-brand px-4 py-3 text-brand-foreground lg:hidden">
              <MarcaBigHearts />
            </div>
            <div className="flex justify-end px-4 pt-4 sm:px-6 lg:px-8">
              <SelectorTema />
            </div>
          </header>

          <main
            id="contenido"
            tabIndex={-1}
            className="flex flex-1 flex-col justify-center px-4 py-8 outline-none sm:px-6 lg:px-12"
          >
            {children}
          </main>
        </div>

        <aside className="relative hidden overflow-hidden bg-brand text-brand-foreground lg:flex lg:flex-col lg:p-12">
          <PanelDeMarca />
        </aside>
      </div>
    </div>
  );
}
