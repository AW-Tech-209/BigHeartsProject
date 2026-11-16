import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
  Optional,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PapeleraService } from './papelera.service';

const INTERVALO = 'purga-papelera-diccionario';
const CADA_DIA_MS = 24 * 60 * 60 * 1000;

/** Barrido diario: elimina para siempre lo que lleva más de `DICCIONARIO_PAPELERA_DIAS` (D52). */
@Injectable()
export class PurgaPapeleraService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PurgaPapeleraService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly papelera: PapeleraService,
    private readonly config: AppConfigService,
    @Optional() private readonly scheduler?: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    const intervalo = setInterval(() => void this.ejecutar(), CADA_DIA_MS);
    this.scheduler?.addInterval(INTERVALO, intervalo);
  }

  onModuleDestroy(): void {
    if (this.scheduler?.doesExist('interval', INTERVALO)) this.scheduler.deleteInterval(INTERVALO);
  }

  async purgarVencidas(ahora = new Date()): Promise<number> {
    const limite = new Date(ahora.getTime() - this.config.papeleraDias * CADA_DIA_MS);
    const vencidas = await this.prisma.dictionaryEntry.findMany({
      where: { deletedAt: { lt: limite } },
      select: { id: true },
    });
    const { eliminadas } = await this.papelera.purgar(vencidas.map((v) => v.id));
    return eliminadas;
  }

  private async ejecutar(): Promise<void> {
    try {
      const eliminadas = await this.purgarVencidas();
      if (eliminadas > 0)
        this.logger.log(`Papelera: ${eliminadas} entradas eliminadas para siempre.`);
    } catch (error) {
      this.logger.error(`Falló la purga de la papelera: ${(error as Error).message}`);
    }
  }
}
