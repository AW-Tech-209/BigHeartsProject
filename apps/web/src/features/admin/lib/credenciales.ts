const fechaLarga = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

export type DatosCredenciales = {
  nombre: string;
  correo: string;
  contrasena: string;
  /** ISO 8601. */
  caducaEl: string;
  origen: string;
};

/** El bloque exacto que el admin pega en WhatsApp. */
export function construirBloqueCredenciales(datos: DatosCredenciales): string {
  return [
    `Hola ${datos.nombre}, esta es tu cuenta de BigHearts.`,
    `Entra en: ${datos.origen}/login`,
    `Correo: ${datos.correo}`,
    `Contraseña temporal: ${datos.contrasena}`,
    'Al entrar te pediremos crear tu propia contraseña.',
    `Esta contraseña caduca el ${fechaLarga.format(new Date(datos.caducaEl))} (hora de Colombia).`,
  ].join('\n');
}

/** Sin número: la persona elige el contacto en WhatsApp. */
export function urlWhatsApp(bloque: string): string {
  return `https://wa.me/?text=${encodeURIComponent(bloque)}`;
}
