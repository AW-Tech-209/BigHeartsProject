import { type ResultadoBusqueda, TramoModulo } from '@academia/types';

export const CLAVE_RECIENTES = 'bighearts:diccionario:recientes';
export const MAX_RECIENTES = 6;

export type EntradaReciente = {
  slug: string;
  ingles: string;
  espanol: string;
  modulo: number;
  tramo: TramoModulo;
  categoria: string;
  icono: string;
};

const EVENTO = 'bighearts:diccionario:recientes';

function esReciente(valor: unknown): valor is EntradaReciente {
  const r = valor as EntradaReciente;
  return (
    typeof r === 'object' &&
    r !== null &&
    typeof r.slug === 'string' &&
    typeof r.ingles === 'string' &&
    typeof r.espanol === 'string' &&
    typeof r.modulo === 'number' &&
    Object.values(TramoModulo).includes(r.tramo)
  );
}

export function leerRecientes(): EntradaReciente[] {
  try {
    const crudo: unknown = JSON.parse(localStorage.getItem(CLAVE_RECIENTES) ?? '[]');
    return Array.isArray(crudo) ? crudo.filter(esReciente).slice(0, MAX_RECIENTES) : [];
  } catch {
    return [];
  }
}

function guardar(lista: EntradaReciente[]) {
  try {
    if (lista.length === 0) localStorage.removeItem(CLAVE_RECIENTES);
    else localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(lista));
  } catch {
    // Sin almacenamiento (modo privado): la lista simplemente no se recuerda.
  }
  window.dispatchEvent(new Event(EVENTO));
}

/** La entrada abierta pasa a ser la primera; sin repetidas y con un máximo de 6. */
export function registrarReciente(entrada: EntradaReciente): void {
  guardar(
    [entrada, ...leerRecientes().filter((r) => r.slug !== entrada.slug)].slice(0, MAX_RECIENTES),
  );
}

export function borrarRecientes(): void {
  guardar([]);
}

export function suscribirRecientes(aviso: () => void): () => void {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener('storage', aviso);
  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener('storage', aviso);
  };
}

/** Registra el resultado como visto y devuelve la ruta de su entrada. */
export function abrirEntrada(resultado: ResultadoBusqueda): string {
  registrarReciente({
    slug: resultado.slug,
    ingles: resultado.ingles,
    espanol: resultado.espanol,
    modulo: resultado.modulo.numero,
    tramo: resultado.modulo.tramo,
    categoria: resultado.categoria.nombre,
    icono: resultado.categoria.icono,
  });
  return `/diccionario/entrada/${resultado.slug}`;
}
