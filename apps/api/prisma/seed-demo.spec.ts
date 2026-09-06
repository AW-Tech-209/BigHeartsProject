/**
 * Invariantes de negocio del seed de datos de prueba (`seed-demo.ts`).
 *
 * Prueba los ARRAYS de datos, no la escritura: `seed-demo.ts` no toca la BD al
 * importarlo (solo corre `main()` cuando se lanza como script). Así se verifican
 * las reglas de `docs/ARQUITECTURA.md` §4 sin levantar Postgres.
 */
import { describe, expect, it } from 'vitest';

import { seSolapan } from '../src/classrooms/coherencia-temporal.rules';
import { AULA, AULAS, contarReservasConCupo, RESERVAS, USUARIOS } from './seed-demo';

const ALUMNO = 'demo.alumno@bighearts.local';

describe('contarReservasConCupo', () => {
  it('cuenta CONFIRMED, ATTENDED y NO_SHOW, agrupadas por aula, sin las CANCELLED', () => {
    const conteo = contarReservasConCupo([
      { classroomId: 'a', status: 'CONFIRMED' },
      { classroomId: 'a', status: 'ATTENDED' },
      { classroomId: 'a', status: 'CANCELLED' },
      { classroomId: 'b', status: 'NO_SHOW' },
    ]);

    expect(conteo.get('a')).toBe(2);
    expect(conteo.get('b')).toBe(1);
  });
});

describe('seed-demo — invariantes del seed', () => {
  const conCupoPorAula = contarReservasConCupo(RESERVAS);
  const emailsDeUsuarios = new Set(USUARIOS.map((u) => u.email));

  it('AC4: currentBookings nunca supera maxStudents en ninguna aula', () => {
    for (const aula of AULAS) {
      expect(conCupoPorAula.get(aula.id) ?? 0).toBeLessThanOrEqual(aula.maxStudents);
    }
  });

  it('AC3: hay un aula con exactamente el último cupo libre y otra llena', () => {
    const ultimoCupo = AULAS.find((a) => a.id === AULA.ULTIMOS_CUPOS)!;
    const llena = AULAS.find((a) => a.id === AULA.LLENA)!;

    expect(conCupoPorAula.get(AULA.ULTIMOS_CUPOS)).toBe(ultimoCupo.maxStudents - 1);
    expect(conCupoPorAula.get(AULA.LLENA)).toBe(llena.maxStudents);
  });

  it('toda reserva referencia un estudiante y un aula sembrados de verdad', () => {
    const idsDeAulas = new Set(AULAS.map((a) => a.id));

    for (const reserva of RESERVAS) {
      expect(emailsDeUsuarios.has(reserva.studentEmail)).toBe(true);
      expect(idsDeAulas.has(reserva.classroomId)).toBe(true);
    }
  });

  it('regla 4: ningún estudiante tiene dos reservas CONFIRMED que se solapen', () => {
    const aulaPorId = new Map(AULAS.map((a) => [a.id, a]));
    const porEstudiante = new Map<string, { scheduledAt: Date; durationMinutes: number }[]>();

    for (const reserva of RESERVAS) {
      if (reserva.status !== 'CONFIRMED') continue;
      const aula = aulaPorId.get(reserva.classroomId)!;
      const intervalo = {
        scheduledAt: new Date(aula.scheduledInMinutes * 60_000),
        durationMinutes: aula.durationMinutes,
      };
      const previos = porEstudiante.get(reserva.studentEmail) ?? [];

      for (const previo of previos) {
        expect(seSolapan(intervalo, previo)).toBe(false);
      }
      porEstudiante.set(reserva.studentEmail, [...previos, intervalo]);
    }
  });

  it('regla 3: la reserva CANCELLED lleva su cancelledAt', () => {
    const canceladas = RESERVAS.filter((r) => r.status === 'CANCELLED');

    expect(canceladas.length).toBeGreaterThan(0);
    for (const reserva of canceladas) {
      expect(reserva.cancelledAtInMinutes).toBeDefined();
    }
  });

  it('ninguna pareja (estudiante, aula) se repite', () => {
    const claves = RESERVAS.map((r) => `${r.studentEmail}:${r.classroomId}`);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it('HU-406 AC2/T2: al menos un aula pasada mezcla ATTENDED y NO_SHOW', () => {
    const estadosPorAula = new Map<string, Set<string>>();
    for (const reserva of RESERVAS) {
      const estados = estadosPorAula.get(reserva.classroomId) ?? new Set<string>();
      estados.add(reserva.status);
      estadosPorAula.set(reserva.classroomId, estados);
    }

    const hayAulaMixta = [...estadosPorAula.values()].some(
      (estados) => estados.has('ATTENDED') && estados.has('NO_SHOW'),
    );
    expect(hayAulaMixta).toBe(true);
  });

  it('cada profesor activo tiene al menos un aula pasada con asistencia marcada', () => {
    const marcadasPorAula = new Set(
      RESERVAS.filter((r) => r.status === 'ATTENDED' || r.status === 'NO_SHOW').map(
        (r) => r.classroomId,
      ),
    );
    const profesConHistorial = new Set(
      AULAS.filter((a) => marcadasPorAula.has(a.id)).map((a) => a.teacherEmail),
    );

    expect(profesConHistorial).toContain('demo.profe@bighearts.local');
    expect(profesConHistorial).toContain('demo.profe2@bighearts.local');
  });

  it('HU-406 AC1/T3: el estudiante del seed tiene las tres salidas', () => {
    const delEstudiante = RESERVAS.filter((r) => r.studentEmail === ALUMNO).map((r) => r.status);

    expect(delEstudiante).toContain('ATTENDED');
    expect(delEstudiante).toContain('NO_SHOW');
    expect(delEstudiante).toContain('CANCELLED');
  });

  it('HU-406 AC3/T4: hay un aula pasada sin ninguna reserva marcada', () => {
    const aulasPasadasSinMarcar = AULAS.filter((aula) => {
      if (aula.scheduledInMinutes >= 0) return false;
      const reservas = RESERVAS.filter((r) => r.classroomId === aula.id);
      return reservas.length > 0 && reservas.every((r) => r.status === 'CONFIRMED');
    });

    expect(aulasPasadasSinMarcar.length).toBeGreaterThan(0);
  });

  it('el panel del profesor tiene modos que resumir: varios rellenos con preferencia', () => {
    const conPreferencia = USUARIOS.filter(
      (u) => u.role === 'STUDENT' && u.communicationPreference,
    );
    expect(conPreferencia.length).toBeGreaterThanOrEqual(3);
  });

  it('cubre las cuentas de borde del login: PENDING, REJECTED y SUSPENDED', () => {
    const estados = new Set(USUARIOS.map((u) => u.status));
    expect(estados).toContain('PENDING');
    expect(estados).toContain('REJECTED');
    expect(estados).toContain('SUSPENDED');
  });
});
