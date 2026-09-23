import { describe, expect, it } from 'vitest';

import { ClassroomSupport, InstructionMode } from './accesibilidad-clase';
import {
  coincideConLaAccesibilidad,
  coincideConLaPreferencia,
  preferenciaDelUsuario,
} from './accesibilidad-aula';
import { CommunicationPreference } from './index';

describe('coincideConLaPreferencia', () => {
  it('sin modos declarados, no hay coincidencia', () => {
    expect(
      coincideConLaPreferencia({ communicationModes: [] }, CommunicationPreference.SIGN_LANGUAGE),
    ).toBe(false);
  });

  it('el modo del aula coincide con la preferencia del estudiante', () => {
    expect(
      coincideConLaPreferencia(
        { communicationModes: [CommunicationPreference.SIGN_LANGUAGE] },
        CommunicationPreference.SIGN_LANGUAGE,
      ),
    ).toBe(true);
  });

  it('el aula declara varios modos: coincide si la preferencia está entre ellos', () => {
    expect(
      coincideConLaPreferencia(
        {
          communicationModes: [
            CommunicationPreference.SIGN_LANGUAGE,
            CommunicationPreference.WRITTEN_TEXT,
          ],
        },
        CommunicationPreference.WRITTEN_TEXT,
      ),
    ).toBe(true);
  });

  it('ninguno de los modos del aula coincide con la preferencia', () => {
    expect(
      coincideConLaPreferencia(
        { communicationModes: [CommunicationPreference.LIP_READING] },
        CommunicationPreference.SIGN_LANGUAGE,
      ),
    ).toBe(false);
  });

  it('sin preferencia declarada (undefined), no hay coincidencia posible', () => {
    expect(
      coincideConLaPreferencia(
        { communicationModes: [CommunicationPreference.SIGN_LANGUAGE] },
        undefined,
      ),
    ).toBe(false);
  });

  it('sin preferencia declarada (null), no hay coincidencia posible', () => {
    expect(
      coincideConLaPreferencia(
        { communicationModes: [CommunicationPreference.SIGN_LANGUAGE] },
        null,
      ),
    ).toBe(false);
  });
});

describe('coincideConLaAccesibilidad', () => {
  it('coincidencia exacta: mismo modo de instrucción en aula y preferencia', () => {
    expect(
      coincideConLaAccesibilidad(
        { instructionMode: InstructionMode.LSC_NATIVA },
        { instructionMode: InstructionMode.LSC_NATIVA, supports: [] },
      ),
    ).toBe(true);
  });

  it('aula con intérprete no coincide con quien prefiere LSC nativa: son modos distintos', () => {
    expect(
      coincideConLaAccesibilidad(
        { instructionMode: InstructionMode.INTERPRETE_LSC },
        { instructionMode: InstructionMode.LSC_NATIVA, supports: [] },
      ),
    ).toBe(false);
  });

  it('aula sin declarar modo de instrucción, no hay coincidencia posible', () => {
    expect(
      coincideConLaAccesibilidad(
        { instructionMode: null },
        { instructionMode: InstructionMode.LSC_NATIVA, supports: [] },
      ),
    ).toBe(false);
  });
});

describe('preferenciaDelUsuario', () => {
  it('lleva el modo y los apoyos guardados a la forma con la que se compara un aula', () => {
    const preferencia = preferenciaDelUsuario({
      preferredInstructionMode: InstructionMode.INTERPRETE_LSC,
      preferredSupports: [ClassroomSupport.LIVE_CAPTIONS],
    });

    expect(preferencia).toEqual({
      instructionMode: InstructionMode.INTERPRETE_LSC,
      supports: [ClassroomSupport.LIVE_CAPTIONS],
    });
    expect(
      coincideConLaAccesibilidad({ instructionMode: InstructionMode.INTERPRETE_LSC }, preferencia),
    ).toBe(true);
  });
});
