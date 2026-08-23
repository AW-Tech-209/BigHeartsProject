import {
  type ClassroomListItem,
  ClassroomStatus,
  CommunicationPreference,
  EnglishLevel,
  MeetingProvider,
} from '@academia/types';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { esperarSinFallosDeAccesibilidad } from '@/test/accesibilidad';
import { renderConProviders, type Tema } from '@/test/render-con-providers';
import { TarjetaAula } from './tarjeta-aula';

const TEMAS: Tema[] = ['light', 'dark', 'hc'];
const AHORA = new Date('2026-08-20T12:00:00.000Z');

function aula(overrides: Partial<ClassroomListItem> = {}): ClassroomListItem {
  return {
    id: 'aula-1',
    teacherId: 'profe-1',
    title: 'Conversación cotidiana',
    description: 'Practicamos saludos y presentaciones.',
    level: EnglishLevel.INTERMEDIATE,
    maxStudents: 10,
    currentBookings: 2,
    scheduledAt: new Date(AHORA.getTime() + 2 * 60 * 60_000).toISOString(),
    durationMinutes: 60,
    meetingProvider: MeetingProvider.MANUAL,
    status: ClassroomStatus.PUBLISHED,
    isRecurring: false,
    communicationModes: [],
    hasInterpreter: false,
    hasLiveCaptions: false,
    hasVisualMaterials: false,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    teacherFirstName: 'Ana',
    teacherLastName: 'Restrepo',
    ...overrides,
  };
}

describe('<TarjetaAula /> — anatomía (layout-y-composicion.md)', () => {
  it('el nombre accesible de la tarjeta es el título, no la fecha', () => {
    renderConProviders(<TarjetaAula classroom={aula()} ahora={AHORA} />);

    expect(screen.getByRole('article', { name: 'Conversación cotidiana' })).toBeInTheDocument();
  });

  it('la fecha aparece ANTES que el título en el DOM', () => {
    const { container } = renderConProviders(<TarjetaAula classroom={aula()} ahora={AHORA} />);

    const textos = Array.from(container.querySelectorAll('p, h3')).map((el) => el.textContent);
    // El año siempre aparece en `describirHorario()`; es un texto que solo
    // puede ser la línea de fecha, sin depender de la zona horaria del runner.
    const indiceFecha = textos.findIndex((t) => t?.includes('2026'));
    const indiceTitulo = textos.indexOf('Conversación cotidiana');

    expect(indiceFecha).toBeGreaterThanOrEqual(0);
    expect(indiceFecha).toBeLessThan(indiceTitulo);
  });

  it('muestra el nombre del profesor y el nivel', () => {
    renderConProviders(<TarjetaAula classroom={aula()} ahora={AHORA} />);

    expect(screen.getByText('Ana Restrepo · Intermedio')).toBeInTheDocument();
  });

  it('lleva el riel de 4px con el color del estado derivado', () => {
    const { container } = renderConProviders(
      // 3 de 10 ocupadas: quedan 7, > umbral de últimos cupos → disponible.
      <TarjetaAula classroom={aula({ currentBookings: 3 })} ahora={AHORA} />,
    );

    const riel = container.querySelector('span[aria-hidden="true"]');
    expect(riel).toHaveClass('bg-success');
  });

  it('muestra el badge de estado con el texto correspondiente', () => {
    renderConProviders(
      <TarjetaAula classroom={aula({ currentBookings: 8, maxStudents: 10 })} ahora={AHORA} />,
    );

    expect(screen.getByText('Quedan 2 cupos')).toBeInTheDocument();
  });
});

/**
 * HU-204, B6 — la deuda que HU-207 dejó anotada: la tarjeta lleva al detalle.
 *
 * Se comprueba en el componente y no solo en la página porque las **dos**
 * perspectivas tienen que enlazar: es la misma tarjeta la que sirve al catálogo
 * y a «Mis aulas».
 */
