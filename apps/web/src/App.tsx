// Import del paquete compartido del monorepo.
//  - `UserRole` se usa como VALOR en runtime (es un enum, emite JS).
//  - `ApiResponse` se usa solo como TIPO (desaparece al compilar).
import { UserRole, type ApiResponse } from '@academia/types';

/** Forma del payload que devuelve `GET /health` en @academia/api. */
type HealthPayload = { status: 'ok'; uptime: number };

/**
 * Ejemplo tipado del contrato compartido con el backend. Es un valor estático:
 * en esta HU el frontend todavía no llama a la API.
 */
const ejemploRespuesta: ApiResponse<HealthPayload> = {
  success: true,
  data: { status: 'ok', uptime: 0 },
  timestamp: new Date().toISOString(),
};

export function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', lineHeight: 1.6 }}>
      <h1>Academia</h1>
      <p>Scaffold de @academia/web. Vite + React + TypeScript.</p>

      <h2>Roles desde @academia/types</h2>
      <ul>
        {Object.values(UserRole).map((rol) => (
          <li key={rol}>{rol}</li>
        ))}
      </ul>

      <h2>ApiResponse tipada</h2>
      <pre>{JSON.stringify(ejemploRespuesta, null, 2)}</pre>
    </main>
  );
}
