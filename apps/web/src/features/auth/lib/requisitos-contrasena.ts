export type RequisitoContrasena = { texto: string; cumple: boolean };

/** Los requisitos de la contraseña, evaluados en vivo (mismos que `validatePassword`). */
export function requisitosContrasena(valor: string): RequisitoContrasena[] {
  return [
    { texto: 'Al menos 8 caracteres', cumple: valor.length >= 8 },
    { texto: 'Al menos una letra', cumple: /[A-Za-z]/.test(valor) },
    { texto: 'Al menos un número', cumple: /\d/.test(valor) },
  ];
}