describe('<TarjetaAula /> — el título enlaza al detalle (B6, AC8)', () => {
  it.each(['catalogo', 'profesor'] as const)(
    'en la perspectiva %s, el título es un enlace a /aulas/:id',
    (perspectiva) => {
      renderConProviders(
        <TarjetaAula classroom={aula({ id: 'aula-42' })} perspectiva={perspectiva} ahora={AHORA} />,
      );

      expect(screen.getByRole('link', { name: 'Conversación cotidiana' })).toHaveAttribute(
        'href',
        '/aulas/aula-42',
      );
    },
  );

  it('se alcanza con el teclado y deja el foco dentro de la tarjeta', async () => {
    const { user } = renderConProviders(<TarjetaAula classroom={aula()} ahora={AHORA} />);

    await user.tab();

    const enlace = screen.getByRole('link', { name: 'Conversación cotidiana' });
    expect(enlace).toHaveFocus();
    // El anillo de foco lo pinta la tarjeta, no el enlace: `focus-within` es lo
    // que hace visible CUÁL de las seis tarjetas de la rejilla tiene el foco.
    expect(screen.getByRole('article', { name: 'Conversación cotidiana' })).toHaveClass(
      'focus-within:ring-2',
    );
  });

  /**
   * El `<article>` ya toma su nombre del `<h3>` por `aria-labelledby`. Si el
   * enlace envolviera la tarjeta entera, su texto accesible arrastraría la
   * fecha, el estado y el cupo, y el nombre del aula se anunciaría dos veces.
   */
  it('el enlace es solo el título: no arrastra la fecha ni el estado', () => {
    renderConProviders(<TarjetaAula classroom={aula()} ahora={AHORA} />);

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Conversación cotidiana' })).toHaveTextContent(
      /^Conversación cotidiana$/,
    );
  });
});

describe('<TarjetaAula /> — el estado se deriva, no se reimplementa (B3, AC5)', () => {
  it('un aula CANCELLED se pinta como cancelada, aunque tenga cupo libre', () => {
    renderConProviders(
      <TarjetaAula classroom={aula({ status: ClassroomStatus.CANCELLED })} ahora={AHORA} />,
    );

    expect(screen.getByText('Clase cancelada')).toBeInTheDocument();
  });

  it('un aula llena se pinta como llena', () => {
    renderConProviders(
      <TarjetaAula classroom={aula({ currentBookings: 10, maxStudents: 10 })} ahora={AHORA} />,
    );

    expect(screen.getByText('Sin cupos')).toBeInTheDocument();
  });
});

/**
 * La perspectiva del profesor (HU-207, B3/AC8). La misma tarjeta responde otra
 * pregunta: no «¿me da tiempo a reservar?» sino «¿cuánta gente viene?».
 */
describe('<TarjetaAula perspectiva="profesor" /> — la vista del dueño (AC8)', () => {
  function tarjetaDelProfesor(overrides: Partial<ClassroomListItem> = {}) {
    return renderConProviders(
      <TarjetaAula classroom={aula(overrides)} perspectiva="profesor" ahora={AHORA} />,
    );
  }

  it('muestra inscritos sobre cupo', () => {
    tarjetaDelProfesor({ currentBookings: 3, maxStudents: 10 });

    expect(screen.getByText('3 de 10 inscritos')).toBeInTheDocument();
  });

  /**
   * El AC8 dice «no cupos disponibles», y el único estado cuyo texto los
   * menciona es `ultimos-cupos`. Con 8 de 10 ocupadas el catálogo diría «Quedan
   * 2 cupos»: aquí ese badge se calla y habla el conteo de inscritos, para que
   * la tarjeta no cuente lo mismo dos veces y al revés.
   */
  it('con pocos cupos libres no dice «Quedan N cupos»: dice cuántos vienen', () => {
    tarjetaDelProfesor({ currentBookings: 8, maxStudents: 10 });

    expect(screen.queryByText('Quedan 2 cupos')).not.toBeInTheDocument();
    expect(screen.getByText('8 de 10 inscritos')).toBeInTheDocument();
  });

  it('un aula llena tampoco muestra el badge de cupo', () => {
    tarjetaDelProfesor({ currentBookings: 10, maxStudents: 10 });

    expect(screen.queryByText('Sin cupos')).not.toBeInTheDocument();
    expect(screen.getByText('10 de 10 inscritos')).toBeInTheDocument();
  });

  /**
   * AC2: los estados de ciclo de vida SÍ conservan su badge, con color + ícono
   * + texto. No salen del cupo, y sin él la tarjeta no diría qué pasó.
   */
  it.each([
    [ClassroomStatus.CANCELLED, 'Clase cancelada'],
    [ClassroomStatus.COMPLETED, 'Clase finalizada'],
  ])('un aula %s conserva su badge de estado', (status, texto) => {
    tarjetaDelProfesor({ status });

    expect(screen.getByText(texto)).toBeInTheDocument();
    // Y sigue diciendo cuánta gente había: es su registro.
    expect(screen.getByText('2 de 10 inscritos')).toBeInTheDocument();
  });

  it('el riel sigue llevando el color del estado derivado', () => {
    const { container } = tarjetaDelProfesor({ status: ClassroomStatus.CANCELLED });

    expect(container.querySelector('span[aria-hidden="true"]')).toHaveClass('bg-destructive');
  });

  // En «Mis aulas» el dueño es quien mira: su propio nombre en cada tarjeta es
  // ruido. En su lugar va la duración, que es lo que le falta para planificar.
  it('no repite el nombre del profesor; muestra nivel y duración', () => {
    tarjetaDelProfesor();

    expect(screen.queryByText(/Ana Restrepo/)).not.toBeInTheDocument();
    expect(screen.getByText('Intermedio · 1 hora')).toBeInTheDocument();
  });
});

