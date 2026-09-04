/**
 * Cuánto falta para un instante, en texto literal: `En 3 días`, `En 2 horas`,
 * `En 15 minutos`, `Ahora`. Nunca figurado (`en un rato`): mucha gente lee
 * español como segunda lengua. Complementa a `describirHorario`, que da la
 * fecha y la zona exactas.
 */
export function tiempoRelativo(instanteISO: string, ahora: Date = new Date()): string {
  const ms = new Date(instanteISO).getTime() - ahora.getTime();

  if (Number.isNaN(ms)) return '';
  if (ms <= 0) return 'Ahora';

  const minutos = Math.round(ms / 60_000);
  if (minutos < 60) return minutos === 1 ? 'En 1 minuto' : `En ${minutos} minutos`;

  const horas = Math.round(minutos / 60);
  if (horas < 24) return horas === 1 ? 'En 1 hora' : `En ${horas} horas`;

  const dias = Math.round(horas / 24);
  return dias === 1 ? 'En 1 día' : `En ${dias} días`;
}
