import { describe, expect, it } from 'vitest';

import { buildEmail } from './notification-templates';
import { NotificationType } from './notification.service';

describe('buildEmail', () => {
  it('incluye el aula y la hora con su zona explícita en BOOKING_CONFIRMED', () => {
    const email = buildEmail({
      type: NotificationType.BOOKING_CONFIRMED,
      recipient: { email: 'ana@academia.local', firstName: 'Ana' },
      classroom: {
        title: 'Inglés A1',
        scheduledAt: new Date('2026-08-12T18:00:00.000Z'),
        durationMinutes: 60,
      },
    });

    expect(email.text).toContain('Ana');
    expect(email.text).toContain('Inglés A1');
    expect(email.text).toContain('UTC');
    expect(email.html).toContain('Inglés A1');
  });

  it('tiene versión en texto plano para los cinco tipos de aviso', () => {
    const base = { recipient: { email: 'x@academia.local', firstName: 'X' } };
    const classroom = {
      title: 'Inglés A1',
      scheduledAt: new Date('2026-08-12T18:00:00.000Z'),
      durationMinutes: 60,
    };

    for (const type of Object.values(NotificationType)) {
      const email = buildEmail({ ...base, type, classroom });
      expect(email.text.length).toBeGreaterThan(0);
      expect(email.subject.length).toBeGreaterThan(0);
    }
  });
});
