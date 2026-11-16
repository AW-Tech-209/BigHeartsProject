import type { UrlDeSubida } from '@academia/types';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { AlmacenamientoMedios, type MetadatosObjeto } from './almacenamiento-medios';

/** Adaptador de Supabase Storage con la service role key: solo existe en el servidor. */
export class SupabaseAlmacenamientoService extends AlmacenamientoMedios {
  readonly nombre = 'Supabase Storage';
  private readonly cliente: SupabaseClient;

  constructor(
    url: string,
    serviceRoleKey: string,
    private readonly bucket: string,
  ) {
    super();
    this.cliente = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private get storage() {
    return this.cliente.storage.from(this.bucket);
  }

  // El tamaño máximo no se puede fijar en la URL firmada: se comprueba al confirmar.
  async urlDeSubida(clave: string, tipo: string): Promise<UrlDeSubida> {
    const { data, error } = await this.storage.createSignedUploadUrl(clave);
    if (error || !data) throw new Error(`Supabase no firmó la subida: ${error?.message}`);
    return { url: data.signedUrl, metodo: 'PUT', headers: { 'Content-Type': tipo } };
  }

  async urlsDeLectura(
    claves: readonly string[],
    ttlSegundos: number,
  ): Promise<Map<string, string>> {
    if (claves.length === 0) return new Map();
    const { data, error } = await this.storage.createSignedUrls([...claves], ttlSegundos);
    if (error || !data) throw new Error(`Supabase no firmó las lecturas: ${error?.message}`);
    return new Map(
      data.flatMap((d) =>
        d.path && d.signedUrl && !d.error ? [[d.path, d.signedUrl] as const] : [],
      ),
    );
  }

  async metadatos(clave: string): Promise<MetadatosObjeto | null> {
    const corte = clave.lastIndexOf('/');
    const { data, error } = await this.storage.list(clave.slice(0, corte), {
      search: clave.slice(corte + 1),
      limit: 1,
    });
    if (error) throw new Error(`Supabase no respondió por ${clave}: ${error.message}`);
    const objeto = data?.find((o) => o.name === clave.slice(corte + 1));
    const bytes = (objeto?.metadata as { size?: number } | null)?.size;
    return typeof bytes === 'number' ? { bytes } : null;
  }

  async borrar(claves: readonly string[]): Promise<void> {
    if (claves.length === 0) return;
    const { error } = await this.storage.remove([...claves]);
    if (error) throw new Error(`Supabase no borró los archivos: ${error.message}`);
  }
}
