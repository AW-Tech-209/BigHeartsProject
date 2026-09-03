import { MarcaBigHearts } from '@/components/dominio/marca-bighearts';
import { Contenedor } from '@/components/layout/contenedor';

export function PieLanding() {
  return (
    <footer className="border-t border-border bg-card">
      <Contenedor className="flex flex-wrap items-center justify-between gap-6 py-10">
        <div className="flex items-center gap-3">
          <MarcaBigHearts className="size-8" />
          <div>
            <p className="text-base font-medium text-primary">BigHearts</p>
            <p className="text-sm text-muted-foreground">
              Academia de inglés para personas sordas e hipoacúsicas
            </p>
          </div>
        </div>
        <p className="font-mono text-[13px] text-muted-foreground">Fase 1 · entorno de pruebas</p>
      </Contenedor>
    </footer>
  );
}
