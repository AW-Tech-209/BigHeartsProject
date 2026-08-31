import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { NotificationsModule } from '../notifications/notifications.module';
import { RemindersService } from './reminders.service';

/** Cron de recordatorios de clase (HU-402, §4.6). */
@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule],
  providers: [RemindersService],
})
export class RemindersModule {}
