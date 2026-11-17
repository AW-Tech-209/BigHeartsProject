import type { ResultadoValidacion } from './validar-video';

export type EstadoFila =
  | 'validando'
  | 'sin-entrada'
  | 'en-espera'
  | 'subiendo'
  | 'procesando'
  | 'lista'
  | 'error'
  | 'cancelada';

export type FilaCola<M> = {
  id: number;
  archivo: File;
  entradaId: string | null;
  estado: EstadoFila;
  motivo: string | null;
  subidos: number;
  total: number;
  /** Lo que el emparejamiento dijo de este archivo (para pintar la fila). */
  meta: M;
};

type Validado = Extract<ResultadoValidacion, { ok: true }>;

export type SubirFila = (params: {
  entradaId: string;
  archivo: File;
  validado: Validado;
  senal: AbortSignal;
  alEmpezar: (total: number) => void;
  alAvanzar: (subidos: number) => void;
  alProcesar: () => void;
}) => Promise<void>;

type Opciones = {
  validar: (archivo: File) => Promise<ResultadoValidacion>;
  subir: SubirFila;
  alTerminarUna?: () => void;
  maxSimultaneas?: number;
};

const ACTIVAS: EstadoFila[] = ['validando', 'en-espera', 'subiendo', 'procesando'];

/**
 * Cola de subida: valida cada archivo, sube de 2 en 2 en el orden en que llegaron (las filas
 * nunca se reordenan) y lo que no tiene entrada espera sin bloquear a los demás.
 */
export class ColaSubida<M> {
  private filas: FilaCola<M>[] = [];
  private validados = new Map<number, Validado>();
  private controles = new Map<number, AbortController>();
  private oyentes = new Set<() => void>();
  private siguienteId = 1;
  private pausada = false;
  private readonly max: number;

  constructor(private readonly opciones: Opciones) {
    this.max = opciones.maxSimultaneas ?? 2;
  }

  suscribir = (oyente: () => void) => {
    this.oyentes.add(oyente);
    return () => this.oyentes.delete(oyente);
  };

  obtener = () => this.filas;

  estaPausada = () => this.pausada;

  hayEnCurso = () => this.filas.some((f) => ACTIVAS.includes(f.estado));

  subiendoAhora = () =>
    this.filas.filter((f) => f.estado === 'subiendo' || f.estado === 'procesando').length;

  agregar(archivos: { archivo: File; entradaId: string | null; meta: M }[]) {
    const nuevas = archivos.map(({ archivo, entradaId, meta }): FilaCola<M> => ({
      id: this.siguienteId++,
      archivo,
      entradaId,
      estado: 'validando',
      motivo: null,
      subidos: 0,
      total: archivo.size,
      meta,
    }));
    this.filas = [...this.filas, ...nuevas];
    this.avisar();
    for (const fila of nuevas) void this.validar(fila.id);
  }

  /** Asigna (o cambia) la entrada de una fila que aún no ha empezado a subir. */
  asignar(id: number, entradaId: string, meta?: M) {
    this.actualizar(id, (f) => {
      if (!['sin-entrada', 'en-espera'].includes(f.estado)) return f;
      return { ...f, entradaId, meta: meta ?? f.meta, estado: 'en-espera' };
    });
    this.bombear();
  }

  reemplazarArchivo(id: number, archivo: File) {
    this.validados.delete(id);
    this.actualizar(id, (f) => ({
      ...f,
      archivo,
      estado: 'validando',
      motivo: null,
      subidos: 0,
      total: archivo.size,
    }));
    void this.validar(id);
  }

  pausar() {
    this.pausada = true;
    this.avisar();
  }

  reanudar() {
    this.pausada = false;
    this.avisar();
    this.bombear();
  }

  cancelarTodo() {
    for (const control of this.controles.values()) control.abort();
    this.filas = this.filas.map((f) =>
      ACTIVAS.includes(f.estado) || f.estado === 'sin-entrada' ? { ...f, estado: 'cancelada' } : f,
    );
    this.avisar();
  }

  private async validar(id: number) {
    const fila = this.filas.find((f) => f.id === id);
    if (!fila) return;
    const resultado = await this.opciones.validar(fila.archivo);
    const actual = this.filas.find((f) => f.id === id);
    if (!actual || actual.estado !== 'validando' || actual.archivo !== fila.archivo) return;
    if (!resultado.ok) {
      this.actualizar(id, (f) => ({ ...f, estado: 'error', motivo: resultado.motivo }));
      return;
    }
    this.validados.set(id, resultado);
    this.actualizar(id, (f) => ({ ...f, estado: f.entradaId ? 'en-espera' : 'sin-entrada' }));
    this.bombear();
  }

  private bombear() {
    if (this.pausada) return;
    while (this.subiendoAhora() < this.max) {
      const siguiente = this.filas.find((f) => f.estado === 'en-espera' && f.entradaId);
      if (!siguiente) return;
      this.empezar(siguiente);
    }
  }

  private empezar(fila: FilaCola<M>) {
    const validado = this.validados.get(fila.id);
    if (!validado || !fila.entradaId) return;
    const control = new AbortController();
    this.controles.set(fila.id, control);
    this.actualizar(fila.id, (f) => ({ ...f, estado: 'subiendo', subidos: 0 }));

    this.opciones
      .subir({
        entradaId: fila.entradaId,
        archivo: fila.archivo,
        validado,
        senal: control.signal,
        alEmpezar: (total) => this.actualizar(fila.id, (f) => ({ ...f, total })),
        alAvanzar: (subidos) => this.actualizar(fila.id, (f) => ({ ...f, subidos })),
        alProcesar: () =>
          this.actualizar(fila.id, (f) => ({ ...f, estado: 'procesando', subidos: f.total })),
      })
      .then(() => {
        this.actualizar(fila.id, (f) => ({ ...f, estado: 'lista' }));
        this.opciones.alTerminarUna?.();
      })
      .catch((e: unknown) => {
        const cancelada = control.signal.aborted;
        this.actualizar(fila.id, (f) => ({
          ...f,
          estado: cancelada ? 'cancelada' : 'error',
          motivo: cancelada
            ? null
            : e instanceof Error
              ? e.message
              : 'No pudimos subir este video.',
        }));
      })
      .finally(() => {
        this.controles.delete(fila.id);
        this.bombear();
      });
  }

  private actualizar(id: number, cambio: (f: FilaCola<M>) => FilaCola<M>) {
    this.filas = this.filas.map((f) => (f.id === id ? cambio(f) : f));
    this.avisar();
  }

  private avisar() {
    for (const oyente of this.oyentes) oyente();
  }
}
