import { Module } from '@nestjs/common';
import { TicketTypesService } from '../services/ticket-types.service';
import { TicketTypesController } from '../controllers/ticket-types.controller';

@Module({
  controllers: [TicketTypesController],
  providers: [TicketTypesService],
})
export class TicketTypesModule {}
