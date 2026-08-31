import { describe, expect, it } from 'vitest';

import { seSolapan } from '../src/classrooms/coherencia-temporal.rules';
import {
  AULA_LLENA,
  AULA_ULTIMO_CUPO,
  AULAS_DE_DEMOSTRACION,
  contarReservasConCupoPorAula,
  RESERVAS_DE_DEMOSTRACION,
  USUARIOS_DE_PRUEBA,
} from './seed-data';

describe('contarReservasConCupoPorAula', () => {
  it('cuenta CONFIRMED, ATTENDED y NO_SHOW, agrupadas por aula, sin las CANCELLED', () => {
    const conteo = contarReservasConCupoPorAula([
      { classroomId: 'a', status: 'CONFIRMED' },
      { classroomId: 'a', status: 'ATTENDED' },
      { classroomId: 'a', status: 'CANCELLED' },
      { classroomId: 'b', status: 'NO_SHOW' },
    ]);

    expect(conteo.get('a')).toBe(2);
    expect(conteo.get('b')).toBe(1);
  });
});

describe('RESERVAS_DE_DEMOSTRACION — invariantes del seed (HU-307)', () => {
  const confirmadasPorAula = contarReservasConCupoPorAula(RESERVAS_DE_DEMOSTRACION);
  const emailsDeUsuarios = new Set(USUARIOS_DE_PRUEBA.map((u) => u.email));

  it('AC4: currentBookings nunca supera maxStudents en ninguna aula', () => {
    for (const aula of AULAS_DE_DEMOSTRACION) {
      const confirmadas = confirmadasPorAula.get(aula.id) ?? 0;
      expect(confirmadas).toBeLessThanOrEqual(aula.maxStudents);
    }
  });

  it('AC3: hay un aula con exactamente el último cupo libre y otra llena', () => {
    const ultimoCupo = AULAS_DE_DEMOSTRACION.find((a) => a.id === AULA_ULTIMO_CUPO)!;
    const llena = AULAS_DE_DEMOSTRACION.find((a) => a.id === AULA_LLENA)!;

    expect(confirmadasPorAula.get(AULA_ULTIMO_CUPO)).toBe(ultimoCupo.maxStudents - 1);
    expect(confirmadasPorAula.get(AULA_LLENA)).toBe(llena.maxStudents);
  });

  it('toda reserva referencia un estudiante y un aula sembrados de verdad', () => {
    const idsDeAulas = new Set(AULAS_DE_DEMOSTRACION.map((a) => a.id));

    for (const reserva of RESERVAS_DE_DEMOSTRACION) {
      expect(emailsDeUsuarios.has(reserva.studentEmail)).toBe(true);
      expect(idsDeAulas.has(reserva.classroomId)).toBe(true);
    }
  });

  it('regla 4: ningún estudiante tiene dos reservas CONFIRMED que se solapen', () => {
    const aulaPorId = new Map(AULAS_DE_DEMOSTRACION.map((a) => [a.id, a]));
    const porEstudiante = new Map<string, { scheduledAt: Date; durationMinutes: number }[]>();

    for (const reserva of RESERVAS_DE_DEMOSTRACION) {
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
    const canceladas = RESERVAS_DE_DEMOSTRACION.filter((r) => r.status === 'CANCELLED');

    expect(canceladas.length).toBeGreaterThan(0);
    for (const reserva of canceladas) {
      expect(reserva.cancelledAtInMinutes).toBeDefined();
    }
  });

  it('ninguna pareja (estudiante, aula) se repite', () => {
    const claves = RESERVAS_DE_DEMOSTRACION.map((r) => `${r.studentEmail}:${r.classroomId}`);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it('HU-406 AC2/T2: al menos un aula pasada mezcla ATTENDED y NO_SHOW', () => {
    const estadosPorAula = new Map<string, Set<string>>();
    for (const reserva of RESERVAS_DE_DEMOSTRACION) {
      const estados = estadosPorAula.get(reserva.classroomId) ?? new Set<string>();
      estados.add(reserva.status);
      estadosPorAula.set(reserva.classroomId, estados);
    }

    const hayAulaMixta = [...estadosPorAula.values()].some(
      (estados) => estados.has('ATTENDED') && estados.has('NO_SHOW'),
    );
    expect(hayAulaMixta).toBe(true);
  });

  it('HU-406 AC1/T3: el estudiante del seed tiene las tres salidas', () => {
    const delEstudiante = RESERVAS_DE_DEMOSTRACION.filter(
      (r) => r.studentEmail === 'alumno@academia.local',
    ).map((r) => r.status);

    expect(delEstudiante).toContain('ATTENDED');
    expect(delEstudiante).toContain('NO_SHOW');
    expect(delEstudiante).toContain('CANCELLED');
  });

  it('HU-406 AC3/T4: hay un aula pasada sin ninguna reserva marcada', () => {
    const ahora = Date.now();
    const aulasPasadasSinMarcar = AULAS_DE_DEMOSTRACION.filter((aula) => {
      const yaPaso = ahora + aula.scheduledInMinutes * 60_000 < ahora;
      if (!yaPaso) return false;
      const reservas = RESERVAS_DE_DEMOSTRACION.filter((r) => r.classroomId === aula.id);
      return reservas.every((r) => r.status === 'CONFIRMED');
    });

    expect(aulasPasadasSinMarcar.length).toBeGreaterThan(0);
  });
});