/**
 * HU-211: el modo de comunicación en la tarjeta (T10), la marca de
 * coincidencia (T12) y la vía para completar un aula «sin indicar» (T15).
 */
describe('<TarjetaAula /> — accesibilidad declarada del aula (T10, T12, T15)', () => {
  it('sin modos declarados, muestra «Modo sin indicar»', () => {
    renderConProviders(<TarjetaAula classroom={aula({ communicationModes: [] })} ahora={AHORA} />);

    expect(screen.getByText('Modo sin indicar')).toBeInTheDocument();
  });

  it('con un modo declarado, lo muestra con su etiqueta', () => {
    renderConProviders(
      <TarjetaAula
        classroom={aula({ communicationModes: [CommunicationPreference.SIGN_LANGUAGE] })}
        ahora={AHORA}
      />,
    );

    expect(screen.getByText('Lengua de signos')).toBeInTheDocument();
  });

  // El orden CANÓNICO decide, no el de inserción: dos aulas con los mismos
  // modos en distinto orden tienen que mostrar el mismo "modo principal".
  it('con varios modos, el principal es siempre el mismo sin importar el orden de llegada', () => {
    const { rerender } = renderConProviders(
      <TarjetaAula
        classroom={aula({
          communicationModes: [
            CommunicationPreference.WRITTEN_TEXT,
            CommunicationPreference.SIGN_LANGUAGE,
          ],
        })}
        ahora={AHORA}
      />,
    );
    expect(screen.getByText('Lengua de signos')).toBeInTheDocument();
    expect(screen.queryByText('Texto escrito')).not.toBeInTheDocument();

    rerender(
      <TarjetaAula
        classroom={aula({
          communicationModes: [
            CommunicationPreference.SIGN_LANGUAGE,
            CommunicationPreference.WRITTEN_TEXT,
          ],
        })}
        ahora={AHORA}
      />,
    );
    expect(screen.getByText('Lengua de signos')).toBeInTheDocument();
    expect(screen.queryByText('Texto escrito')).not.toBeInTheDocument();
  });

  // AC4: solo marca las que coinciden, y nunca con una marca negativa.
  it('coincide con la preferencia del estudiante: muestra la marca', () => {
    renderConProviders(
      <TarjetaAula
        classroom={aula({ communicationModes: [CommunicationPreference.SIGN_LANGUAGE] })}
        preferenciaEstudiante={CommunicationPreference.SIGN_LANGUAGE}
        ahora={AHORA}
      />,
    );

    expect(screen.getByText('Coincide con tu preferencia')).toBeInTheDocument();
  });

  it('no coincide: no muestra la marca, y ninguna marca negativa la sustituye', () => {
    renderConProviders(
      <TarjetaAula
        classroom={aula({ communicationModes: [CommunicationPreference.LIP_READING] })}
        preferenciaEstudiante={CommunicationPreference.SIGN_LANGUAGE}
        ahora={AHORA}
      />,
    );

    expect(screen.queryByText('Coincide con tu preferencia')).not.toBeInTheDocument();
  });

  // AC6: sin preferencia declarada, nunca hay marca.
  it('sin preferencia declarada, no hay marca aunque el aula tenga modos', () => {
    renderConProviders(
      <TarjetaAula
        classroom={aula({ communicationModes: [CommunicationPreference.SIGN_LANGUAGE] })}
        ahora={AHORA}
      />,
    );

    expect(screen.queryByText('Coincide con tu preferencia')).not.toBeInTheDocument();
  });

  it('en la perspectiva del profesor nunca aparece la marca de coincidencia', () => {
    renderConProviders(
      <TarjetaAula
        classroom={aula({ communicationModes: [CommunicationPreference.SIGN_LANGUAGE] })}
        perspectiva="profesor"
        preferenciaEstudiante={CommunicationPreference.SIGN_LANGUAGE}
        ahora={AHORA}
      />,
    );

    expect(screen.queryByText('Coincide con tu preferencia')).not.toBeInTheDocument();
  });

  it('el profesor ve «Completar accesibilidad» cuando su aula no tiene modos', () => {
    renderConProviders(
      <TarjetaAula
        classroom={aula({ id: 'aula-42', communicationModes: [] })}
        perspectiva="profesor"
        ahora={AHORA}
      />,
    );

    expect(screen.getByRole('link', { name: 'Completar accesibilidad' })).toHaveAttribute(
      'href',
      '/mis-aulas/aula-42/accesibilidad',
    );
  });

  it('el profesor NO ve el enlace cuando su aula ya declaró modos', () => {
    renderConProviders(
      <TarjetaAula
        classroom={aula({ communicationModes: [CommunicationPreference.SIGN_LANGUAGE] })}
        perspectiva="profesor"
        ahora={AHORA}
      />,
    );

    expect(screen.queryByRole('link', { name: 'Completar accesibilidad' })).not.toBeInTheDocument();
  });

  // El catálogo es del estudiante: la acción de gestión del profesor no le sirve.
  it('en el catálogo (perspectiva estudiante) nunca aparece «Completar accesibilidad»', () => {
    renderConProviders(<TarjetaAula classroom={aula({ communicationModes: [] })} ahora={AHORA} />);

    expect(screen.queryByRole('link', { name: 'Completar accesibilidad' })).not.toBeInTheDocument();
  });
});

