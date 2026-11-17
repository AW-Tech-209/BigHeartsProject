import type { ResultadoBusqueda } from '@academia/types';
import { CircleAlert, LoaderCircle, ScanSearch, Search, X } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ESPERA_BUSQUEDA_MS,
  puedeBuscar,
  useBusquedaDiccionario,
  useValorConEspera,
} from '../hooks/use-diccionario';
import { abrirEntrada } from '../lib/recientes';
import { SugerenciaBusqueda } from './sugerencia-busqueda';

type BuscadorDiccionarioProps = {
  valorInicial?: string;
  /** Números de los módulos con palabras, para la ayuda de «sin resultados». */
  modulosDisponibles?: number[];
};

function enumerar(numeros: number[]): string {
  if (numeros.length <= 1) return numeros.join('');
  return `${numeros.slice(0, -1).join(', ')} y ${numeros[numeros.length - 1]}`;
}

function esCampoDeTexto(elemento: EventTarget | null): boolean {
  if (!(elemento instanceof HTMLElement)) return false;
  return elemento.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(elemento.tagName);
}

export function BuscadorDiccionario({
  valorInicial = '',
  modulosDisponibles = [],
}: BuscadorDiccionarioProps) {
  const navigate = useNavigate();
  const id = useId();
  const idLista = `${id}-lista`;
  const idAyuda = `${id}-ayuda`;
  const campo = useRef<HTMLInputElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);

  const [texto, setTexto] = useState(valorInicial);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);

  const conEspera = useValorConEspera(texto, ESPERA_BUSQUEDA_MS);
  const busqueda = useBusquedaDiccionario(conEspera);
  const resultados = puedeBuscar(conEspera) ? (busqueda.data?.resultados ?? []) : [];
  const listo = puedeBuscar(conEspera) && busqueda.isSuccess && !busqueda.isPlaceholderData;
  const visible = abierto && puedeBuscar(texto);
  const hayLista = visible && resultados.length > 0 && !busqueda.isError;

  // Si la URL cambia (`?q=`), el campo la refleja; se ajusta en el render, sin efecto.
  const [qAnterior, setQAnterior] = useState(valorInicial);
  if (qAnterior !== valorInicial) {
    setQAnterior(valorInicial);
    setTexto(valorInicial);
  }

  useEffect(() => {
    function alPulsar(evento: globalThis.KeyboardEvent) {
      if (evento.key !== '/' || evento.ctrlKey || evento.metaKey || evento.altKey) return;
      if (esCampoDeTexto(evento.target)) return;
      evento.preventDefault();
      campo.current?.focus();
    }
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, []);

  function elegir(resultado: ResultadoBusqueda) {
    setAbierto(false);
    navigate(abrirEntrada(resultado));
  }

  function verTodos() {
    if (!puedeBuscar(texto)) return;
    setAbierto(false);
    navigate(`/diccionario?q=${encodeURIComponent(texto.trim())}`);
  }

  function alEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (hayLista && activo >= 0 && resultados[activo]) elegir(resultados[activo]);
    else verTodos();
  }

  function alTeclear(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      setAbierto(true);
      if (resultados.length === 0) return;
      const paso = evento.key === 'ArrowDown' ? 1 : -1;
      setActivo((a) => (a + paso + resultados.length) % resultados.length);
    } else if (evento.key === 'Escape') {
      evento.preventDefault();
      if (visible) setAbierto(false);
      else setTexto('');
      setActivo(-1);
    }
  }

  function limpiar() {
    setTexto('');
    setActivo(-1);
    campo.current?.focus();
  }

  const anuncio = !visible
    ? ''
    : busqueda.isError
      ? 'No pudimos buscar.'
      : !listo
        ? ''
        : resultados.length === 0
          ? `No encontramos “${conEspera.trim()}”.`
          : `${resultados.length} sugerencias. Usa las flechas para moverte.`;

  return (
    <div
      ref={contenedor}
      className="relative max-w-3xl"
      onBlur={(evento) => {
        if (!contenedor.current?.contains(evento.relatedTarget as Node | null)) setAbierto(false);
      }}
    >
      <form role="search" onSubmit={alEnviar} className="space-y-2">
        <label htmlFor={`${id}-campo`} className="block text-base font-medium">
          Busca en inglés o en español
        </label>
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border-2 border-input bg-background p-1.5 pl-4 transicion-rapida',
            'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30',
          )}
        >
          <Search
            aria-hidden="true"
            strokeWidth={2}
            className="size-5 shrink-0 text-muted-foreground"
          />
          <input
            ref={campo}
            id={`${id}-campo`}
            type="text"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            aria-autocomplete="list"
            aria-expanded={hayLista}
            aria-controls={idLista}
            aria-activedescendant={hayLista && activo >= 0 ? `${id}-op-${activo}` : undefined}
            aria-describedby={idAyuda}
            placeholder="Por ejemplo: To eat o Comer"
            value={texto}
            onChange={(evento) => {
              setTexto(evento.target.value);
              setActivo(-1);
              setAbierto(true);
            }}
            onFocus={() => setAbierto(true)}
            onKeyDown={alTeclear}
            className="h-11 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
          />
          {texto && (
            <Button
              type="button"
              variant="ghost"
              onClick={limpiar}
              aria-label="Borrar la búsqueda"
              className="size-11 text-primary"
            >
              <X aria-hidden="true" strokeWidth={2} className="size-5" />
            </Button>
          )}
          <Button type="submit" className="h-11 px-5 text-base">
            Buscar
          </Button>
        </div>
        <p id={idAyuda} className="text-sm text-muted-foreground">
          Escribe 2 letras o más. Al elegir una sugerencia se abre la palabra.
        </p>
      </form>

      <p role="status" className="sr-only">
        {anuncio}
      </p>

      {/* El listbox existe siempre para que `aria-controls` apunte a algo real. */}
      {!hayLista && <ul id={idLista} role="listbox" aria-label="Sugerencias" hidden />}

      {visible && (
        <div className="absolute inset-x-0 top-[calc(100%-1.75rem)] z-30 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          {busqueda.isError ? (
            <div role="alert" className="flex flex-col items-start gap-3 p-5">
              <p className="flex items-center gap-2 font-medium text-destructive">
                <CircleAlert aria-hidden="true" strokeWidth={2} className="size-5" />
                No pudimos buscar.
              </p>
              <p className="text-base">Revisa tu conexión e inténtalo de nuevo.</p>
              <Button
                variant="outline"
                className="h-11 px-4"
                onClick={() => void busqueda.refetch()}
              >
                Reintentar
              </Button>
            </div>
          ) : hayLista ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-2.5 text-sm text-muted-foreground">
                <span>{resultados.length} sugerencias</span>
                <span aria-hidden="true" className="hidden sm:inline">
                  <kbd className="rounded border px-1">↑</kbd>{' '}
                  <kbd className="rounded border px-1">↓</kbd> para moverte ·{' '}
                  <kbd className="rounded border px-1">Enter</kbd> para abrir ·{' '}
                  <kbd className="rounded border px-1">Esc</kbd> para cerrar
                </span>
              </div>
              <ul
                id={idLista}
                role="listbox"
                aria-label="Sugerencias"
                className="max-h-[28rem] overflow-y-auto p-1.5"
              >
                {resultados.map((resultado, i) => (
                  <li
                    key={resultado.slug}
                    id={`${id}-op-${i}`}
                    role="option"
                    aria-selected={i === activo}
                    onMouseDown={(evento) => evento.preventDefault()}
                    onClick={() => elegir(resultado)}
                    onMouseMove={() => setActivo(i)}
                    className={cn(
                      'cursor-pointer rounded-lg border-l-4 border-transparent px-4 py-3',
                      i === activo && 'border-primary bg-primary-soft',
                    )}
                  >
                    <SugerenciaBusqueda resultado={resultado} busqueda={conEspera} />
                  </li>
                ))}
              </ul>
            </>
          ) : listo ? (
            <SinResultados
              busqueda={conEspera.trim()}
              modulos={modulosDisponibles}
              onVerModulos={() => {
                setTexto('');
                setAbierto(false);
                navigate('/diccionario');
              }}
            />
          ) : (
            <p className="flex items-center gap-2 p-5 text-base text-muted-foreground">
              <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
              Buscando…
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function SinResultados({
  busqueda,
  modulos,
  onVerModulos,
}: {
  busqueda: string;
  modulos: number[];
  onVerModulos: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 p-6">
      <span className="flex size-12 items-center justify-center rounded-full border border-border">
        <ScanSearch aria-hidden="true" strokeWidth={2} className="size-5 text-muted-foreground" />
      </span>
      <p className="font-serif text-2xl text-balance">No encontramos “{busqueda}”.</p>
      <p className="text-base">Prueba en inglés o en español.</p>
      <ul className="list-disc space-y-1 pl-5 text-base text-muted-foreground">
        <li>Revisa que la palabra esté bien escrita.</li>
        <li>Prueba con una sola palabra.</li>
        {modulos.length > 0 && <li>Hoy hay palabras de los módulos {enumerar(modulos)}.</li>}
      </ul>
      <Button variant="outline" className="h-11 px-4" onClick={onVerModulos}>
        Ver los módulos
      </Button>
    </div>
  );
}
