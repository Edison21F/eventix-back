import { Module } from '@nestjs/common';
import { SchedulesService } from '../services/schedules.service';
import { SchedulesController } from '../controllers/schedules.controller';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
