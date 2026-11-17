import { type EntradaAdmin, LIMITES_MEDIOS_POR_DEFECTO } from '@academia/types';
import {
  CircleAlert,
  CircleCheck,
  FileVideo,
  Hourglass,
  ImageIcon,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { type DragEvent, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EstadoSena } from '@/features/diccionario/components/estado-sena';
import { useEntrada } from '@/features/diccionario/hooks/use-diccionario';
import { cn } from '@/lib/utils';
import type { EstadoSubida, Progreso } from '../hooks/use-subida';
import { useSubirImagen } from '../hooks/use-subir-imagen';
import { useSubirSena } from '../hooks/use-subir-sena';
import { IMAGENES_ACEPTADAS } from '../lib/reducir-imagen';
import { formatoMb } from '../lib/validar-video';

type ZonaSubidaProps = {
  tipo: 'video' | 'imagen';
  titulo: string;
  ayuda: string;
  accept: string;
  estado: EstadoSubida;
  progreso: Progreso;
  error: string | null;
  anuncio: string;
  /** Lo que el estudiante ve ahora mismo (o lo recién subido). */
  vistaPrevia: { url: string; poster?: string | null } | null;
  descripcion: string;
  onElegir: (archivo: File) => void;
  onCancelar: () => void;
  onQuitar: () => Promise<void>;
};

/** Uno o muchos archivos: el botón siempre está; arrastrar es solo un atajo. */
export function ZonaSubida(props: ZonaSubidaProps) {
  const { tipo, titulo, ayuda, accept, estado, progreso, error, anuncio, vistaPrevia } = props;
  const entrada = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [nombre, setNombre] = useState<string | null>(null);
  const [confirmarQuitar, setConfirmarQuitar] = useState(false);
  const [quitando, setQuitando] = useState(false);
  const [errorQuitar, setErrorQuitar] = useState<string | null>(null);
  const esVideo = tipo === 'video';
  const ocupada = estado === 'validando' || estado === 'subiendo' || estado === 'procesando';

  const elegir = (archivo: File | undefined) => {
    if (!archivo) return;
    setNombre(archivo.name);
    setConfirmarQuitar(false);
    props.onElegir(archivo);
  };

  async function quitar() {
    setQuitando(true);
    setErrorQuitar(null);
    try {
      await props.onQuitar();
      setConfirmarQuitar(false);
    } catch {
      setErrorQuitar('No pudimos quitarla. Inténtalo de nuevo.');
    } finally {
      setQuitando(false);
    }
  }

  const alSoltar = (e: DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    elegir(e.dataTransfer.files[0]);
  };

  const input = (
    <input
      ref={entrada}
      type="file"
      accept={accept}
      tabIndex={-1}
      aria-hidden="true"
      className="sr-only"
      onChange={(e) => {
        elegir(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
  );
  const abrirSelector = () => entrada.current?.click();

  return (
    <div className="space-y-2">
      <p className="text-base font-medium">
        {titulo}{' '}
        <span className="font-normal text-muted-foreground">
          (opcional, se puede subir después)
        </span>
      </p>
      <p role="status" className="sr-only">
        {anuncio}
      </p>
      {input}

      {ocupada ? (
        <div className="space-y-3 rounded-xl border border-border bg-muted/60 p-4">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
            {esVideo ? (
              <FileVideo aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
            ) : (
              <ImageIcon aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium">{nombre ?? 'Archivo'}</p>
              <p className="text-sm text-muted-foreground">
                {estado === 'validando'
                  ? 'Revisando el archivo…'
                  : `${formatoMb(progreso.subidos)} de ${formatoMb(progreso.total)} subidos`}
              </p>
            </div>
            <Badge
              tono="attention"
              icon={estado === 'procesando' ? Hourglass : Upload}
              className="px-2 py-0.5 text-sm"
            >
              {estado === 'procesando' ? 'Procesando' : 'Subiendo'}
            </Badge>
          </div>
          <div
            role="progressbar"
            aria-label={`Subida de ${nombre ?? 'archivo'}`}
            aria-valuemin={0}
            aria-valuemax={progreso.total || 1}
            aria-valuenow={progreso.subidos}
            aria-valuetext={`${formatoMb(progreso.subidos)} de ${formatoMb(progreso.total)}`}
            className="h-2 overflow-hidden rounded-full bg-background"
          >
            <div
              className="h-full rounded-full bg-attention"
              style={{
                width: `${progreso.total ? (progreso.subidos / progreso.total) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-base">No cierres esta ventana hasta que termine.</p>
            {estado !== 'procesando' && (
              <Button
                variant="ghost"
                className="h-11 px-3 text-base text-primary"
                onClick={props.onCancelar}
              >
                Cancelar subida
              </Button>
            )}
          </div>
        </div>
      ) : vistaPrevia ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          {esVideo ? (
            <VistaPreviaVideo
              url={vistaPrevia.url}
              poster={vistaPrevia.poster}
              descripcion={props.descripcion}
            />
          ) : (
            <img
              src={vistaPrevia.url}
              alt={props.descripcion}
              className="max-h-64 rounded-lg border border-border object-contain"
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Badge tono="success" icon={CircleCheck} className="px-2 py-0.5 text-sm">
              Lista
            </Badge>
            <Button variant="outline" className="h-11 gap-2 px-4 text-base" onClick={abrirSelector}>
              <RefreshCw aria-hidden="true" strokeWidth={2} className="size-4" />
              Reemplazar
            </Button>
            <Button
              variant="ghost"
              className="h-11 gap-2 px-3 text-base text-destructive"
              onClick={() => setConfirmarQuitar(true)}
            >
              <Trash2 aria-hidden="true" strokeWidth={2} className="size-4" />
              Quitar
            </Button>
          </div>
          {confirmarQuitar && (
            <ConfirmarQuitar
              texto={
                esVideo
                  ? '¿Quitar la seña? Los estudiantes dejarán de verla.'
                  : '¿Quitar la imagen?'
              }
              quitando={quitando}
              onVolver={() => setConfirmarQuitar(false)}
              onQuitar={() => void quitar()}
            />
          )}
          {errorQuitar && (
            <p role="alert" className="text-base text-destructive">
              {errorQuitar}
            </p>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={alSoltar}
          className={cn(
            'flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transicion-rapida',
            arrastrando
              ? 'border-primary bg-primary-soft'
              : 'border-muted-foreground/40 bg-muted/40',
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full border border-border bg-background">
            <Upload aria-hidden="true" strokeWidth={2} className="size-5" />
          </span>
          <p className="text-base font-semibold">
            {arrastrando
              ? 'Suelta el archivo aquí'
              : esVideo
                ? 'Arrastra el video aquí'
                : 'Arrastra una imagen o elígela'}
          </p>
          <Button variant="outline" className="h-11 gap-2 px-4 text-base" onClick={abrirSelector}>
            {esVideo ? (
              <FileVideo aria-hidden="true" strokeWidth={2} className="size-4" />
            ) : (
              <ImageIcon aria-hidden="true" strokeWidth={2} className="size-4" />
            )}
            {esVideo ? 'Elegir video' : 'Elegir imagen'}
          </Button>
          <p className="text-sm text-muted-foreground">{ayuda}</p>
        </div>
      )}

      {error && !ocupada && (
        <p role="alert" className="flex items-start gap-2 text-base text-destructive">
          <CircleAlert aria-hidden="true" strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function ConfirmarQuitar({
  texto,
  quitando,
  onVolver,
  onQuitar,
}: {
  texto: string;
  quitando: boolean;
  onVolver: () => void;
  onQuitar: () => void;
}) {
  const volver = useRef<HTMLButtonElement>(null);
  useEffect(() => volver.current?.focus(), []);
  return (
    <div
      role="alert"
      className="space-y-3 rounded-lg border border-destructive-border bg-destructive-soft p-3"
    >
      <p className="text-base">{texto}</p>
      <div className="flex flex-wrap gap-3">
        <Button
          ref={volver}
          variant="outline"
          className="h-11 px-4 text-base"
          onClick={onVolver}
          disabled={quitando}
        >
          Volver
        </Button>
        <Button
          variant="destructive"
          className="h-11 px-4 text-base"
          onClick={onQuitar}
          disabled={quitando}
        >
          {quitando ? 'Quitando…' : 'Quitar'}
        </Button>
      </div>
    </div>
  );
}

/** Vista previa en bucle, sin autoplay: se reproduce solo cuando se pide. */
function VistaPreviaVideo({
  url,
  poster,
  descripcion,
}: {
  url: string;
  poster?: string | null;
  descripcion: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [reproduciendo, setReproduciendo] = useState(false);

  return (
    <div className="space-y-2">
      <video
        ref={video}
        src={url}
        poster={poster ?? undefined}
        muted
        playsInline
        loop
        preload="none"
        aria-label={descripcion}
        onPlay={() => setReproduciendo(true)}
        onPause={() => setReproduciendo(false)}
        className="aspect-video w-full rounded-lg border border-border bg-muted object-contain"
      />
      <Button
        variant="outline"
        className="h-11 gap-2 px-4 text-base"
        onClick={() => (reproduciendo ? video.current?.pause() : void video.current?.play())}
      >
        {reproduciendo ? (
          <Pause aria-hidden="true" strokeWidth={2} className="size-4" />
        ) : (
          <Play aria-hidden="true" strokeWidth={2} className="size-4" />
        )}
        {reproduciendo ? 'Pausa' : 'Ver la seña'}
      </Button>
    </div>
  );
}

const { videoMaxMb, videoMinS, videoMaxS, imagenMaxKb } = LIMITES_MEDIOS_POR_DEFECTO;

/** La lectura del estudiante da las URLs firmadas de lo que ya está publicado. */
function useMediosPublicados(entrada: EntradaAdmin) {
  const tieneAlgo = entrada.sena.estado === 'lista' || entrada.tieneImagen;
  const lectura = useEntrada(entrada.publicada && tieneAlgo ? entrada.slug : '');
  return lectura.data;
}

export function SenaDeEntrada({
  entrada,
  onOcupada,
}: {
  entrada: EntradaAdmin;
  onOcupada: (ocupada: boolean) => void;
}) {
  const sena = useSubirSena(entrada.id);
  const publicados = useMediosPublicados(entrada);
  useEffect(() => onOcupada(sena.ocupada), [sena.ocupada, onOcupada]);

  const vistaPrevia = sena.vistaPrevia
    ? { url: sena.vistaPrevia }
    : publicados?.sena.url
      ? { url: publicados.sena.url, poster: publicados.sena.miniaturaUrl }
      : null;
  const otroEstado = entrada.sena.estado === 'procesando' || entrada.sena.estado === 'error';

  return (
    <div className="space-y-2">
      <ZonaSubida
        tipo="video"
        titulo="Video de la seña"
        ayuda={`MP4 · de ${videoMinS} a ${videoMaxS} segundos · sin audio · máximo ${videoMaxMb} MB.`}
        accept="video/mp4"
        estado={sena.estado}
        progreso={sena.progreso}
        error={sena.error}
        anuncio={sena.anuncio}
        vistaPrevia={vistaPrevia}
        descripcion={`Seña en LSC de ${entrada.ingles}`}
        onElegir={(archivo) => void sena.subir(archivo)}
        onCancelar={sena.cancelar}
        onQuitar={sena.quitar}
      />
      {!vistaPrevia && sena.estado === 'vacia' && entrada.sena.estado === 'lista' && (
        <p className="text-sm text-muted-foreground">
          Ya tiene una seña lista. La vista previa aparece cuando la entrada está publicada.
        </p>
      )}
      {otroEstado && sena.estado === 'vacia' && (
        <p className="flex items-center gap-2 text-sm">
          Estado actual:{' '}
          <EstadoSena vista="admin" estado={entrada.sena.estado} className="px-2 py-0.5 text-sm" />
        </p>
      )}
    </div>
  );
}

export function ImagenDeEntrada({
  entrada,
  onOcupada,
}: {
  entrada: EntradaAdmin;
  onOcupada: (ocupada: boolean) => void;
}) {
  const imagen = useSubirImagen(entrada.id);
  const publicados = useMediosPublicados(entrada);
  useEffect(() => onOcupada(imagen.ocupada), [imagen.ocupada, onOcupada]);

  const vistaPrevia = imagen.vistaPrevia
    ? { url: imagen.vistaPrevia }
    : publicados?.imagenUrl
      ? { url: publicados.imagenUrl }
      : null;

  return (
    <ZonaSubida
      tipo="imagen"
      titulo="Imagen del concepto"
      ayuda={`JPG, PNG o WebP · se reduce a 800 px · máximo ${imagenMaxKb} KB.`}
      accept={IMAGENES_ACEPTADAS.join(',')}
      estado={imagen.estado}
      progreso={imagen.progreso}
      error={imagen.error}
      anuncio={imagen.anuncio}
      vistaPrevia={vistaPrevia}
      descripcion={`Imagen del concepto: ${entrada.ingles}`}
      onElegir={(archivo) => void imagen.subir(archivo)}
      onCancelar={imagen.cancelar}
      onQuitar={imagen.quitar}
    />
  );
}
