import { Module } from '@nestjs/common';

import { DiccionarioController } from './diccionario.controller';
import { DiccionarioService } from './diccionario.service';

@Module({
  controllers: [DiccionarioController],
  providers: [DiccionarioService],
})
export class DiccionarioModule {}