/**
 * HU-208 — el catálogo distingue quién lo mira (T1, T2, T3).
 *
 * La tarjeta no conoce roles ni sesión: recibe `esMia` y `puedeReservarla` ya
 * resueltos, igual que `ahora` y `preferenciaEstudiante`. Quién es quién se
 * verifica en `puede-reservar.spec.ts` y en `AulasPage.spec.tsx`.
 */
describe('<TarjetaAula esMia /> — el distintivo de la clase propia (AC1, AC2)', () => {
  it('la clase propia lleva el distintivo «Tu clase»', () => {
    renderConProviders(<TarjetaAula classroom={aula()} esMia ahora={AHORA} />);

    expect(screen.getByText('Tu clase')).toBeInTheDocument();
  });

  it('la clase de otro profesor no lo lleva', () => {
    renderConProviders(<TarjetaAula classroom={aula()} ahora={AHORA} />);

    expect(screen.queryByText('Tu clase')).not.toBeInTheDocument();
  });

  /**
   * AC2, el criterio entero. El distintivo se AÑADE al estado, no lo sustituye:
   * si al marcar la clase como propia se perdiera «Quedan 2 cupos», el profesor
   * dejaría de ver por dónde va su propia clase justo en la pantalla donde
   * coordina horarios.
   */
  it('una clase propia con últimos cupos muestra las dos cosas', () => {
    renderConProviders(
      <TarjetaAula classroom={aula({ currentBookings: 8, maxStudents: 10 })} esMia ahora={AHORA} />,
    );

    expect(screen.getByText('Tu clase')).toBeInTheDocument();
    expect(screen.getByText('Quedan 2 cupos')).toBeInTheDocument();
  });

  // La codificación triple: el distintivo no viaja solo en el color.
  it('el distintivo lleva ícono además de texto y color', () => {
    renderConProviders(<TarjetaAula classroom={aula()} esMia ahora={AHORA} />);

    const distintivo = screen.getByText('Tu clase').closest('span');
    expect(distintivo?.querySelector('svg')).toBeInTheDocument();
  });

  // En «Mis aulas» todas son suyas: marcarlas una por una no distingue nada.
  it('en la perspectiva del profesor no se pinta, aunque el aula sea suya', () => {
    renderConProviders(
      <TarjetaAula classroom={aula()} perspectiva="profesor" esMia ahora={AHORA} />,
    );

    expect(screen.queryByText('Tu clase')).not.toBeInTheDocument();
  });
});

