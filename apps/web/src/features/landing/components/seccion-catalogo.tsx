import { CommunicationPreference, EnglishLevel } from '@academia/types';
import { Info } from 'lucide-react';
import { useMemo, useState } from 'react';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { communicationPreferenceLabels } from '@/features/auth/lib/accessibility-labels';
import { nivelesDeIngles } from '@/features/aulas/lib/niveles';
import { AULAS_DEMO } from '../lib/aulas-demo';
import { RotuloSeccion, SeccionLanding } from './primitivos-landing';
import { Revelar } from './revelar';
import { TarjetaAulaDemo } from './tarjeta-aula-demo';

type FiltroCupo = '' | 'con-cupo';

export function SeccionCatalogo() {
  const [nivel, setNivel] = useState<EnglishLevel | ''>('');
  const [modo, setModo] = useState<CommunicationPreference | ''>('');
  const [cupo, setCupo] = useState<FiltroCupo>('');

  const resultados = useMemo(
    () =>
      AULAS_DEMO.filter((aula) => {
        if (nivel && aula.nivel !== nivel) return false;
        if (modo && !aula.modos.includes(modo)) return false;
        if (cupo === 'con-cupo' && aula.maxStudents - aula.currentBookings <= 0) return false;
        return true;
      }),
    [nivel, modo, cupo],
  );

  const hayFiltros = nivel !== '' || modo !== '' || cupo !== '';
  function limpiar() {
    setNivel('');
    setModo('');
    setCupo('');
  }

  const resumen =
    resultados.length === 0
      ? 'Ninguna clase coincide con estos filtros.'
      : resultados.length === 1
        ? '1 clase disponible con estos filtros.'
        : `${resultados.length} clases disponibles con estos filtros.`;

  return (
    <SeccionLanding id="catalogo" fondo="muted">
      <Revelar className="max-w-[42ch]">
        <RotuloSeccion>El catálogo, funcionando</RotuloSeccion>
        <h2 className="mt-5 text-3xl font-medium tracking-tight text-balance">
          Cada clase dice cómo se imparte, antes de entrar.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground text-pretty">
          Prueba los filtros. Son los mismos de la plataforma, con clases de ejemplo.
        </p>
      </Revelar>

      <Revelar
        retraso={80}
        className="mt-8 overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="flex flex-wrap items-end gap-4 border-b border-border p-5">
          <Field id="landing-nivel" label="Nivel" className="w-full sm:w-52">
            <NativeSelect
              value={nivel}
              onChange={(event) => setNivel(event.target.value as EnglishLevel | '')}
            >
              <option value="">Todos los niveles</option>
              {Object.entries(nivelesDeIngles).map(([valor, { nombre }]) => (
                <option key={valor} value={valor}>
                  {nombre}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field id="landing-modo" label="Modo de comunicación" className="w-full sm:w-56">
            <NativeSelect
              value={modo}
              onChange={(event) => setModo(event.target.value as CommunicationPreference | '')}
            >
              <option value="">Todos los modos</option>
              {Object.entries(communicationPreferenceLabels).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field id="landing-cupo" label="Cupo" className="w-full sm:w-44">
            <NativeSelect
              value={cupo}
              onChange={(event) => setCupo(event.target.value as FiltroCupo)}
            >
              <option value="">Todas</option>
              <option value="con-cupo">Solo con cupo</option>
            </NativeSelect>
          </Field>

          {hayFiltros && (
            <Button variant="outline" onClick={limpiar} className="h-11 px-4 text-sm">
              Quitar filtros
            </Button>
          )}
        </div>

        <p
          aria-live="polite"
          className="border-b border-border bg-background px-5 py-3.5 text-sm text-muted-foreground"
        >
          {resumen}
        </p>

        {resultados.length > 0 ? (
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {resultados.map((aula) => (
              <TarjetaAulaDemo key={aula.id} aula={aula} />
            ))}
          </div>
        ) : (
          <EstadoVacio
            ilustracion="no-encontrado"
            titular="Ninguna clase coincide con estos filtros"
            ayuda="Prueba con otro nivel o quita el filtro de modo de comunicación."
            accion={
              <Button onClick={limpiar} className="h-11 px-5 text-base">
                Quitar filtros
              </Button>
            }
          />
        )}
      </Revelar>

      <Revelar retraso={40}>
        <p className="mt-5 flex max-w-[68ch] items-start gap-2.5 text-sm text-muted-foreground">
          <Info aria-hidden="true" strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
          <span>
            El profesor <strong className="font-semibold text-foreground">declara</strong> cómo se
            imparte su clase: los modos, si hay intérprete, subtítulos en vivo o materiales
            visuales. La plataforma no los provee — los muestra, para que sepas a qué entras.
          </span>
        </p>
      </Revelar>
    </SeccionLanding>
  );
}
