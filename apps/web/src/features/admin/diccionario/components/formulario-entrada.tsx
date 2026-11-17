import {
  type CategoriaAdmin,
  type CrearEntradaInput,
  type DuplicadoEntrada,
  type EntradaAdmin,
  type ModuloAdmin,
  TIPO_ENTRADA_LABELS,
  TipoEntrada,
  TRAMO_MODULO_LABELS,
} from '@academia/types';
import { Check, CircleAlert, Copy, ExternalLink, Save, Trash2, Upload } from 'lucide-react';
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { buscarDuplicados } from '../api/admin-diccionario';
import { useCrearEntrada, useEditarEntrada } from '../hooks/use-admin-diccionario';
import { ImagenDeEntrada, SenaDeEntrada } from './zona-subida';

const NOTA_MAX = 300;

type Valores = {
  ingles: string;
  espanol: string;
  tipo: TipoEntrada;
  moduloId: string;
  unidadId: string;
  categoriaId: string;
  nota: string;
  publicada: boolean;
};

type Campo = 'ingles' | 'espanol' | 'moduloId' | 'categoriaId';

const vacios = (conservar?: Partial<Valores>): Valores => ({
  ingles: '',
  espanol: '',
  tipo: TipoEntrada.PALABRA,
  moduloId: '',
  unidadId: '',
  categoriaId: '',
  nota: '',
  publicada: true,
  ...conservar,
});

const desdeEntrada = (e: EntradaAdmin): Valores => ({
  ingles: e.ingles,
  espanol: e.espanol,
  tipo: e.tipo,
  moduloId: e.modulo.id,
  unidadId: e.unidad?.id ?? '',
  categoriaId: e.categoria.id,
  nota: e.nota ?? '',
  publicada: e.publicada,
});

const MENSAJES: Record<Campo, string> = {
  ingles: 'Escribe la palabra o frase en inglés.',
  espanol: 'Escribe su traducción al español.',
  moduloId: 'Elige el módulo.',
  categoriaId: 'Elige la categoría.',
};

type FormularioEntradaProps = {
  entrada?: EntradaAdmin;
  modulos: ModuloAdmin[];
  categorias: CategoriaAdmin[];
  onGuardada: (entrada: EntradaAdmin, creaOtra: boolean) => void;
  onCancelar: () => void;
  onSucio: (sucio: boolean) => void;
  onPapelera?: (entrada: EntradaAdmin) => void;
  /** Acciones de pie que el contenedor quiere fijas (panel) o al final (página). */
  pieClassName?: string;
};

