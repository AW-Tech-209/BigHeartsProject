import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

/**
 * ISO 8601 con fecha, hora **y zona explícita**: `Z` o `±HH:MM`.
 *
 * La zona es obligatoria a propósito. `new Date('2026-08-12T18:00:00')` —sin
 * sufijo— se interpreta en la zona LOCAL del proceso, así que la misma cadena
 * significaría instantes distintos en el portátil de un dev y en Render. Con la
 * zona explícita, la cadena identifica un instante y solo uno, que es lo que
 * `docs/ARQUITECTURA.md` §4.7 exige de `scheduledAt`.
 */
const ISO_CON_ZONA =
  /^(?<anio>\d{4})-(?<mes>\d{2})-(?<dia>\d{2})T(?<hora>\d{2}):(?<minuto>\d{2})(:(?<segundo>\d{2}))?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Valida que el valor sea un instante ISO 8601 con zona y **en el futuro**.
 *
 * Los tres fallos posibles —formato, fecha imposible y fecha pasada— comparten
 * un solo constraint porque el `validationExceptionFactory` se queda con el
 * PRIMER mensaje de cada campo: con decoradores separados, el usuario podía
 * recibir "la fecha debe ser futura" ante una cadena malformada. El mensaje
 * exacto se elige en `defaultMessage`, ya sabiendo qué falló.
 *
 * La comparación ocurre en el **servidor** (§4.7). El reloj del navegador no
 * decide nada: el formulario replica esta regla solo para avisar antes de
 * enviar.
 */
@ValidatorConstraint({ name: 'esInstanteFuturo', async: false })
export class EsInstanteFuturoConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return diagnosticar(value) === null;
  }

  defaultMessage(args: ValidationArguments): string {
    return diagnosticar(args.value) ?? 'La fecha y la hora no son válidas.';
  }
}

/** Devuelve el mensaje del problema, o `null` si el valor es correcto. */
function diagnosticar(value: unknown): string | null {
  const partes = typeof value === 'string' ? ISO_CON_ZONA.exec(value)?.groups : undefined;

  if (!partes) {
    return 'Indica la fecha y la hora de la clase.';
  }

  if (!esFechaDeCalendario(partes)) {
    return 'Esa fecha no existe. Revisa el día y el mes.';
  }

  const instante = new Date(value as string);
  if (Number.isNaN(instante.getTime())) {
    return 'Esa fecha no existe. Revisa el día y el mes.';
  }

  if (instante.getTime() <= Date.now()) {
    return 'La clase tiene que empezar en el futuro. Elige otra fecha u otra hora.';
  }

  return null;
}

/**
 * ¿Los componentes nombran un día y una hora que existen de verdad?
 *
 * Hace falta porque **`new Date` no rechaza el 31 de febrero: lo desborda al 3
 * de marzo**. Sin esta comprobación, un profesor que se equivoca de día publica
 * la clase en otra fecha, la API responde 201 y nadie se entera hasta que
 * alguien no aparece. El patrón tampoco basta por sí solo: `\d{2}` acepta
 * igual de bien `99:99`.
 */
function esFechaDeCalendario(partes: Record<string, string | undefined>): boolean {
  const anio = Number(partes.anio);
  const mes = Number(partes.mes);
  const dia = Number(partes.dia);
  const hora = Number(partes.hora);
  const minuto = Number(partes.minuto);
  const segundo = Number(partes.segundo ?? '0');

  if (hora > 23 || minuto > 59 || segundo > 59) {
    return false;
  }

  // Si la fecha existe, construirla y volver a leerla devuelve los mismos
  // componentes; si desbordó, no.
  const probado = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    probado.getUTCFullYear() === anio &&
    probado.getUTCMonth() === mes - 1 &&
    probado.getUTCDate() === dia
  );
}

/** Decorador de campo. Ver `EsInstanteFuturoConstraint`. */
export function EsInstanteFuturo(options?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      validator: EsInstanteFuturoConstraint,
    });
  };
}
