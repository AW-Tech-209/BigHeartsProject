import { type ArgumentMetadata, type BadRequestException, ValidationPipe } from '@nestjs/common';
import {
  ApiErrorCode,
  CommunicationPreference,
  HearingLossLevel,
  type ValidationErrorDetail,
} from '@academia/types';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { validationExceptionFactory } from '../../common/validation/validation-exception.factory';
import { UpdateProfileDto } from './update-profile.dto';

/** Valida un payload plano contra el DTO y devuelve los campos con error. */
async function invalidFields(payload: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(UpdateProfileDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

const validPayload = {
  firstName: 'Nombre',
  lastName: 'Apellido',
};

describe('UpdateProfileDto (validación)', () => {
  it('acepta el payload mínimo (solo nombre y apellidos)', async () => {
    expect(await invalidFields(validPayload)).toHaveLength(0);
  });

  it('rechaza firstName vacío', async () => {
    expect(await invalidFields({ ...validPayload, firstName: '' })).toContain('firstName');
  });

  it('rechaza firstName con solo espacios (se recorta antes de validar)', async () => {
    expect(await invalidFields({ ...validPayload, firstName: '   ' })).toContain('firstName');
  });

  it('rechaza lastName vacío', async () => {
    expect(await invalidFields({ ...validPayload, lastName: '' })).toContain('lastName');
  });

  it('rechaza nombres demasiado largos', async () => {
    expect(await invalidFields({ ...validPayload, firstName: 'a'.repeat(101) })).toContain(
      'firstName',
    );
  });

  it('acepta preferencias de accesibilidad válidas', async () => {
    expect(
      await invalidFields({
        ...validPayload,
        hearingLossLevel: HearingLossLevel.SEVERE,
        communicationPreference: CommunicationPreference.SIGN_LANGUAGE,
      }),
    ).toHaveLength(0);
  });

  it('rechaza preferencias de accesibilidad inventadas', async () => {
    expect(await invalidFields({ ...validPayload, hearingLossLevel: 'INVENTADO' })).toContain(
      'hearingLossLevel',
    );
    expect(
      await invalidFields({ ...validPayload, communicationPreference: 'TELEPATIA' }),
    ).toContain('communicationPreference');
  });

  it('acepta `null` en las preferencias: es cómo se retira una ya declarada', async () => {
    expect(
      await invalidFields({
        ...validPayload,
        hearingLossLevel: null,
        communicationPreference: null,
      }),
    ).toHaveLength(0);
  });
});

/**
 * El DTO por sí solo no descarta nada: quien lo hace es el ValidationPipe
 * global (`whitelist` + `forbidNonWhitelisted`, ver CommonModule). Estos tests
 * lo reproducen con la MISMA configuración que la app, porque es la barrera que
 * sostiene AC6 (id ajeno) y AC7 (email/role) del contrato de la HU-103.
 */
describe('UpdateProfileDto a través del ValidationPipe global', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: validationExceptionFactory,
  });

  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: UpdateProfileDto,
    data: undefined,
  };

  /** Ejecuta el pipe y devuelve los campos señalados en el error, si lo hay. */
  async function pipeErrorFields(payload: Record<string, unknown>): Promise<string[]> {
    try {
      await pipe.transform(payload, metadata);
      return [];
    } catch (error) {
      const body = (error as BadRequestException).getResponse() as {
        code: string;
        fields: ValidationErrorDetail[];
      };
      expect(body.code).toBe(ApiErrorCode.VALIDATION_ERROR);
      return body.fields.map((field) => field.field);
    }
  }

  it('deja pasar un payload limpio y lo devuelve como instancia del DTO', async () => {
    const result = await pipe.transform(validPayload, metadata);

    expect(result).toBeInstanceOf(UpdateProfileDto);
    expect(result).toEqual({ firstName: 'Nombre', lastName: 'Apellido' });
  });

  it('rechaza `email` en el cuerpo: no es un campo editable desde el perfil (AC7)', async () => {
    expect(await pipeErrorFields({ ...validPayload, email: 'otro@academia.local' })).toContain(
      'email',
    );
  });

  it('rechaza `role` en el cuerpo: nadie se asciende a sí mismo (AC7)', async () => {
    expect(await pipeErrorFields({ ...validPayload, role: 'ADMIN' })).toContain('role');
  });

  it('rechaza un `id` ajeno en el cuerpo: el id sale del token (AC6)', async () => {
    expect(await pipeErrorFields({ ...validPayload, id: 'id-de-otra-persona' })).toContain('id');
  });

  it('devuelve VALIDATION_ERROR con details.fields[] cuando falta el nombre (AC5)', async () => {
    expect(await pipeErrorFields({ ...validPayload, firstName: '' })).toEqual(['firstName']);
  });
});
