import { describe, expect, it } from 'vitest';

import type { AppConfigService } from '../config/app-config.service';
import { MeetingLinkCipher } from './meeting-link.cipher';

const CLAVE = 'a'.repeat(64);
const OTRA_CLAVE = 'b'.repeat(64);
const ENLACE = 'https://meet.google.com/abc-defg-hij';

function cifrador(meetingLinkKey = CLAVE): MeetingLinkCipher {
  return new MeetingLinkCipher({ meetingLinkKey } as AppConfigService);
}

/**
 * Parte un valor cifrado en sus cuatro campos, comprobando de paso que son
 * cuatro. El `split` de TypeScript devuelve `string | undefined` por posición, y
 * el test quiere fallar diciendo «el formato cambió», no con un `undefined`
 * ocho líneas más abajo.
 */
function partesDe(cifrado: string): [string, string, string, string] {
  const partes = cifrado.split('.');

  expect(partes).toHaveLength(4);
  return partes as [string, string, string, string];
}

/** Simula la manipulación: invierte el primer byte y devuelve el base64 nuevo. */
function conElPrimerByteRoto(base64: string): string {
  const bytes = Buffer.from(base64, 'base64');

  bytes.writeUInt8(bytes.readUInt8(0) ^ 0xff, 0);
  return bytes.toString('base64');
}

describe('MeetingLinkCipher', () => {
  it('descifra lo que cifró (ida y vuelta)', () => {
    const cipher = cifrador();

    expect(cipher.decrypt(cipher.encrypt(ENLACE))).toBe(ENLACE);
  });

  /**
   * La garantía del AC2 de la HU-201, verificada en el nivel donde de verdad
   * ocurre: lo que sale de aquí es lo que se escribe en la columna.
   */
  it('el texto cifrado no contiene el enlace en claro', () => {
    const cifrado = cifrador().encrypt(ENLACE);

    expect(cifrado).not.toContain(ENLACE);
    expect(cifrado).not.toContain('meet.google.com');
    expect(cifrado).not.toContain('https');
  });

  /**
   * El IV es aleatorio por llamada. Si dos cifrados del mismo enlace salieran
   * idénticos, cualquiera con acceso a la BD podría agrupar las aulas que
   * comparten sala sin descifrar nada — y en GCM, además, repetir la pareja
   * (clave, IV) rompe el cifrado entero.
   */
  it('cifrar dos veces el mismo enlace da resultados distintos', () => {
    const cipher = cifrador();

    expect(cipher.encrypt(ENLACE)).not.toBe(cipher.encrypt(ENLACE));
  });

  it('emite el formato v1.<iv>.<tag>.<ciphertext>', () => {
    const [version, iv, tag] = partesDe(cifrador().encrypt(ENLACE));

    expect(version).toBe('v1');
    expect(Buffer.from(iv, 'base64')).toHaveLength(12);
    expect(Buffer.from(tag, 'base64')).toHaveLength(16);
  });

  /**
   * La razón entera de usar GCM y no CBC: el tag detecta manipulación. Sin
   * esto, quien pudiera escribir en la base de datos cambiaría el enlace de una
   * clase por el suyo y el descifrado devolvería la URL falsa sin avisar.
   */
  it('rechaza el descifrado si alguien manipuló el tag', () => {
    const cipher = cifrador();
    const [version, iv, tag, ciphertext] = partesDe(cipher.encrypt(ENLACE));

    // Un solo byte distinto basta para que el tag deje de cuadrar.
    const manipulado = [version, iv, conElPrimerByteRoto(tag), ciphertext].join('.');

    expect(() => cipher.decrypt(manipulado)).toThrow(/MEETING_LINK_UNREADABLE/);
  });

  it('rechaza el descifrado si alguien manipuló el texto cifrado', () => {
    const cipher = cifrador();
    const [version, iv, tag, ciphertext] = partesDe(cipher.encrypt(ENLACE));

    const manipulado = [version, iv, tag, conElPrimerByteRoto(ciphertext)].join('.');

    expect(() => cipher.decrypt(manipulado)).toThrow(/MEETING_LINK_UNREADABLE/);
  });

  it('rechaza un valor cifrado con otra clave', () => {
    const cifrado = cifrador(OTRA_CLAVE).encrypt(ENLACE);

    expect(() => cifrador(CLAVE).decrypt(cifrado)).toThrow(/MEETING_LINK_UNREADABLE/);
  });

  it('rechaza un valor con formato desconocido en vez de devolver algo vacío', () => {
    const cipher = cifrador();

    // Un enlace ilegible es un incidente, no «un aula sin enlace»: devolver ''
    // haría que la pantalla mostrara una clase sin sala como si fuera normal.
    expect(() => cipher.decrypt('')).toThrow(/MEETING_LINK_UNREADABLE/);
    expect(() => cipher.decrypt('https://meet.google.com/abc')).toThrow(/MEETING_LINK_UNREADABLE/);
    expect(() => cipher.decrypt('v2.aaa.bbb.ccc')).toThrow(/MEETING_LINK_UNREADABLE/);
  });

  it('conserva acentos y caracteres no ASCII', () => {
    const cipher = cifrador();
    const enlaceRaro = 'https://ejemplo.test/sala/conversación-cotidiana?día=martes';

    expect(cipher.decrypt(cipher.encrypt(enlaceRaro))).toBe(enlaceRaro);
  });
});
