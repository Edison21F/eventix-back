import { Module } from '@nestjs/common';
import { ScreeningsService } from '../services/screenings.service';
import { ScreeningsController } from '../controllers/screenings.controller';

@Module({
  controllers: [ScreeningsController],
  providers: [ScreeningsService],
})
export class ScreeningsModule {}
