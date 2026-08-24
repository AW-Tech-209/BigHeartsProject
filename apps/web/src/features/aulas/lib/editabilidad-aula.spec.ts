import { ClassroomStatus } from '@academia/types';
import { describe, expect, it } from 'vitest';

import { esAulaEditable } from './editabilidad-aula';

const AHORA = new Date('2027-08-12T18:00:00.000Z');

describe('esAulaEditable', () => {
  it('un aula futura y publicada es editable', () => {
    expect(
      esAulaEditable(
        { status: ClassroomStatus.PUBLISHED, scheduledAt: '2027-08-12T19:00:00.000Z' },
        AHORA,
      ),
    ).toBe(true);
  });

  it('un aula que ya empezó no es editable', () => {
    expect(
      esAulaEditable(
        { status: ClassroomStatus.PUBLISHED, scheduledAt: '2027-08-12T17:00:00.000Z' },
        AHORA,
      ),
    ).toBe(false);
  });

  it('un aula CANCELLED no es editable aunque sea futura', () => {
    expect(
      esAulaEditable(
        { status: ClassroomStatus.CANCELLED, scheduledAt: '2027-08-12T19:00:00.000Z' },
        AHORA,
      ),
    ).toBe(false);
  });
});
