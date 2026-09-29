import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { DIAS_PRESET, type RangoUrl } from '../lib/rango';

type Props = { rango: RangoUrl; onChange: (rango: RangoUrl) => void };

export function SelectorRango({ rango, onChange }: Props) {
  const personalizado = 'desde' in rango;
  const [abierto, setAbierto] = useState(personalizado);
  const [desde, setDesde] = useState('desde' in rango ? rango.desde : '');
  const [hasta, setHasta] = useState('hasta' in rango ? rango.hasta : '');
  const invalido = !desde || !hasta || desde > hasta;

  return (
    <div role="group" aria-label="Rango de fechas" className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {DIAS_PRESET.map((dias) => (
          <Button
            key={dias}
            variant={'dias' in rango && rango.dias === dias ? 'default' : 'outline'}
            aria-pressed={'dias' in rango && rango.dias === dias}
            onClick={() => {
              setAbierto(false);
              onChange({ dias });
            }}
            className="h-11 px-5"
          >
            Últimos {dias} días
          </Button>
        ))}
        <Button
          variant={personalizado || abierto ? 'default' : 'outline'}
          aria-pressed={personalizado || abierto}
          onClick={() => setAbierto(true)}
          className="h-11 px-5"
        >
          Personalizado
        </Button>
      </div>

      {abierto && (
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!invalido) onChange({ desde, hasta });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="metricas-desde">Desde</Label>
            <Input
              id="metricas-desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="metricas-hasta">Hasta</Label>
            <Input
              id="metricas-hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={invalido} className="h-11 px-5">
            Aplicar rango
          </Button>
          {desde && hasta && desde > hasta && (
            <p role="alert" className="basis-full text-sm text-destructive">
              La fecha «Desde» no puede ser posterior a «Hasta».
            </p>
          )}
        </form>
      )}
    </div>
  );
}