describe('<TarjetaAula esMia /> — la acción de gestión (T2, AC3)', () => {
  it('la clase propia ofrece «Gestionar mi clase» y lleva al aula', () => {
    renderConProviders(<TarjetaAula classroom={aula({ id: 'aula-42' })} esMia ahora={AHORA} />);

    expect(screen.getByRole('link', { name: 'Gestionar mi clase' })).toHaveAttribute(
      'href',
      '/aulas/aula-42',
    );
  });

  it('la clase de otro profesor no ofrece esa acción', () => {
    renderConProviders(<TarjetaAula classroom={aula()} ahora={AHORA} />);

    expect(screen.queryByRole('link', { name: 'Gestionar mi clase' })).not.toBeInTheDocument();
  });

  // El catálogo del profesor no es «Mis aulas»: allí la acción sería redundante.
  it('en la perspectiva del profesor tampoco aparece', () => {
    renderConProviders(
      <TarjetaAula classroom={aula()} perspectiva="profesor" esMia ahora={AHORA} />,
    );

    expect(screen.queryByRole('link', { name: 'Gestionar mi clase' })).not.toBeInTheDocument();
  });
});

/**
 * AC4 — el elemento **no está en el DOM**, no está deshabilitado.
 *
 * Hoy `<AccionReservarAula>` devuelve `null` para todos, así que estos tests
 * pasan también para el estudiante. Se escriben igual, y a propósito: son la
 * red que se pone en rojo el día que HU-301 rellene ese hueco sin respetar la
 * regla. Quien decide por rol es `puedeReservar()`, con su propio spec.
 */
describe('<TarjetaAula /> — la acción de reservar (T3, AC4)', () => {
  it.each([
    ['con `puedeReservarla`', true],
    ['sin `puedeReservarla`', false],
  ])('%s, no existe ningún elemento de reservar (HU-301 aún no la trae)', (_caso, puede) => {
    renderConProviders(<TarjetaAula classroom={aula()} puedeReservarla={puede} ahora={AHORA} />);

    expect(screen.queryByRole('button', { name: /reservar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /reservar/i })).not.toBeInTheDocument();
  });

  // Ni deshabilitado: el skill prohíbe deshabilitar sin explicar.
  it('no existe ningún control deshabilitado en su lugar', () => {
    const { container } = renderConProviders(
      <TarjetaAula classroom={aula()} esMia ahora={AHORA} />,
    );

    expect(container.querySelector('[disabled], [aria-disabled="true"]')).toBeNull();
  });
});

describe('<TarjetaAula /> — accesibilidad automática', () => {
  it.each(TEMAS)('sin violaciones en el tema %s', async (tema) => {
    const { container } = renderConProviders(<TarjetaAula classroom={aula()} ahora={AHORA} />, {
      tema,
    });

    await esperarSinFallosDeAccesibilidad(container);
  });

  it.each(TEMAS)('la perspectiva del profesor, sin violaciones en el tema %s', async (tema) => {
    const { container } = renderConProviders(
      <TarjetaAula classroom={aula()} perspectiva="profesor" ahora={AHORA} />,
      { tema },
    );

    await esperarSinFallosDeAccesibilidad(container);
  });

  // AC8: la tarjeta propia añade un badge y un enlace más. El contraste del
  // distintivo y el foco del enlace nuevo se revisan también en `.dark` y `.hc`.
  it.each(TEMAS)('la tarjeta propia, sin violaciones en el tema %s', async (tema) => {
    const { container } = renderConProviders(
      <TarjetaAula classroom={aula()} esMia ahora={AHORA} />,
      { tema },
    );

    await esperarSinFallosDeAccesibilidad(container);
  });
});
