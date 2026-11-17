import { EstadoModulo, type ModuloResumen } from '@academia/types';
import { BookA, ChevronRight, Clock, Hand } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { ESTILO_TRAMO } from '../lib/tramos';
import { InsigniaTramo } from './insignia-tramo';

type TarjetaModuloProps = {
  modulo: ModuloResumen;
  /** `vertical` en escritorio; `compacta` en móvil, con el número a la izquierda. */
  layout: 'vertical' | 'compacta';
  /** El último módulo disponible, al que se ofrece ir desde uno próximo. */
  ultimoDisponible?: number;
};

export function TarjetaModulo({ modulo, layout, ultimoDisponible }: TarjetaModuloProps) {
  const disponible = modulo.estado === EstadoModulo.DISPONIBLE;
  const { riel } = ESTILO_TRAMO[modulo.tramo];

  return (
    <div
      className={cn(
        'rounded-xl border',
        riel,
        disponible
          ? 'border-border bg-card shadow-xs transicion-suave hover:shadow-sm'
          : 'border-dashed border-muted-foreground/40 bg-muted/60',
      )}
    >
      {disponible ? (
        <Link
          to={`/diccionario/modulo/${modulo.numero}`}
          className="block rounded-xl p-5 outline-none sm:p-6"
        >
          <Cuerpo modulo={modulo} layout={layout}>
            <Datos modulo={modulo} />
          </Cuerpo>
        </Link>
      ) : (
        <Proximo modulo={modulo} layout={layout} ultimoDisponible={ultimoDisponible} />
      )}
    </div>
  );
}

function Cuerpo({
  modulo,
  layout,
  children,
}: Pick<TarjetaModuloProps, 'modulo' | 'layout'> & { children: ReactNode }) {
  const disponible = modulo.estado === EstadoModulo.DISPONIBLE;
  const numero = (
    <span className="flex flex-col text-left">
      <span className="text-base text-muted-foreground">Módulo</span>
      <span
        className={cn(
          'text-5xl leading-none font-semibold tracking-tight',
          !disponible && 'text-muted-foreground',
        )}
      >
        {modulo.numero}
      </span>
    </span>
  );

  if (layout === 'compacta') {
    return (
      <span className="flex items-center gap-5">
        {numero}
        <span className="flex min-w-0 flex-col items-start gap-2 text-left">
          <InsigniaTramo tramo={modulo.tramo} />
          <span lang="en" className="text-lg">
            {modulo.nombre}
          </span>
          {children}
        </span>
      </span>
    );
  }

  return (
    <span className="flex flex-col gap-3 text-left">
      <span className="flex items-start justify-between gap-3">
        {numero}
        <InsigniaTramo tramo={modulo.tramo} />
      </span>
      <span lang="en" className="text-lg">
        {modulo.nombre}
      </span>
      <span className="block border-t border-border pt-3">{children}</span>
    </span>
  );
}

function Datos({ modulo }: { modulo: ModuloResumen }) {
  return (
    <span className="flex flex-wrap gap-x-4 gap-y-1 text-base">
      <span className="inline-flex items-center gap-1.5">
        <BookA aria-hidden="true" strokeWidth={2} className="size-4 text-muted-foreground" />
        <span>
          <strong className="font-semibold">{modulo.palabras}</strong> palabras
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Hand aria-hidden="true" strokeWidth={2} className="size-4 text-muted-foreground" />
        <span>
          <strong className="font-semibold">{modulo.conSena}</strong> con seña
        </span>
      </span>
    </span>
  );
}

function Proximo({ modulo, layout, ultimoDisponible }: TarjetaModuloProps) {
  const [abierto, setAbierto] = useState(false);
  const idExplicacion = useId();

  return (
    <>
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={idExplicacion}
        onClick={() => setAbierto((a) => !a)}
        className="block w-full rounded-xl p-5 outline-none sm:p-6"
      >
        <Cuerpo modulo={modulo} layout={layout}>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/50 px-2.5 py-0.5 text-sm text-muted-foreground">
              <Clock aria-hidden="true" strokeWidth={2} className="size-4" />
              Próximamente
            </span>
            <span className="text-base text-muted-foreground">
              {abierto ? 'Toca para cerrar' : 'Toca para saber más'}
            </span>
          </span>
        </Cuerpo>
      </button>
      <div
        id={idExplicacion}
        hidden={!abierto}
        className="space-y-3 border-t border-dashed border-muted-foreground/40 px-5 py-4 sm:px-6"
      >
        <p className="text-base">Llegará cuando el profesor entregue el material.</p>
        {ultimoDisponible !== undefined && (
          <Link
            to={`/diccionario/modulo/${ultimoDisponible}`}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg font-medium text-primary underline-offset-4 hover:underline"
          >
            Ir al Módulo {ultimoDisponible}
            <ChevronRight aria-hidden="true" strokeWidth={2} className="size-4" />
          </Link>
        )}
      </div>
    </>
  );
}
