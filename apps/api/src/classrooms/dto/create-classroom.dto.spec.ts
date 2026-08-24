import { type BadRequestException } from '@nestjs/common';
import {
  ApiErrorCode,
  CommunicationPreference,
  EnglishLevel,
  MeetingProvider,
  type ValidationErrorDetail,
} from '@academia/types';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { validationExceptionFactory } from '../../common/validation/validation-exception.factory';
import { CreateClassroomDto } from './create-classroom.dto';

/** Valida un payload plano contra el DTO y devuelve los campos con error. */
async function camposInvalidos(payload: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(CreateClassroomDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

/** Un instante futuro estable, para que el test no caduque. */
const FUTURO = '2099-08-12T23:00:00.000Z';

const payloadValido = {
  title: 'Conversación cotidiana',
  description: 'Practicamos saludos y presentaciones.',
  level: EnglishLevel.BEGINNER,
  maxStudents: 8,
  scheduledAt: FUTURO,
  durationMinutes: 60,
  meetingLink: 'https://meet.google.com/abc-defg-hij',
  communicationModes: [CommunicationPreference.WRITTEN_TEXT],
  meetingProvider: MeetingProvider.GOOGLE_MEET,
};

describe('CreateClassroomDto (validación)', () => {
  it('acepta un aula bien formada', async () => {
    expect(await camposInvalidos(payloadValido)).toHaveLength(0);
  });

  it('recorta los espacios antes de validar', async () => {
    const dto = plainToInstance(CreateClassroomDto, {
      ...payloadValido,
      title: '  Conversación cotidiana  ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.title).toBe('Conversación cotidiana');
  });

  it('rechaza un título vacío o de solo espacios', async () => {
    expect(await camposInvalidos({ ...payloadValido, title: '' })).toContain('title');
    expect(await camposInvalidos({ ...payloadValido, title: '   ' })).toContain('title');
  });

  it('rechaza una descripción vacía', async () => {
    expect(await camposInvalidos({ ...payloadValido, description: '' })).toContain('description');
  });

  it('rechaza un nivel que no es de la lista', async () => {
    expect(await camposInvalidos({ ...payloadValido, level: 'EXPERTO' })).toContain('level');
  });

  // AC4
  describe('maxStudents', () => {
    it.each([0, -1, -50])('rechaza %i', async (maxStudents) => {
      expect(await camposInvalidos({ ...payloadValido, maxStudents })).toContain('maxStudents');
    });

    it('rechaza un decimal: media plaza no existe', async () => {
      expect(await camposInvalidos({ ...payloadValido, maxStudents: 3.5 })).toContain(
        'maxStudents',
      );
    });

    /**
     * No es una regla de negocio: es el techo de la columna `Int`. Sin este
     * tope, el número llega a Postgres, la inserción revienta y el profesor
     * recibe un 500 en lugar de un error de campo que pueda corregir.
     */
    it('rechaza un número mayor que el máximo de la columna', async () => {
      expect(await camposInvalidos({ ...payloadValido, maxStudents: 9999999999 })).toContain(
        'maxStudents',
      );
    });
  });

  // AC4
  describe('durationMinutes', () => {
    it.each([0, -1, -30])('rechaza %i', async (durationMinutes) => {
      expect(await camposInvalidos({ ...payloadValido, durationMinutes })).toContain(
        'durationMinutes',
      );
    });
  });

  // AC4
  describe('meetingLink', () => {
    it.each(['no-es-una-url', 'meet.google.com/abc', 'javascript:alert(1)', ''])(
      'rechaza %j',
      async (meetingLink) => {
        expect(await camposInvalidos({ ...payloadValido, meetingLink })).toContain('meetingLink');
      },
    );

    it('acepta http y https con dominio', async () => {
      expect(
        await camposInvalidos({ ...payloadValido, meetingLink: 'https://zoom.us/j/1234567890' }),
      ).toHaveLength(0);
      expect(
        await camposInvalidos({ ...payloadValido, meetingLink: 'http://aula.ejemplo.test/sala' }),
      ).toHaveLength(0);
    });
  });

  // AC1: un aula nueva no puede quedar «sin indicar».
  describe('communicationModes', () => {
    it('rechaza un array vacío', async () => {
      expect(await camposInvalidos({ ...payloadValido, communicationModes: [] })).toContain(
        'communicationModes',
      );
    });

    it('rechaza si falta el campo', async () => {
      const { communicationModes: _omitido, ...sinModos } = payloadValido;
      expect(await camposInvalidos(sinModos)).toContain('communicationModes');
    });

    it('rechaza un valor que no es del catálogo', async () => {
      expect(
        await camposInvalidos({ ...payloadValido, communicationModes: ['TELEPATIA'] }),
      ).toContain('communicationModes');
    });

    it('acepta varios modos a la vez', async () => {
      expect(
        await camposInvalidos({
          ...payloadValido,
          communicationModes: [
            CommunicationPreference.SIGN_LANGUAGE,
            CommunicationPreference.LIP_READING,
          ],
        }),
      ).toHaveLength(0);
    });
  });

  // `DAILY` está reservado a Fase 1.5: no es una plataforma que el profesor
  // pueda declarar al pegar un enlace manual.
  describe('meetingProvider', () => {
    it('rechaza DAILY', async () => {
      expect(
        await camposInvalidos({ ...payloadValido, meetingProvider: MeetingProvider.DAILY }),
      ).toContain('meetingProvider');
    });

    it.each([MeetingProvider.MANUAL, MeetingProvider.GOOGLE_MEET, MeetingProvider.ZOOM])(
      'acepta %s',
      async (meetingProvider) => {
        expect(await camposInvalidos({ ...payloadValido, meetingProvider })).toHaveLength(0);
      },
    );
  });

  // AC4 y AC6
  describe('scheduledAt', () => {
    it('rechaza una fecha en el pasado', async () => {
      expect(
        await camposInvalidos({ ...payloadValido, scheduledAt: '2020-01-01T10:00:00.000Z' }),
      ).toContain('scheduledAt');
    });

    it('rechaza el instante actual: la clase tiene que empezar después', async () => {
      expect(
        await camposInvalidos({ ...payloadValido, scheduledAt: new Date().toISOString() }),
      ).toContain('scheduledAt');
    });

    /**
     * Sin zona, `2099-08-12T18:00:00` significa un instante distinto en el
     * portátil de un dev y en el servidor de Render. `scheduledAt` identifica
     * un momento y solo uno (§4.7), así que la zona no es opcional.
     */
    it('rechaza una fecha sin zona horaria explícita', async () => {
      expect(
        await camposInvalidos({ ...payloadValido, scheduledAt: '2099-08-12T18:00:00' }),
      ).toContain('scheduledAt');
      expect(await camposInvalidos({ ...payloadValido, scheduledAt: '2099-08-12' })).toContain(
        'scheduledAt',
      );
    });

    it('acepta un desfase explícito además de Z', async () => {
      expect(
        await camposInvalidos({ ...payloadValido, scheduledAt: '2099-08-12T18:00:00-05:00' }),
      ).toHaveLength(0);
    });

    it('rechaza una fecha que no existe', async () => {
      expect(
        await camposInvalidos({ ...payloadValido, scheduledAt: '2099-02-31T18:00:00Z' }),
      ).toContain('scheduledAt');
    });

    it('explica el problema real: pasado y formato dan mensajes distintos', async () => {
      const mensajeDe = async (scheduledAt: string): Promise<string> => {
        const errores = await validate(
          plainToInstance(CreateClassroomDto, { ...payloadValido, scheduledAt }),
        );
        return Object.values(errores[0]?.constraints ?? {})[0] ?? '';
      };

      expect(await mensajeDe('2020-01-01T10:00:00.000Z')).toMatch(/futuro/i);
      expect(await mensajeDe('mañana')).not.toMatch(/futuro/i);
    });
  });

  /**
   * HU-212, AC7. El acuse de recibo del aviso de poca antelación. Es opcional
   * —la inmensa mayoría de las clases se publican con margen de sobra— pero
   * tiene que existir en el DTO: con `whitelist` + `forbidNonWhitelisted`, un
   * campo no declarado no se ignora, se rechaza, y el reintento del profesor
   * moriría con un `VALIDATION_ERROR` en vez de publicar la clase.
   */
  describe('confirmarPocaAntelacion', () => {
    it('es opcional', async () => {
      expect(await camposInvalidos(payloadValido)).toHaveLength(0);
    });

    it('acepta el booleano', async () => {
      expect(
        await camposInvalidos({ ...payloadValido, confirmarPocaAntelacion: true }),
      ).toHaveLength(0);
    });

    it('rechaza cualquier cosa que no sea booleana', async () => {
      expect(await camposInvalidos({ ...payloadValido, confirmarPocaAntelacion: 'sí' })).toContain(
        'confirmarPocaAntelacion',
      );
    });
  });

  /**
   * AC4: el formulario necesita `details.fields[]` para pintar el error BAJO
   * cada campo. Sin esa lista, lo único que puede hacer la pantalla es un
   * mensaje genérico arriba, y quien lee español como segunda lengua se queda
   * buscando cuál de los siete campos está mal.
   */
  it('produce VALIDATION_ERROR con un detalle por campo', async () => {
    const dto = plainToInstance(CreateClassroomDto, {
      ...payloadValido,
      title: '',
      maxStudents: 0,
      meetingLink: 'no-es-una-url',
    });

    const excepcion: BadRequestException = validationExceptionFactory(await validate(dto));
    const body = excepcion.getResponse() as {
      code: string;
      fields: ValidationErrorDetail[];
    };

    expect(body.code).toBe(ApiErrorCode.VALIDATION_ERROR);
    expect(body.fields.map((field) => field.field).sort()).toEqual([
      'maxStudents',
      'meetingLink',
      'title',
    ]);
    // Cada mensaje dice qué hacer, no «valor inválido».
    for (const field of body.fields) {
      expect(field.message.length).toBeGreaterThan(10);
    }
  });
});
