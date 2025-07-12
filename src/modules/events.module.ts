import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from '../services/events.service';
import { EventsController } from '../controllers/events.controller';
import { TicketTypesModule } from './ticket-types.module';
import { SchedulesModule } from './schedules.module';

// Importar todas las entidades necesarias
import { Event } from '../models/events/event.entity';
import { EventSchedule } from '../models/events/event-schedule.entity';
import { TicketType } from '../models/events/ticket-type.entity';
import { EventMetadata } from '../models/events/event-metadata.entity';
import { EventSeating } from '../models/events/event-seating.entity';
import { SeatMap } from '../models/events/seat-map.entity';
import { Seat } from '../models/events/seat.entity';
import { PricingRule } from '../models/events/pricing-rule.entity';
import { Discount } from '../models/events/discount.entity';
import { Media } from '../models/core/media.entity';
import { Venue } from '../models/core/venue.entity';

// Importar servicios de otros módulos si es necesario
import { UsersService } from '../services/users.service';
import { UsersModule } from './users.module';
import { EventInitializationService } from 'src/services/EventInitializationService';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventSchedule,
      TicketType,
      EventMetadata,
      EventSeating,
      SeatMap,
      Seat,
      PricingRule,
      Discount,
      Media,
      Venue,
    ]),

    // 👇 Aquí es donde debe ir UsersModule
    UsersModule,

    // Otros módulos relacionados
    TicketTypesModule,
    SchedulesModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, EventInitializationService],
  exports: [EventsService],
})
export class EventsModule {}