export function FormularioEntrada({
  entrada,
  modulos,
  categorias,
  onGuardada,
  onCancelar,
  onSucio,
  onPapelera,
  pieClassName,
}: FormularioEntradaProps) {
  const id = useId();
  const refs = useRef<Partial<Record<Campo, HTMLInputElement | HTMLSelectElement | null>>>({});
  const crear = useCrearEntrada();
  const editar = useEditarEntrada();
  const [base, setBase] = useState<Valores>(() => (entrada ? desdeEntrada(entrada) : vacios()));
  const [valores, setValores] = useState<Valores>(base);
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const [duplicados, setDuplicados] = useState<DuplicadoEntrada[]>([]);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const guardando = crear.isPending || editar.isPending;
  const sucio = JSON.stringify(valores) !== JSON.stringify(base);
  const faltanTextos = !valores.ingles.trim() || !valores.espanol.trim();
  const modulo = modulos.find((m) => m.id === valores.moduloId);

  const [subiendoVideo, setSubiendoVideo] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  // Una subida en curso también se pregunta antes de salir: salir la cancela.
  useEffect(
    () => onSucio(sucio || subiendoVideo || subiendoImagen),
    [sucio, subiendoVideo, subiendoImagen, onSucio],
  );

  const cambiar = <K extends keyof Valores>(campo: K, valor: Valores[K]) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    if (campo in MENSAJES) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  async function revisarDuplicados() {
    const ingles = valores.ingles.trim();
    if (!ingles) return setDuplicados([]);
    try {
      const { duplicados: encontrados } = await buscarDuplicados({
        ingles,
        tipo: valores.tipo,
        ...(entrada ? { excluir: entrada.id } : {}),
      });
      setDuplicados(encontrados);
    } catch {
      setDuplicados([]);
    }
  }

  async function guardar(creaOtra: boolean) {
    if (guardando) return;
    const nuevos: Partial<Record<Campo, string>> = {};
    if (!valores.ingles.trim()) nuevos.ingles = MENSAJES.ingles;
    if (!valores.espanol.trim()) nuevos.espanol = MENSAJES.espanol;
    if (!valores.moduloId) nuevos.moduloId = MENSAJES.moduloId;
    if (!valores.categoriaId) nuevos.categoriaId = MENSAJES.categoriaId;
    setErrores(nuevos);
    const primero = (Object.keys(MENSAJES) as Campo[]).find((c) => nuevos[c]);
    if (primero) {
      refs.current[primero]?.focus();
      return;
    }

    const input: CrearEntradaInput = {
      ingles: valores.ingles.trim(),
      espanol: valores.espanol.trim(),
      tipo: valores.tipo,
      moduloId: valores.moduloId,
      unidadId: valores.unidadId || null,
      categoriaId: valores.categoriaId,
      nota: valores.nota.trim() || null,
      publicada: valores.publicada,
    };
    setErrorServidor(null);
    try {
      const guardada = entrada
        ? await editar.mutateAsync({ id: entrada.id, input })
        : await crear.mutateAsync(input);
      if (creaOtra) {
        const siguiente = vacios({
          moduloId: valores.moduloId,
          unidadId: valores.unidadId,
          categoriaId: valores.categoriaId,
        });
        setBase(siguiente);
        setValores(siguiente);
        setDuplicados([]);
        refs.current.ingles?.focus();
      } else {
        setBase(valores);
      }
      onGuardada(guardada, creaOtra);
    } catch (e) {
      setErrorServidor(e instanceof Error ? e.message : 'No pudimos guardar. Inténtalo de nuevo.');
    }
  }

  function alTeclear(evento: KeyboardEvent<HTMLFormElement>) {
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 's') {
      evento.preventDefault();
      void guardar(false);
    }
  }

  const error = (campo: Campo) =>
    errores[campo] ? (
      <p
        id={`${id}-${campo}-error`}
        className="flex items-center gap-1.5 text-base text-destructive"
      >
        <CircleAlert aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
        {errores[campo]}
      </p>
    ) : null;

  const ariaCampo = (campo: Campo, ayuda?: string) => ({
    'aria-invalid': Boolean(errores[campo]) || undefined,
    'aria-describedby':
      [errores[campo] ? `${id}-${campo}-error` : null, ayuda].filter(Boolean).join(' ') ||
      undefined,
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void guardar(false);
      }}
      onKeyDown={alTeclear}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-6">
        {duplicados.length > 0 && (
          <div
            role="status"
            className="space-y-2 rounded-xl border border-info/30 bg-info-soft p-4"
          >
            <p className="flex items-center gap-2 font-semibold text-info-soft-foreground">
              <Copy aria-hidden="true" strokeWidth={2} className="size-5" />
              Puede ser un duplicado.
            </p>
            {duplicados.map((d) => (
              <p key={d.id} className="text-base">
                Ya existe «<span lang="en">{d.ingles}</span>» en Módulo {d.modulo.numero}. Revisa
                que no sea la misma entrada.{' '}
                <Link
                  to={`/admin/diccionario/entrada/${d.id}`}
                  className="font-medium text-primary underline underline-offset-4"
                >
                  Ver la entrada que ya existe
                </Link>
              </p>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor={`${id}-ingles`} className="block text-base font-medium">
            Inglés
          </label>
          <Input
            ref={(el) => {
              refs.current.ingles = el;
            }}
            id={`${id}-ingles`}
            lang="en"
            value={valores.ingles}
            onChange={(e) => cambiar('ingles', e.target.value)}
            onBlur={() => void revisarDuplicados()}
            {...ariaCampo('ingles')}
          />
          {error('ingles')}
        </div>

        <div className="space-y-2">
          <label htmlFor={`${id}-espanol`} className="block text-base font-medium">
            Español
          </label>
          <Input
            ref={(el) => {
              refs.current.espanol = el;
            }}
            id={`${id}-espanol`}
            value={valores.espanol}
            onChange={(e) => cambiar('espanol', e.target.value)}
            {...ariaCampo('espanol', `${id}-espanol-ayuda`)}
          />
          <p id={`${id}-espanol-ayuda`} className="text-sm text-muted-foreground">
            Separa varias traducciones con coma.
          </p>
          {error('espanol')}
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-base font-medium">Tipo</legend>
          <div className="flex flex-wrap gap-2">
            {Object.values(TipoEntrada).map((t) => {
              const activo = valores.tipo === t;
              return (
                <label
                  key={t}
                  className={cn(
                    'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-base transicion-rapida',
                    'has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                    activo
                      ? 'border-primary bg-primary-soft font-medium text-primary-soft-foreground'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-tipo`}
                    value={t}
                    checked={activo}
                    onChange={() => cambiar('tipo', t)}
                    className="sr-only"
                  />
                  {activo && <Check aria-hidden="true" strokeWidth={2.5} className="size-4" />}
                  {TIPO_ENTRADA_LABELS[t]}
                </label>
              );
            })}
          </div>
        </fieldset>

        {entrada ? (
          <SenaDeEntrada entrada={entrada} onOcupada={setSubiendoVideo} />
        ) : (
          <ZonaPendiente titulo="Video de la seña" />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor={`${id}-modulo`} className="block text-base font-medium">
              Módulo
            </label>
            <NativeSelect
              ref={(el) => {
                refs.current.moduloId = el;
              }}
              id={`${id}-modulo`}
              value={valores.moduloId}
              onChange={(e) => {
                cambiar('moduloId', e.target.value);
                cambiar('unidadId', '');
              }}
              {...ariaCampo('moduloId')}
            >
              <option value="">Elige un módulo</option>
              {modulos.map((m) => (
                <option key={m.id} value={m.id}>
                  Módulo {m.numero} · {TRAMO_MODULO_LABELS[m.tramo]}
                </option>
              ))}
            </NativeSelect>
            {error('moduloId')}
          </div>
          <div className="space-y-2">
            <label htmlFor={`${id}-unidad`} className="block text-base font-medium">
              Unidad
            </label>
            <NativeSelect
              id={`${id}-unidad`}
              value={valores.unidadId}
              onChange={(e) => cambiar('unidadId', e.target.value)}
              aria-describedby={`${id}-unidad-ayuda`}
            >
              <option value="">{modulo ? 'Sin unidad' : 'Elige primero el módulo'}</option>
              {(modulo?.unidades ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  Unidad {u.codigo.slice(1)} · {u.nombre}
                </option>
              ))}
            </NativeSelect>
            <p id={`${id}-unidad-ayuda`} className="text-sm text-muted-foreground">
              Cambian según el módulo.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor={`${id}-categoria`} className="block text-base font-medium">
            Categoría
          </label>
          <NativeSelect
            ref={(el) => {
              refs.current.categoriaId = el;
            }}
            id={`${id}-categoria`}
            value={valores.categoriaId}
            onChange={(e) => cambiar('categoriaId', e.target.value)}
            {...ariaCampo('categoriaId')}
          >
            <option value="">Elige una categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </NativeSelect>
          {error('categoriaId')}
        </div>

        {entrada ? (
          <ImagenDeEntrada entrada={entrada} onOcupada={setSubiendoImagen} />
        ) : (
          <ZonaPendiente titulo="Imagen del concepto" />
        )}

        <div className="space-y-2">
          <label htmlFor={`${id}-nota`} className="block text-base font-medium">
            Nota <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id={`${id}-nota`}
            value={valores.nota}
            maxLength={NOTA_MAX}
            rows={3}
            placeholder="Por ejemplo: cuándo se usa esta palabra"
            aria-describedby={`${id}-nota-ayuda`}
            onChange={(e) => cambiar('nota', e.target.value)}
            className="w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-base placeholder:text-muted-foreground"
          />
          <p id={`${id}-nota-ayuda`} className="text-sm text-muted-foreground">
            Los estudiantes la ven debajo de la palabra · {valores.nota.length} de {NOTA_MAX}
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 border-t border-border pt-5">
          <Switch checked={valores.publicada} onCheckedChange={(v) => cambiar('publicada', v)} />
          <span className="flex flex-col">
            <span className="text-base font-medium">Publicada</span>
            <span className="text-sm text-muted-foreground">
              Apagada: solo la ve el administrador.
            </span>
          </span>
        </label>

        {entrada && (
          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            <Button
              render={<Link to={`/diccionario/entrada/${entrada.slug}`} />}
              variant="outline"
              className="h-11 gap-2 px-4 text-base"
            >
              <ExternalLink aria-hidden="true" strokeWidth={2} className="size-4" />
              Ver en el diccionario
            </Button>
            {onPapelera && (
              <Button
                type="button"
                variant="destructive"
                className="h-11 gap-2 border border-destructive/40 px-4 text-base"
                onClick={() => onPapelera(entrada)}
              >
                <Trash2 aria-hidden="true" strokeWidth={2} className="size-4" />
                Enviar a la papelera
              </Button>
            )}
          </div>
        )}

        {errorServidor && (
          <p role="alert" className="flex items-center gap-2 text-base text-destructive">
            <CircleAlert aria-hidden="true" strokeWidth={2} className="size-4" />
            {errorServidor}
          </p>
        )}
      </div>

      <div
        className={cn(
          'flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4',
          pieClassName,
        )}
      >
        {faltanTextos && (
          <p
            id={`${id}-motivo`}
            className="w-full text-sm text-muted-foreground sm:w-auto sm:flex-1"
          >
            Escribe el inglés y el español para guardar.
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          className="h-11 px-4 text-base text-primary"
          onClick={onCancelar}
        >
          Cancelar
        </Button>
        {!entrada && (
          <Button
            type="button"
            variant="outline"
            aria-disabled={faltanTextos || undefined}
            aria-describedby={faltanTextos ? `${id}-motivo` : undefined}
            className="h-11 px-4 text-base"
            onClick={() => void guardar(true)}
          >
            Guardar y crear otra
          </Button>
        )}
        <Button
          type="submit"
          aria-disabled={faltanTextos || undefined}
          aria-describedby={faltanTextos ? `${id}-motivo` : undefined}
          className={cn('h-11 gap-2 px-5 text-base', faltanTextos && 'opacity-60')}
        >
          <Save aria-hidden="true" strokeWidth={2} className="size-4" />
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}

function ZonaPendiente({ titulo }: { titulo: string }): ReactNode {
  return (
    <div className="space-y-2">
      <p className="text-base font-medium">
        {titulo}{' '}
        <span className="font-normal text-muted-foreground">
          (opcional, se puede subir después)
        </span>
      </p>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-muted-foreground/40 bg-muted/60 p-4">
        <Upload aria-hidden="true" strokeWidth={2} className="size-5 text-muted-foreground" />
        <p className="text-base text-muted-foreground">
          Guarda la entrada primero; después podrás subir aquí el archivo.
        </p>
      </div>
    </div>
  );
}
