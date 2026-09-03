import { Clock, Eye, Hand, Type, UserPlus, Users, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { RotuloSeccion, SeccionLanding } from './primitivos-landing';

const INSCRITOS: { iniciales: string; nombre: string; modo: string; icon: LucideIcon }[] = [
  { iniciales: 'MR', nombre: 'Mariana R.', modo: 'Lengua de signos', icon: Hand },
  { iniciales: 'JC', nombre: 'Julián C.', modo: 'Texto escrito', icon: Type },
  { iniciales: 'SD', nombre: 'Sofía D.', modo: 'Lectura labial', icon: Eye },
];

export function SeccionProfesores() {
  return (
    <SeccionLanding id="profesores">
      <div className="grid gap-14 lg:grid-cols-2 lg:items-start">
        <div>
          <RotuloSeccion>Para profesores</RotuloSeccion>
          <h2 className="mt-5 text-3xl font-medium tracking-tight text-balance">
            Sabes quién viene y cómo se comunica.
          </h2>
          <p className="mt-5 max-w-[52ch] text-lg text-muted-foreground text-pretty">
            Creas tu aula, pegas tu enlace de Zoom o Meet, y la plataforma se encarga del resto: los
            cupos, los recordatorios y el acceso. Antes de empezar ves tu lista de inscritos con la
            preferencia de comunicación de cada uno.
          </p>
          <Button render={<Link to="/registro" />} className="mt-8 h-12 gap-2 px-6 text-base">
            <UserPlus aria-hidden="true" strokeWidth={2} className="size-5" />
            Crear mi cuenta de profesor
          </Button>
          <p className="mt-4 flex max-w-[46ch] items-start gap-2.5 text-sm text-muted-foreground">
            <Clock
              aria-hidden="true"
              strokeWidth={2}
              className="mt-0.5 size-4 shrink-0 text-attention-soft-foreground"
            />
            <span>
              Las cuentas de profesor las aprueba la academia antes de poder publicar clases.
            </span>
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <p className="border-b border-border px-5 py-3.5 text-sm font-medium">
            Inscritos · Conversación: pedir indicaciones
          </p>
          <p className="flex items-center gap-2.5 border-b border-border px-5 py-4 text-sm font-medium text-muted-foreground">
            <Users aria-hidden="true" strokeWidth={2} className="size-4" />9 de 12 inscritos
          </p>
          <ul>
            {INSCRITOS.map(({ iniciales, nombre, modo, icon: Icono }) => (
              <li
                key={nombre}
                className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-medium text-primary-soft-foreground"
                >
                  {iniciales}
                </span>
                <span className="flex-1 text-base">{nombre}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  <Icono aria-hidden="true" strokeWidth={2} className="size-3.5" />
                  {modo}
                </span>
              </li>
            ))}
          </ul>
          <p className="px-5 py-3.5 text-sm text-muted-foreground">
            La lista no muestra el correo del estudiante. El profesor no lo necesita para preparar
            su clase.
          </p>
        </div>
      </div>
    </SeccionLanding>
  );
}
