import type { ClassroomSupport, InstructionMode } from '@academia/types';

import { CheckboxCardGroup, type CheckboxCardOption } from '@/components/ui/checkbox-card-group';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import {
  APOYOS_EN_ORDEN,
  etiquetaApoyo,
  etiquetaModoInstruccion,
  iconoApoyo,
  MODOS_INSTRUCCION_EN_ORDEN,
} from '@/features/aulas/lib/accesibilidad-aula';

const OPCIONES_APOYO: CheckboxCardOption<ClassroomSupport>[] = APOYOS_EN_ORDEN.map((apoyo) => ({
  value: apoyo,
  label: etiquetaApoyo[apoyo],
  icon: iconoApoyo[apoyo],
}));

type CamposPreferenciaProps = {
  /** `''` = «Prefiero no indicarlo». */
  modo: InstructionMode | '';
  apoyos: ClassroomSupport[];
  onModo: (modo: InstructionMode | '') => void;
  onApoyos: (apoyos: ClassroomSupport[]) => void;
  errorModo?: string;
  errorApoyos?: string;
};

/**
 * La preferencia del estudiante con el vocabulario del aula (D44), compartida
 * por registro y perfil: un modo de instrucción —uno solo, opcional— y los
 * apoyos que le sirven, varios a la vez.
 */
export function CamposPreferencia({
  modo,
  apoyos,
  onModo,
  onApoyos,
  errorModo,
  errorApoyos,
}: CamposPreferenciaProps) {
  return (
    <>
      <Field
        id="preferredInstructionMode"
        label="Modo de instrucción que prefieres"
        description="Con él destacamos las clases que coinciden contigo. Nunca te ocultamos ninguna."
        error={errorModo}
      >
        <NativeSelect
          name="preferredInstructionMode"
          value={modo}
          onChange={(event) => onModo(event.target.value as InstructionMode | '')}
        >
          <option value="">Prefiero no indicarlo</option>
          {MODOS_INSTRUCCION_EN_ORDEN.map((opcion) => (
            <option key={opcion} value={opcion}>
              {etiquetaModoInstruccion[opcion]}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <div id="preferredSupports" tabIndex={-1} className="space-y-2 rounded-lg outline-none">
        <p id="apoyos-preferidos-heading" className="text-sm font-medium text-foreground">
          Apoyos que te sirven{' '}
          <span className="font-normal text-muted-foreground">(opcionales)</span>
        </p>
        <CheckboxCardGroup
          labelledBy="apoyos-preferidos-heading"
          options={OPCIONES_APOYO}
          value={apoyos}
          onChange={onApoyos}
        />
        {errorApoyos && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {errorApoyos}
          </p>
        )}
      </div>
    </>
  );
}
