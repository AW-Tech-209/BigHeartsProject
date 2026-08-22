import { CommunicationPreference, MeetingProvider } from '@academia/types';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { UpdateClassroomAccessibilityDto } from './update-classroom-accessibility.dto';

/** Valida un payload plano contra el DTO y devuelve los campos con error. */
async function camposInvalidos(payload: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(UpdateClassroomAccessibilityDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

describe('UpdateClassroomAccessibilityDto (validación)', () => {
  it('acepta solo los modos: los apoyos y la plataforma son opcionales', async () => {
    expect(
      await camposInvalidos({ communicationModes: [CommunicationPreference.SIGN_LANGUAGE] }),
    ).toHaveLength(0);
  });

  it('acepta los 5 campos completos', async () => {
    expect(
      await camposInvalidos({
        communicationModes: [
          CommunicationPreference.SIGN_LANGUAGE,
          CommunicationPreference.LIP_READING,
        ],
        hasInterpreter: true,
        hasLiveCaptions: true,
        hasVisualMaterials: false,
        meetingProvider: MeetingProvider.ZOOM,
      }),
    ).toHaveLength(0);
  });

  // Es la única razón de que este endpoint exista: sacar a un aula de «sin
  // indicar». Un array vacío no cumple ese propósito.
  it('rechaza un array de modos vacío', async () => {
    expect(await camposInvalidos({ communicationModes: [] })).toContain('communicationModes');
  });

  it('rechaza si falta el campo communicationModes', async () => {
    expect(await camposInvalidos({ hasInterpreter: true })).toContain('communicationModes');
  });

  it('rechaza un modo que no es del catálogo', async () => {
    expect(await camposInvalidos({ communicationModes: ['TELEPATIA'] })).toContain(
      'communicationModes',
    );
  });

  // Misma lista acotada que en la creación: `DAILY` no se ofrece.
  it('rechaza DAILY como plataforma', async () => {
    expect(
      await camposInvalidos({
        communicationModes: [CommunicationPreference.WRITTEN_TEXT],
        meetingProvider: MeetingProvider.DAILY,
      }),
    ).toContain('meetingProvider');
  });
});
