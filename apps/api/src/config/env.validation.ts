import { envSchema, type Env } from './env.schema';

/**
 * Valida `process.env` contra el esquema al arrancar la app.
 *
 * @nestjs/config llama a esta función antes de instanciar ningún módulo. Si
 * lanza, Nest aborta el arranque: la app NUNCA llega a escuchar en el puerto
 * con una configuración inválida. Es deliberado — es mejor un fallo ruidoso al
 * desplegar que un fallo silencioso en el primer login de un usuario.
 *
 * @throws Error con TODAS las variables problemáticas, nombrándolas.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (result.success) {
    return result.data;
  }

  // Zod reporta todos los problemas a la vez, no solo el primero: así quien
  // configura el despliegue los arregla de una pasada.
  const problemas = result.error.issues
    .map((issue) => {
      const variable = issue.path.join('.') || '(raíz)';

      // Distinguimos "falta" de "está mal", porque se arreglan de forma
      // distinta y el mensaje crudo de Zod ("expected string, received
      // undefined") no lo deja claro a quien configura un despliegue.
      const ausente = raw[variable] === undefined || raw[variable] === '';

      return ausente
        ? `  - ${variable}: FALTA. Es obligatoria y no está definida.`
        : `  - ${variable}: valor inválido (${JSON.stringify(raw[variable])}) → ${issue.message}`;
    })
    .join('\n');

  throw new Error(
    `\n❌ Configuración de entorno inválida. La API no puede arrancar.\n\n` +
      `${problemas}\n\n` +
      `Revisa tu fichero .env (usa apps/api/.env.example como plantilla).\n`,
  );
}
