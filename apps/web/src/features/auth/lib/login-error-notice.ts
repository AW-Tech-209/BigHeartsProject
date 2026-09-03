import { ApiErrorCode } from '@academia/types';
import { Ban, CircleAlert, CircleSlash, Clock, type LucideIcon, WifiOff } from 'lucide-react';

import { ApiClientError } from '@/lib/api-error';

/**
 * Aviso que la pantalla de login muestra cuando el intento falla.
 *
 * `announcement` es el texto que se manda a la región viva: repite lo esencial
 * en una frase, porque el lector de pantalla no ve el color ni el ícono.
 */
export type LoginErrorNotice = {
  variant: 'destructive' | 'attention';
  icon: LucideIcon;
  title: string;
  message: string;
  announcement: string;
};

/**
 * Traduce el fallo de `POST /auth/login` en un aviso para el usuario.
 *
 * Se decide por el `code` estable del contrato, NUNCA por el texto del mensaje:
 * el texto puede cambiar en el backend sin previo aviso; el código no.
 *
 * Sobre el color (§4.2 de la guía de UI):
 *  - `destructive` = algo salió mal y hay que corregirlo (credenciales, red).
 *  - `attention` (ámbar) = TIEMPO. Se usa solo en los dos casos donde lo que
 *    falta es esperar: la aprobación pendiente y el límite de intentos.
 */
export function toLoginErrorNotice(error: unknown): LoginErrorNotice {
  const code = error instanceof ApiClientError ? error.code : null;

  switch (code) {
    case ApiErrorCode.INVALID_CREDENTIALS:
      return {
        variant: 'destructive',
        icon: CircleAlert,
        title: 'No pudimos iniciar tu sesión',
        message:
          'El email o la contraseña no son correctos. Revísalos e inténtalo otra vez. Si olvidaste tu contraseña, usa «¿Olvidaste tu contraseña?» para crear una nueva.',
        announcement: 'El email o la contraseña no son correctos.',
      };

    case ApiErrorCode.ACCOUNT_SUSPENDED:
      return {
        variant: 'destructive',
        icon: Ban,
        title: 'Tu cuenta está suspendida',
        message:
          'Un administrador suspendió tu cuenta, así que no puedes entrar. Escribe al equipo de soporte para saber por qué y cómo recuperarla.',
        announcement: 'Tu cuenta está suspendida. Contacta con el equipo de soporte.',
      };

    case ApiErrorCode.ACCOUNT_PENDING:
      return {
        variant: 'attention',
        icon: Clock,
        title: 'Tu cuenta está pendiente de aprobación',
        message:
          'Un administrador debe aprobar tu cuenta antes de que puedas entrar. Te avisaremos por correo cuando esté lista.',
        announcement: 'Tu cuenta está pendiente de aprobación.',
      };

    /*
      Tiene su propio caso y no comparte el de SUSPENDED a propósito (D13):
      esta cuenta NUNCA estuvo activa, así que «un administrador suspendió tu
      cuenta» sería falso. `destructive` y no `attention`, porque aquí no falta
      esperar: la decisión ya se tomó.
    */
    case ApiErrorCode.ACCOUNT_REJECTED:
      return {
        variant: 'destructive',
        icon: CircleSlash,
        title: 'Tu solicitud no fue aprobada',
        message:
          'Un administrador revisó tu solicitud de cuenta de profesor y no la aprobó, así que no puedes entrar. Escribe al equipo de soporte si crees que es un error.',
        announcement: 'Tu solicitud de cuenta de profesor no fue aprobada.',
      };

    case ApiErrorCode.TOO_MANY_REQUESTS:
      return {
        variant: 'attention',
        icon: Clock,
        title: 'Demasiados intentos seguidos',
        message:
          'Por seguridad bloqueamos los intentos durante un minuto. Espera un momento y vuelve a intentarlo.',
        announcement: 'Demasiados intentos. Espera un minuto e inténtalo otra vez.',
      };

    case 'NETWORK_ERROR':
      return {
        variant: 'destructive',
        icon: WifiOff,
        title: 'No pudimos conectar con el servidor',
        message: 'Revisa tu conexión a internet e inténtalo otra vez.',
        announcement: 'No pudimos conectar con el servidor.',
      };

    default:
      return {
        variant: 'destructive',
        icon: CircleAlert,
        title: 'No pudimos iniciar tu sesión',
        message:
          error instanceof ApiClientError && error.message
            ? error.message
            : 'Ocurrió un problema al iniciar sesión. Inténtalo otra vez en unos segundos.',
        announcement: 'No pudimos iniciar tu sesión.',
      };
  }
}
