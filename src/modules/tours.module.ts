import { Module } from '@nestjs/common';
import { ToursService } from '../services/tours.service';
import { ToursController } from '../controllers/tours.controller';

@Module({
  controllers: [ToursController],
  providers: [ToursService],
})
export class ToursModule {}
