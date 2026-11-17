import {
  ApiErrorCode,
  COLUMNAS_IMPORTACION,
  type ConfirmarImportacionResponse,
  IMPORTACION_MAX_BYTES,
  PLANTILLA_IMPORTACION_CSV,
  type VistaPreviaImportacionResponse,
} from '@academia/types';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  FileSpreadsheet,
  Plus,
  Upload,
} from 'lucide-react';
import { type DragEvent, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import {
  confirmarImportacion,
  pedirVistaPrevia,
} from '@/features/admin/diccionario/api/importacion';
import { PasosImportacion } from '@/features/admin/diccionario/components/pasos-importacion';
import { TablaVistaPrevia } from '@/features/admin/diccionario/components/tabla-vista-previa';
import { Migas } from '@/features/diccionario/components/migas';
import { ApiClientError } from '@/lib/api-error';
import { cn } from '@/lib/utils';

type Paso = 1 | 2 | 3 | 4;

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
const enumerar = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;

function descargarPlantilla() {
  const url = URL.createObjectURL(
    new Blob([PLANTILLA_IMPORTACION_CSV], { type: 'text/csv;charset=utf-8' }),
  );
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'plantilla-diccionario.csv';
  enlace.click();
  URL.revokeObjectURL(url);
}

/** Subir → revisar → confirmar. Nada se escribe en la base hasta el último botón. */
export function AdminImportarPage() {
  const queryClient = useQueryClient();
  const titulo = useRef<HTMLHeadingElement>(null);
  const [paso, setPaso] = useState<Paso>(1);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vista, setVista] = useState<VistaPreviaImportacionResponse | null>(null);
  const [incluirDuplicadas, setIncluirDuplicadas] = useState(false);
  const [resultado, setResultado] = useState<ConfirmarImportacionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const primerRender = useRef(true);

  // Al cambiar de paso el foco va a su título: el lector lo anuncia.
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  async function analizar(elegido: File) {
    setError(null);
    if (!/\.csv$/i.test(elegido.name)) {
      return setError('El archivo debe ser un CSV (.csv). En Excel: Guardar como → «CSV UTF-8».');
    }
    if (elegido.size > IMPORTACION_MAX_BYTES) {
      return setError(
        `Pesa ${(elegido.size / 1024 / 1024).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MB. El máximo es 1 MB: divídelo en varios archivos.`,
      );
    }
    setTrabajando(true);
    try {
      const respuesta = await pedirVistaPrevia(elegido);
      setArchivo(elegido);
      setVista(respuesta);
      setIncluirDuplicadas(false);
      setPaso(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos leer el archivo. Inténtalo de nuevo.');
    } finally {
      setTrabajando(false);
    }
  }

  async function importar() {
    if (!vista) return;
    setError(null);
    setTrabajando(true);
    try {
      const r = await confirmarImportacion({ token: vista.token, incluirDuplicadas });
      setResultado(r);
      setPaso(4);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-diccionario'] }),
        queryClient.invalidateQueries({ queryKey: ['diccionario'] }),
      ]);
    } catch (e) {
      if (e instanceof ApiClientError && e.code === ApiErrorCode.IMPORT_PREVIEW_EXPIRED) {
        setVista(null);
        setPaso(1);
        setError(
          'La revisión caducó: pasaron más de 30 minutos. Sube el archivo otra vez; no se importó nada.',
        );
      } else {
        setError(
          e instanceof Error ? e.message : 'No pudimos importar. No se guardó ninguna entrada.',
        );
      }
    } finally {
      setTrabajando(false);
    }
  }

  const resumen = vista?.resumen;
  const aImportar = resumen ? resumen.nuevas + (incluirDuplicadas ? resumen.duplicadas : 0) : 0;
  const modulos = vista
    ? [
        ...new Set(
          vista.filas
            .filter((f) => f.estado === 'nueva' || (incluirDuplicadas && f.estado === 'duplicada'))
            .map((f) => f.modulo),
        ),
      ]
    : [];
  const primerModulo = modulos.length === 1 ? modulos[0] : undefined;

  const tituloPaso = (texto: string) => (
    <h2 ref={titulo} tabIndex={-1} className="text-2xl font-semibold outline-none">
      {texto}
    </h2>
  );

  return (
    <AppShell>
      <Migas
        pasos={[{ texto: 'Diccionario', to: '/admin/diccionario' }, { texto: 'Importar CSV' }]}
      />
      <PaginaCabecera
        titulo="Importar CSV"
        tituloDocumento="Importar CSV · Diccionario"
        contexto="Agrega muchas entradas a la vez. Nada se guarda hasta que confirmes en el paso 3."
      />
      <PasosImportacion actual={paso} />

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive-border bg-destructive-soft p-4 text-base text-destructive-soft-foreground"
        >
          <CircleAlert aria-hidden="true" strokeWidth={2} className="mt-0.5 size-5 shrink-0" />
          {error}
        </p>
      )}

      {paso === 1 && (
        <section className="space-y-4">
          {tituloPaso('Paso 1 · Sube el archivo')}
          <ZonaCsv trabajando={trabajando} onElegir={(a) => void analizar(a)} />
          <div className="space-y-2 rounded-xl border border-border bg-card p-5">
            <p className="text-base font-semibold">Columnas, en este orden</p>
            <p className="text-base">
              <code className="[overflow-wrap:anywhere]">{COLUMNAS_IMPORTACION.join(', ')}</code>
            </p>
            <p className="text-sm text-muted-foreground">
              «unidad_nombre» solo hace falta si la unidad es nueva. El tipo es Palabra, Verbo,
              Frase o Expresión.
            </p>
            <Button
              variant="outline"
              className="h-11 gap-2 px-4 text-base"
              onClick={descargarPlantilla}
            >
              <Download aria-hidden="true" strokeWidth={2} className="size-4" />
              Descargar plantilla
            </Button>
          </div>
        </section>
      )}

      {paso === 2 && vista && resumen && (
        <section className="space-y-5">
          {tituloPaso('Paso 2 · Revisa lo que va a pasar')}
          <p className="flex flex-wrap items-center gap-3 text-base">
            <FileSpreadsheet aria-hidden="true" strokeWidth={2} className="size-5" />
            <code>{archivo?.name}</code>
            <span className="text-muted-foreground">{plural(resumen.total, 'fila', 'filas')}</span>
            <Button
              variant="ghost"
              className="h-11 px-3 text-base text-primary"
              onClick={() => setPaso(1)}
            >
              Cambiar archivo
            </Button>
          </p>
          <ul aria-label="Resumen" className="grid gap-3 sm:grid-cols-3">
            <Resumen
              icono={Plus}
              numero={resumen.nuevas}
              texto="nuevas · se crean"
              clase="border-info/30 bg-info-soft"
            />
            <Resumen
              icono={Copy}
              numero={resumen.duplicadas}
              texto={incluirDuplicadas ? 'ya existen · se actualizan' : 'ya existen · se omiten'}
              clase="border-border bg-muted"
            />
            <Resumen
              icono={CircleAlert}
              numero={resumen.errores}
              texto="con errores · se omiten"
              clase="border-destructive-border bg-destructive-soft"
            />
          </ul>
          {resumen.duplicadas > 0 && (
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base">
              <input
                type="checkbox"
                className="size-5"
                checked={incluirDuplicadas}
                onChange={(e) => setIncluirDuplicadas(e.target.checked)}
              />
              Actualizar también las que ya existen
            </label>
          )}
          <TablaVistaPrevia filas={vista.filas} />
          <Navegacion
            onVolver={() => setPaso(1)}
            siguiente={`Seguir con ${plural(aImportar, 'entrada', 'entradas')}`}
            motivo={
              aImportar === 0
                ? 'No hay ninguna fila para importar. Corrige el archivo y súbelo otra vez.'
                : null
            }
            onSeguir={() => setPaso(3)}
          />
        </section>
      )}

      {paso === 3 && vista && resumen && (
        <section className="space-y-5">
          {tituloPaso('Paso 3 · Confirma')}
          <div className="space-y-2 rounded-xl border border-border bg-card p-5">
            <p className="text-lg">
              Vas a importar <strong>{plural(aImportar, 'entrada', 'entradas')}</strong>
              {modulos.length > 0 &&
                ` en ${modulos.length === 1 ? 'el Módulo' : 'los módulos'} ${enumerar(modulos)}`}
              .
            </p>
            {resumen.unidadesNuevas.length > 0 && (
              <p className="text-base">
                Se {resumen.unidadesNuevas.length === 1 ? 'crea' : 'crean'}:{' '}
                {resumen.unidadesNuevas
                  .map((u) => `Unidad ${u.codigo.slice(1)} · ${u.nombre} (Módulo ${u.modulo})`)
                  .join(', ')}
                .
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Las entradas nuevas quedan sin seña: luego puedes subirlas desde la Cola de grabación.
            </p>
          </div>
          <Navegacion
            onVolver={() => setPaso(2)}
            siguiente={
              trabajando ? 'Importando…' : `Importar ${plural(aImportar, 'entrada', 'entradas')}`
            }
            motivo={null}
            onSeguir={() => void importar()}
            ocupado={trabajando}
          />
        </section>
      )}

      {paso === 4 && resultado && (
        <section className="space-y-4 rounded-xl border border-success-border bg-success-soft p-6 text-success-soft-foreground">
          <h2
            ref={titulo}
            tabIndex={-1}
            className="flex items-center gap-2 text-2xl font-semibold outline-none"
          >
            <CircleCheck aria-hidden="true" strokeWidth={2} className="size-6" />
            Importación terminada
          </h2>
          <p className="text-base">
            {plural(resultado.creadas, 'entrada creada', 'entradas creadas')}
            {resultado.actualizadas > 0 &&
              ` · ${plural(resultado.actualizadas, 'actualizada', 'actualizadas')}`}
            {resultado.unidadesCreadas > 0 &&
              ` · ${plural(resultado.unidadesCreadas, 'unidad nueva', 'unidades nuevas')}`}
            .
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              render={<Link to="/admin/diccionario/grabacion" />}
              className="h-11 gap-2 px-4 text-base"
            >
              <Upload aria-hidden="true" strokeWidth={2} className="size-4" />
              Subir sus señas en la Cola de grabación
            </Button>
            <Button
              render={
                <Link
                  to={
                    primerModulo
                      ? `/admin/diccionario?modulo=${primerModulo}`
                      : '/admin/diccionario'
                  }
                />
              }
              variant="outline"
              className="h-11 px-4 text-base"
            >
              Ver en la consola
            </Button>
            <Button
              variant="ghost"
              className="h-11 px-4 text-base"
              onClick={() => {
                setVista(null);
                setResultado(null);
                setPaso(1);
              }}
            >
              Importar otro archivo
            </Button>
          </div>
        </section>
      )}
    </AppShell>
  );
}

