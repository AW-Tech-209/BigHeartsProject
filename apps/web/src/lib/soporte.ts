export type Soporte = {
  /** Solo dígitos con indicativo, listo para `wa.me/<número>`. */
  whatsapp: string | null;
  correo: string | null;
};

type EntornoSoporte = {
  VITE_SUPPORT_WHATSAPP?: string;
  VITE_SUPPORT_EMAIL?: string;
};

// Un valor mal escrito se trata como ausente: mejor sin canal que un enlace roto.
const WHATSAPP = /^\d{8,15}$/;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function leerSoporte(env: EntornoSoporte): Soporte {
  const whatsapp = env.VITE_SUPPORT_WHATSAPP?.trim() ?? '';
  const correo = env.VITE_SUPPORT_EMAIL?.trim() ?? '';
  return {
    whatsapp: WHATSAPP.test(whatsapp) ? whatsapp : null,
    correo: CORREO.test(correo) ? correo : null,
  };
}

export const SOPORTE: Soporte = leerSoporte(import.meta.env);

export const HORARIO_DE_SOPORTE = 'Respondemos de lunes a viernes, de 8:00 a. m. a 6:00 p. m.';

const PANTALLAS: [RegExp, string][] = [
  [/^\/$/, 'Inicio'],
  [/^\/login$/, 'Inicia sesión'],
  [/^\/registro$/, 'Crea tu cuenta'],
  [/^\/recuperar-contrasena$/, 'Recupera tu contraseña'],
  [/^\/nueva-contrasena$/, 'Crea una contraseña nueva'],
  [/^\/panel$/, 'Panel'],
  [/^\/perfil$/, 'Tu perfil'],
  [/^\/admin\/aulas$/, 'Supervisión de aulas'],
  [/^\/aulas$/, 'Aulas'],
  [/^\/aulas\/[^/]+$/, 'Detalle de la clase'],
  [/^\/mis-clases$/, 'Mis clases'],
  [/^\/mis-aulas$/, 'Mis aulas'],
  [/^\/mis-aulas\/nueva$/, 'Crear una clase'],
  [/^\/mis-aulas\/[^/]+\/accesibilidad$/, 'Accesibilidad de la clase'],
  [/^\/mis-aulas\/[^/]+\/editar$/, 'Editar la clase'],
  [/^\/historial$/, 'Historial'],
];

/** Nombre fijo por ruta: el `<h1>` puede llevar el nombre de la persona. */
export function nombreDePantalla(pathname: string): string {
  const ruta = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  return PANTALLAS.find(([patron]) => patron.test(ruta))?.[1] ?? 'BigHearts';
}

export function mensajeDeAyuda(pantalla: string, clase: string | null): string {
  return `Hola, necesito ayuda en BigHearts. Estoy en: ${pantalla}${clase ? ` · Clase: ${clase}` : ''}`;
}

export function enlaceDeWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
