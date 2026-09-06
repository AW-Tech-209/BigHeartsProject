const CLAVE = 'bh.session-hint';

/**
 * Marca de «aquí hubo sesión alguna vez». NO es un token ni un dato sensible:
 * solo evita que un visitante nuevo espere a un `/auth/refresh` que no puede
 * tener éxito. Se lee en el arranque para decidir si vale la pena intentarlo.
 */
export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(CLAVE) === '1';
  } catch {
    return false;
  }
}

export function setSessionHint(): void {
  try {
    localStorage.setItem(CLAVE, '1');
  } catch {
    // Modo privado o almacenamiento bloqueado: sin marca se pierde el atajo,
    // no la sesión.
  }
}

export function clearSessionHint(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Ídem.
  }
}