function Resumen({
  icono: Icono,
  numero,
  texto,
  clase,
}: {
  icono: typeof Plus;
  numero: number;
  texto: string;
  clase: string;
}) {
  return (
    <li className={cn('flex items-center gap-3 rounded-xl border p-4', clase)}>
      <Icono aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
      <span>
        <strong className="block text-2xl font-semibold">{numero}</strong>
        <span className="text-base">{texto}</span>
      </span>
    </li>
  );
}

function Navegacion({
  onVolver,
  siguiente,
  motivo,
  onSeguir,
  ocupado = false,
}: {
  onVolver: () => void;
  siguiente: string;
  motivo: string | null;
  onSeguir: () => void;
  ocupado?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button
        variant="outline"
        disabled={ocupado}
        className="h-12 gap-2 px-5 text-base"
        onClick={onVolver}
      >
        <ArrowLeft aria-hidden="true" strokeWidth={2} className="size-4" />
        Volver
      </Button>
      <div className="flex flex-wrap items-center gap-3">
        {motivo && (
          <p id={`${id}-motivo`} className="text-sm text-muted-foreground">
            {motivo}
          </p>
        )}
        <Button
          aria-disabled={Boolean(motivo) || ocupado || undefined}
          aria-describedby={motivo ? `${id}-motivo` : undefined}
          className={cn('h-12 gap-2 px-5 text-base', motivo && 'opacity-60')}
          onClick={() => !motivo && !ocupado && onSeguir()}
        >
          {siguiente}
          <ArrowRight aria-hidden="true" strokeWidth={2} className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ZonaCsv({
  trabajando,
  onElegir,
}: {
  trabajando: boolean;
  onElegir: (archivo: File) => void;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        setArrastrando(false);
        const archivo = e.dataTransfer.files[0];
        if (archivo) onElegir(archivo);
      }}
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transicion-rapida',
        arrastrando ? 'border-primary bg-primary-soft' : 'border-muted-foreground/40 bg-muted/40',
      )}
    >
      <input
        ref={entrada}
        type="file"
        accept=".csv,text/csv"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(e) => {
          const archivo = e.target.files?.[0];
          if (archivo) onElegir(archivo);
          e.target.value = '';
        }}
      />
      <span className="flex size-12 items-center justify-center rounded-full border border-border bg-background">
        <FileSpreadsheet aria-hidden="true" strokeWidth={2} className="size-5" />
      </span>
      <p className="text-lg font-semibold">
        {arrastrando ? 'Suelta el archivo aquí' : 'Arrastra el CSV aquí'}
      </p>
      <Button
        variant="outline"
        aria-disabled={trabajando || undefined}
        className="h-11 gap-2 px-4 text-base"
        onClick={() => !trabajando && entrada.current?.click()}
      >
        <Upload aria-hidden="true" strokeWidth={2} className="size-4" />
        {trabajando ? 'Revisando el archivo…' : 'Elegir archivo CSV'}
      </Button>
      <p className="text-sm text-muted-foreground">
        CSV de hasta 1 MB. Excel con «;» también sirve.
      </p>
    </div>
  );
}
