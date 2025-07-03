import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { TicketTypesModule } from './ticket-types/ticket-types.module';
import { SchedulesModule } from './schedules/schedules.module';

@Module({
  controllers: [EventsController],
  providers: [EventsService],
  imports: [TicketTypesModule, SchedulesModule],
})
export class EventsModule {}
