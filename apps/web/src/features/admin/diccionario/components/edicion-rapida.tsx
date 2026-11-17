import { type EntradaAdmin, TIPO_ENTRADA_LABELS, TipoEntrada } from '@academia/types';
import { Check, CircleAlert, LoaderCircle } from 'lucide-react';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';
import { useEditarEntrada } from '../hooks/use-admin-diccionario';

type EdicionRapidaProps = {
  entrada: EntradaAdmin;
  onCancelar: () => void;
  onGuardado: (entrada: EntradaAdmin) => void;
  className?: string;
};

/** Inglés, español y tipo en la misma fila. Enter guarda, Esc cancela; sin mutación optimista. */
export function EdicionRapida({ entrada, onCancelar, onGuardado, className }: EdicionRapidaProps) {
  const id = useId();
  const primero = useRef<HTMLInputElement>(null);
  const editar = useEditarEntrada();
  const [ingles, setIngles] = useState(entrada.ingles);
  const [espanol, setEspanol] = useState(entrada.espanol);
  const [tipo, setTipo] = useState(entrada.tipo);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => primero.current?.focus(), []);

  async function guardar() {
    if (editar.isPending) return;
    if (!ingles.trim() || !espanol.trim()) {
      setError('El inglés y el español no pueden quedar vacíos.');
      return;
    }
    setError(null);
    try {
      const guardada = await editar.mutateAsync({
        id: entrada.id,
        input: { ingles: ingles.trim(), espanol: espanol.trim(), tipo },
      });
      onGuardado(guardada);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar. Inténtalo de nuevo.');
    }
  }

  function alTeclear(evento: KeyboardEvent<HTMLElement>) {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      void guardar();
    } else if (evento.key === 'Escape' && !editar.isPending) {
      evento.preventDefault();
      onCancelar();
    }
  }

  return (
    <div
      role="group"
      aria-label={`Edición rápida de ${entrada.ingles}`}
      className={cn('space-y-3', className)}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_10rem]">
        <div className="space-y-1">
          <label htmlFor={`${id}-ingles`} className="text-sm text-muted-foreground">
            Inglés
          </label>
          <Input
            ref={primero}
            id={`${id}-ingles`}
            lang="en"
            value={ingles}
            readOnly={editar.isPending}
            aria-invalid={error !== null && !ingles.trim()}
            onChange={(e) => setIngles(e.target.value)}
            onKeyDown={alTeclear}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-espanol`} className="text-sm text-muted-foreground">
            Español
          </label>
          <Input
            id={`${id}-espanol`}
            value={espanol}
            readOnly={editar.isPending}
            aria-invalid={error !== null && !espanol.trim()}
            onChange={(e) => setEspanol(e.target.value)}
            onKeyDown={alTeclear}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-tipo`} className="text-sm text-muted-foreground">
            Tipo
          </label>
          <NativeSelect
            id={`${id}-tipo`}
            value={tipo}
            disabled={editar.isPending}
            onChange={(e) => setTipo(e.target.value as TipoEntrada)}
            onKeyDown={alTeclear}
          >
            {Object.values(TipoEntrada).map((t) => (
              <option key={t} value={t}>
                {TIPO_ENTRADA_LABELS[t]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-base text-destructive">
          <CircleAlert aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <p className="text-sm text-muted-foreground">
          Edición rápida · <strong>Enter</strong> guarda · <strong>Esc</strong> cancela
        </p>
        <Button
          variant="outline"
          className="h-11 px-4 text-base"
          disabled={editar.isPending}
          onClick={onCancelar}
        >
          Cancelar
        </Button>
        <Button className="h-11 gap-2 px-4 text-base" onClick={() => void guardar()}>
          {editar.isPending ? (
            <>
              <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-4 animate-spin" />
              Guardando…
            </>
          ) : (
            <>
              <Check aria-hidden="true" strokeWidth={2} className="size-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
