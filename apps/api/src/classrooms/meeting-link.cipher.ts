import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { AppConfigService } from '../config/app-config.service';

/**
 * Algoritmo y tamaños. AES-256-GCM es **autenticado**: además de cifrar,
 * produce un tag que detecta cualquier manipulación del texto cifrado. Esa es
 * la razón de elegirlo sobre CBC — sin autenticación, alguien con acceso de
 * escritura a la BD podría alterar el enlace guardado y el descifrado
 * devolvería una URL distinta sin que nada avisara. Aquí, romper un byte hace
 * que `decrypt` lance.
 */
const ALGORITMO = 'aes-256-gcm';
/** 96 bits: el tamaño de IV recomendado para GCM (NIST SP 800-38D §8.2). */
const IV_BYTES = 12;

/**
 * Prefijo de versión del formato. Existe para que añadir rotación de claves en
 * el futuro no obligue a migrar las filas ya guardadas: bastará con emitir
 * `v2.` y seguir aceptando `v1.` al leer. En Fase 1 solo hay una clave.
 */
const VERSION = 'v1';

/**
 * Cifra y descifra el enlace de la videollamada (`docs/ARQUITECTURA.md` §4.1).
 *
 * **Es el dato más sensible del producto.** Un enlace filtrado convierte una
 * clase con cupo controlado en una sala pública, que es exactamente lo que esta
 * plataforma existe para evitar. Por eso `Classroom.meetingLink` nunca se
 * guarda en claro: en la columna solo hay texto cifrado, y quien lea la base de
 * datos por su cuenta —un backup, un `SELECT` de soporte, una fuga— no obtiene
 * ninguna URL.
 *
 * Vive en `classrooms/` y no en `common/` a propósito: la clave y el formato
 * son de la columna que este módulo posee. Cuando HU-303 necesite descifrar
 * para un estudiante dentro de la ventana, importará `ClassroomsModule`, y así
 * el alcance del secreto sigue siendo visible en el grafo de módulos.
 *
 * **Nunca loguees ni el texto en claro ni el cifrado.**
 */
@Injectable()
export class MeetingLinkCipher {
  /** La clave en bytes. Se deriva una sola vez: `Buffer.from` por operación sería ruido. */
  private readonly key: Buffer;

  constructor(config: AppConfigService) {
    // El esquema de entorno ya garantizó 64 caracteres hexadecimales, así que
    // aquí no hace falta volver a validar: si esto se ejecuta, la app arrancó.
    this.key = Buffer.from(config.meetingLinkKey, 'hex');
  }

  /**
   * Cifra el enlace. Devuelve `v1.<iv>.<tag>.<ciphertext>`, los tres en base64.
   *
   * El IV es **aleatorio y distinto en cada llamada**, y viaja junto al texto
   * cifrado porque no es secreto: lo que no puede repetirse es la pareja
   * (clave, IV). Reutilizarlo en GCM rompe el cifrado por completo, así que no
   * se deriva del aula ni de nada estable.
   *
   * Los tres campos van separados en vez de concatenados en un solo blob para
   * que el formato sea legible al depurar: al mirar la columna se ve de un
   * vistazo qué versión es y que hay un tag, sin tener que recordar offsets.
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITMO, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [
      VERSION,
      iv.toString('base64'),
      tag.toString('base64'),
      ciphertext.toString('base64'),
    ].join('.');
  }

  /**
   * Descifra un valor producido por `encrypt`.
   *
   * @throws Error si el formato no es el esperado, si el tag no cuadra (alguien
   * manipuló la fila) o si la clave no es la que cifró. Los tres casos son
   * `MEETING_LINK_UNREADABLE` y **se tratan igual a propósito**: distinguirlos
   * en la respuesta le diría a quien manipula la BD si acertó con la clave.
   *
   * Nunca devuelve una cadena vacía ni `null` ante un fallo: un enlace ilegible
   * es un incidente, no un aula sin enlace.
   */
  decrypt(payload: string): string {
    const [version, ivB64, tagB64, ciphertextB64] = payload.split('.');

    if (version !== VERSION || !ivB64 || !tagB64 || !ciphertextB64) {
      throw new Error(
        'MEETING_LINK_UNREADABLE: el enlace guardado no tiene un formato reconocible.',
      );
    }

    try {
      const decipher = createDecipheriv(ALGORITMO, this.key, Buffer.from(ivB64, 'base64'));
      decipher.setAuthTag(Buffer.from(tagB64, 'base64'));

      // `final()` es quien verifica el tag: si el texto cifrado, el IV o el tag
      // fueron alterados, lanza aquí en vez de devolver basura.
      return Buffer.concat([
        decipher.update(Buffer.from(ciphertextB64, 'base64')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      // El error original se descarta: su mensaje varía según qué falló y sería
      // un oráculo para quien pruebe claves contra la base de datos.
      throw new Error('MEETING_LINK_UNREADABLE: no se pudo descifrar el enlace guardado.');
    }
  }
}
