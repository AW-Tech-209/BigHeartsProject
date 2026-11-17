import { Global, Logger, Module } from '@nestjs/common';

import { AppConfigService } from '../config/app-config.service';
import { AlmacenamientoLocalController } from './almacenamiento-local.controller';
import { AlmacenamientoMedios } from './almacenamiento-medios';
import { LocalAlmacenamientoService } from './local-almacenamiento.service';
import { SupabaseAlmacenamientoService } from './supabase-almacenamiento.service';

/** Elige el adaptador al arrancar y lo dice en el log (D51). */
export function crearAdaptadorDeAlmacenamiento(config: AppConfigService): AlmacenamientoMedios {
  if (config.supabaseUrl && config.supabaseServiceRoleKey) {
    Logger.log(
      `Almacenamiento de medios: Supabase Storage (bucket «${config.supabaseStorageBucket}»)`,
      'AlmacenamientoModule',
    );
    return new SupabaseAlmacenamientoService(
      config.supabaseUrl,
      config.supabaseServiceRoleKey,
      config.supabaseStorageBucket,
    );
  }

  Logger.warn(
    'Sin SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY: las señas e imágenes se guardan en apps/api/storage/ (solo desarrollo).',
    'AlmacenamientoModule',
  );
  return new LocalAlmacenamientoService(config.jwtSecret, `http://localhost:${config.port}`);
}

/** Medios del diccionario: un PUERTO con dos adaptadores (D51), como las notificaciones (D14). */
@Global()
@Module({
  controllers: [AlmacenamientoLocalController],
  providers: [
    {
      provide: AlmacenamientoMedios,
      useFactory: crearAdaptadorDeAlmacenamiento,
      inject: [AppConfigService],
    },
  ],
  exports: [AlmacenamientoMedios],
})
export class AlmacenamientoModule {}
