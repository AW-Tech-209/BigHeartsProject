import type { ClassroomSupport, InstructionMode } from '@academia/types';

import { CheckboxCardGroup, type CheckboxCardOption } from '@/components/ui/checkbox-card-group';
import { RadioCardGroup, type RadioCardOption } from '@/components/ui/radio-card-group';
import {
  APOYOS_EN_ORDEN,
  descripcionModoInstruccion,
  etiquetaApoyo,
  etiquetaModoInstruccion,
  iconoApoyo,
  iconoModoInstruccion,
  MODOS_INSTRUCCION_EN_ORDEN,
} from '../lib/accesibilidad-aula';

const OPCIONES_MODO: RadioCardOption<InstructionMode>[] = MODOS_INSTRUCCION_EN_ORDEN.map(
  (modo) => ({
    value: modo,
    label: etiquetaModoInstruccion[modo],
    description: descripcionModoInstruccion[modo],
    icon: iconoModoInstruccion[modo],
  }),
);

const OPCIONES_APOYO: CheckboxCardOption<ClassroomSupport>[] = APOYOS_EN_ORDEN.map((apoyo) => ({
  value: apoyo,
  label: etiquetaApoyo[apoyo],
  icon: iconoApoyo[apoyo],
}));

export type ValoresAccesibilidadAula = {
  /** `null` solo mientras el profesor no ha elegido: no se puede enviar así. */
  instructionMode: InstructionMode | null;
  supports: ClassroomSupport[];
};

type SeccionAccesibilidadAulaProps = {
  values: ValoresAccesibilidadAula;
  /** Un `patch` parcial: es covariante con el objeto más grande del formulario que la monta. */
  onChange: (patch: Partial<ValoresAccesibilidadAula>) => void;
  /** Error de `instructionMode`, pintado bajo el grupo (AC3). */
  error?: string;
};

/**
 * Sección de accesibilidad compartida entre crear, editar y completar un aula.
 * El modo de instrucción es obligatorio y va primero; los apoyos, aparte y
 * opcionales (D42, D43). Sin estado propio, para que los formularios no se
 * desincronicen.
 */
export function SeccionAccesibilidadAula({
  values,
  onChange,
  error,
}: SeccionAccesibilidadAulaProps) {
  return (
    <fieldset className="space-y-6 rounded-xl border border-border bg-muted/40 p-5">
      <legend className="px-1 text-base font-medium text-foreground">Accesibilidad</legend>

      {/* `id` + `tabIndex={-1}`: el sitio al que `focusFirstError()` lleva el foco. */}
      <div
        id="instructionMode"
        tabIndex={-1}
        className="space-y-2 rounded-lg focus:ring-3 focus:ring-ring/50 focus:outline-none"
      >
        <p id="modo-instruccion-heading" className="text-sm font-medium text-foreground">
          ¿En qué lengua se imparte la clase?{' '}
          <span className="font-normal text-muted-foreground">(obligatorio)</span>
        </p>
        <p id="modo-instruccion-ayuda" className="max-w-[65ch] text-sm text-muted-foreground">
          Solo hay dos opciones porque solo hay dos formas de dar una clase a personas sordas:
          directamente en LSC o hablada con intérprete de LSC. Todo lo demás es un apoyo.
        </p>

        <RadioCardGroup
          name="instructionMode"
          labelledBy="modo-instruccion-heading"
          describedBy={
            error ? 'modo-instruccion-ayuda modo-instruccion-error' : 'modo-instruccion-ayuda'
          }
          options={OPCIONES_MODO}
          value={values.instructionMode}
          onChange={(modo) => onChange({ instructionMode: modo })}
        />

        {error && (
          <p
            id="modo-instruccion-error"
            role="alert"
            className="text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
      </div>

      <div className="space-y-2 border-t border-border pt-5">
        <p id="apoyos-heading" className="text-sm font-medium text-foreground">
          Apoyos <span className="font-normal text-muted-foreground">(opcionales)</span>
        </p>
        <p className="max-w-[65ch] text-sm text-muted-foreground">
          Se suman al modo de instrucción, nunca lo sustituyen.
        </p>
        <CheckboxCardGroup
          labelledBy="apoyos-heading"
          options={OPCIONES_APOYO}
          value={values.supports}
          onChange={(supports) => onChange({ supports })}
        />
      </div>
    </fieldset>
  );
}
