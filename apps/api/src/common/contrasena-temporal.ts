import { randomInt } from 'node:crypto';

// Sin 0 O o 1 l I: se dicta por WhatsApp o teléfono y no debe haber dudas.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const GRUPOS = 3;
const LARGO_GRUPO = 4;

/** `Kx7m-Pq4r-Tz9w`: 12 caracteres en grupos de 4, con al menos una letra y un número. */
export function generarContrasenaTemporal(): string {
  for (;;) {
    const grupos = Array.from({ length: GRUPOS }, () =>
      Array.from({ length: LARGO_GRUPO }, () => ALFABETO[randomInt(ALFABETO.length)]).join(''),
    );
    const plana = grupos.join('');
    if (/[A-Za-z]/.test(plana) && /\d/.test(plana)) return grupos.join('-');
  }
}
