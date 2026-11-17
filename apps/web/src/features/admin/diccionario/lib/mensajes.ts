import type { EntradaAdmin } from '@academia/types';

export function mensajeGuardada(entrada: EntradaAdmin): string {
  return entrada.publicada
    ? `Entrada guardada · ${entrada.ingles} ya se ve en el diccionario`
    : `Entrada guardada · ${entrada.ingles} está oculta: solo la ves tú`;
}
