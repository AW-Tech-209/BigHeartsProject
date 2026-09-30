import { Module } from '@nestjs/common';
import { ConfigPublicaController } from './config-publica.controller';

@Module({
  controllers: [ConfigPublicaController],
})
export class ConfigPublicaModule {}
