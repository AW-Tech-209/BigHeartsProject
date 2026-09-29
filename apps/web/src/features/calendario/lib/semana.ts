import type { AulaEnCalendario } from '../components/evento-calendario';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function aClaveDia(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Medianoche local de una clave `YYYY-MM-DD` (no `new Date(clave)`, que sería UTC). */
export function deClaveDia(clave: string): Date {
  const [anio, mes, dia] = clave.split('-').map(Number) as [number, number, number];
  return new Date(anio, mes - 1, dia);
}

export function sumarDias(fecha: Date, dias: number): Date {
  const siguiente = new Date(fecha);
  siguiente.setDate(siguiente.getDate() + dias);
  return siguiente;
}

/** El lunes de la semana de `fecha`, a medianoche local. */
export function lunesDe(fecha: Date): Date {
  const dia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  return sumarDias(dia, -((dia.getDay() + 6) % 7));
}

/** La semana de la URL (`semana=YYYY-MM-DD`, normalizada a su lunes) o la actual. */
export function leerSemana(params: URLSearchParams, hoy: Date = new Date()): string {
  const valor = params.get('semana');
  const fecha = valor && FECHA.test(valor) ? deClaveDia(valor) : null;
  return aClaveDia(lunesDe(fecha && !Number.isNaN(fecha.getTime()) ? fecha : hoy));
}

/** `[desde, hasta)` de la semana, como instantes ISO: de un lunes local al siguiente. */
export function rangoDeSemana(lunes: string): { desde: string; hasta: string } {
  const inicio = deClaveDia(lunes);
  return { desde: inicio.toISOString(), hasta: sumarDias(inicio, 7).toISOString() };
}

export function diasDeSemana(lunes: string): Date[] {
  const inicio = deClaveDia(lunes);
  return Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i));
}

/** Agrupa por el día LOCAL de cada clase: la de las 00:30 UTC cae en el día anterior en Colombia. */
export function agruparPorDia(items: AulaEnCalendario[]): Map<string, AulaEnCalendario[]> {
  const porDia = new Map<string, AulaEnCalendario[]>();
  for (const aula of items) {
    const clave = aClaveDia(new Date(aula.scheduledAt));
    porDia.set(clave, [...(porDia.get(clave) ?? []), aula]);
  }
  return porDia;
}

/** `del 28 de sep. al 4 de oct.` */
export function describirSemana(lunes: string): string {
  const formato = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });
  const inicio = deClaveDia(lunes);
  return `del ${formato.format(inicio)} al ${formato.format(sumarDias(inicio, 6))}`;
}
